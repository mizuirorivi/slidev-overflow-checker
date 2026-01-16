import { Browser, Page, chromium, firefox, webkit } from 'playwright';
import { PageNavigator } from './PageNavigator';
import { OverflowDetector } from './OverflowDetector';
import { CheckerOptions, CheckResult, SlideResult, DetectionConfig } from '../types';
import { ConsoleReporter } from '../reporters/ConsoleReporter';
import { JsonReporter } from '../reporters/JsonReporter';
import { HtmlReporter } from '../reporters/HtmlReporter';
import { SlideMapper } from '../parsers/SlideMapper';
import { SlidevLauncher } from '../launchers/SlidevLauncher';
import { ScreenshotCapture } from '../utils/ScreenshotCapture';
import { join } from 'path';

export class SlidevChecker {
  private options: CheckerOptions;
  private browser?: Browser;
  private page?: Page;
  private launcher?: SlidevLauncher;

  constructor(options: CheckerOptions) {
    this.options = {
      threshold: 1,
      wait: 1000,
      viewport: { width: 1920, height: 1080 },
      browser: 'chromium',
      headless: true,
      verbose: false,
      exclude: ['.slidev-page-indicator', '.slidev-nav'],
      ...options,
    };
  }

  /**
   * Execute check
   */
  async check(): Promise<CheckResult> {
    let url = this.options.url;

    // Auto-launch Slidev if --slides option is specified
    if (this.options.slides && !url) {
      console.log('Launching Slidev...');
      this.launcher = new SlidevLauncher();
      url = await this.launcher.launch(this.options.slides, { timeout: 30000 });
      console.log(`Slidev started at ${url}`);
    }

    if (!url) {
      throw new Error('URL or slides path is required');
    }

    try {
      // Launch browser
      await this.launchBrowser();

      // Create page
      await this.createPage();

      // Navigate to Slidev page
      await this.navigateToUrl(url);

      // Execute check
      const result = await this.performCheck();

      return result;
    } finally {
      // Cleanup
      await this.cleanup();
    }
  }

  /**
   * Launch browser
   */
  private async launchBrowser(): Promise<void> {
    const browserType = this.options.browser ?? 'chromium';

    switch (browserType) {
      case 'chromium':
        this.browser = await chromium.launch({
          headless: this.options.headless ?? true,
        });
        break;
      case 'firefox':
        this.browser = await firefox.launch({
          headless: this.options.headless ?? true,
        });
        break;
      case 'webkit':
        this.browser = await webkit.launch({
          headless: this.options.headless ?? true,
        });
        break;
      default:
        throw new Error(`Unsupported browser: ${browserType}`);
    }
  }

  /**
   * Create page
   */
  private async createPage(): Promise<void> {
    if (!this.browser) {
      throw new Error('Browser not launched');
    }

    this.page = await this.browser.newPage({
      viewport: this.options.viewport,
    });
  }

  /**
   * Navigate to URL
   */
  private async navigateToUrl(url: string): Promise<void> {
    if (!this.page) {
      throw new Error('Page not created');
    }

    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], chunkCount: number): T[][] {
    const chunks: T[][] = [];
    const chunkSize = Math.ceil(array.length / chunkCount);

    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }

    return chunks;
  }

  /**
   * Execute check
   */
  private async performCheck(): Promise<CheckResult> {
    if (!this.page) {
      throw new Error('Page not created');
    }

    const navigator = new PageNavigator(this.page, {
      wait: this.options.wait,
    });

    // Wait for Slidev to be ready
    await navigator.waitForReady();

    // Get total slide count
    const totalSlides = await navigator.getTotalSlides();

    if (totalSlides === 0) {
      throw new Error('No slides found in the presentation');
    }

    // Parse page range
    const pageRange = this.parsePageRange(this.options.pages, totalSlides);

    // Load Markdown if project path is specified
    let slideMapper: SlideMapper | null = null;
    if (this.options.project) {
      try {
        slideMapper = new SlideMapper();
        await slideMapper.loadProject(this.options.project);
      } catch (error) {
        console.warn('Warning: Could not load project markdown:', error);
      }
    }

    // Reporter
    const reporter = new ConsoleReporter(this.options.verbose);

    // Detection configuration
    const detectionConfig: DetectionConfig = {
      textOverflow: true,
      elementOverflow: true,
      scrollbar: true,
      exclude: this.options.exclude ?? [],
      threshold: this.options.threshold ?? 1,
    };

    // For parallel execution
    const concurrency = this.options.concurrency ?? 1;
    const slides: SlideResult[] = [];

    if (concurrency > 1) {
      // Parallel check
      const slideChunks = this.chunkArray(pageRange, concurrency);

      await Promise.all(
        slideChunks.map(async (chunk, _workerIndex) => {
          // Create page for each worker
          const workerPage = await this.browser!.newPage({
            viewport: this.options.viewport,
          });

          try {
            // Navigate to URL
            await workerPage.goto(this.options.url || '', { waitUntil: 'networkidle' });

            const workerNavigator = new PageNavigator(workerPage, {
              wait: this.options.wait,
            });

            await workerNavigator.waitForReady();

            // Check slides assigned to this worker
            for (const slideNumber of chunk) {
              reporter.reportSlideStart(slideNumber, totalSlides);

              await workerNavigator.navigateToSlide(slideNumber);

              const detector = new OverflowDetector(workerPage, detectionConfig);
              let issues = await detector.detectIssues();

              if (slideMapper) {
                issues = issues.map(issue => slideMapper!.addSourceInfo(slideNumber, issue));
              }

              reporter.reportSlideIssues(slideNumber, issues);

              let screenshotPath: string | undefined;
              if (this.options.screenshot?.enabled && issues.length > 0) {
                const screenshotCapture = new ScreenshotCapture(workerPage);
                const outputDir = this.options.screenshot.outputDir ?? './screenshots';
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                screenshotPath = join(outputDir, `slide-${slideNumber}-${timestamp}.png`);

                if (this.options.screenshot.highlightIssues ?? true) {
                  const selectors = issues.map(issue => issue.element.selector);
                  await screenshotCapture.captureWithHighlights(screenshotPath, selectors, {
                    fullPage: this.options.screenshot.fullPage ?? false,
                  });
                } else {
                  await screenshotCapture.takeScreenshot(screenshotPath, {
                    fullPage: this.options.screenshot.fullPage ?? false,
                  });
                }
              }

              if (issues.length > 0) {
                slides.push({
                  page: slideNumber,
                  issueCount: issues.length,
                  issues,
                  screenshot: screenshotPath,
                });
              }
            }
          } finally {
            await workerPage.close();
          }
        })
      );
    } else {
      // Sequential check (traditional method)
      for (const slideNumber of pageRange) {
        reporter.reportSlideStart(slideNumber, totalSlides);

        await navigator.navigateToSlide(slideNumber);

        const detector = new OverflowDetector(this.page, detectionConfig);
        let issues = await detector.detectIssues();

        if (slideMapper) {
          issues = issues.map(issue => slideMapper!.addSourceInfo(slideNumber, issue));
        }

        reporter.reportSlideIssues(slideNumber, issues);

        let screenshotPath: string | undefined;
        if (this.options.screenshot?.enabled && issues.length > 0) {
          const screenshotCapture = new ScreenshotCapture(this.page);
          const outputDir = this.options.screenshot.outputDir ?? './screenshots';
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          screenshotPath = join(outputDir, `slide-${slideNumber}-${timestamp}.png`);

          if (this.options.screenshot.highlightIssues ?? true) {
            const selectors = issues.map(issue => issue.element.selector);
            await screenshotCapture.captureWithHighlights(screenshotPath, selectors, {
              fullPage: this.options.screenshot.fullPage ?? false,
            });
          } else {
            await screenshotCapture.takeScreenshot(screenshotPath, {
              fullPage: this.options.screenshot.fullPage ?? false,
            });
          }
        }

        if (issues.length > 0) {
          slides.push({
            page: slideNumber,
            issueCount: issues.length,
            issues,
            screenshot: screenshotPath,
          });
        }
      }
    }

    // Aggregate results
    const result = this.aggregateResults(totalSlides, slides);

    // Report summary
    reporter.reportSummary(result);

    // Output reports in other formats
    await this.outputReports(result);

    return result;
  }

  /**
   * Output reports
   */
  private async outputReports(result: CheckResult): Promise<void> {
    const formats = this.options.format ?? ['console'];
    const outputDir = this.options.output ?? './reports';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    for (const format of formats) {
      try {
        if (format === 'json') {
          const jsonReporter = new JsonReporter();
          const outputPath = join(outputDir, `overflow-report-${timestamp}.json`);
          await jsonReporter.report(result, outputPath);
        } else if (format === 'html') {
          const htmlReporter = new HtmlReporter();
          const outputPath = join(outputDir, `overflow-report-${timestamp}.html`);
          await htmlReporter.report(result, outputPath);
        }
      } catch (error) {
        console.error(`Error generating ${format} report:`, error);
      }
    }
  }

  /**
   * Parse page range
   */
  private parsePageRange(range: string | undefined, totalSlides: number): number[] {
    if (!range) {
      // All pages
      return Array.from({ length: totalSlides }, (_, i) => i + 1);
    }

    const pages: number[] = [];

    // Support "1-10" or "5" format
    const parts = range.split(',');

    for (const part of parts) {
      const trimmed = part.trim();

      if (trimmed.includes('-')) {
        // Range specification
        const [start, end] = trimmed.split('-').map(s => parseInt(s.trim(), 10));
        if (isNaN(start) || isNaN(end)) {
          throw new Error(`Invalid page range: ${trimmed}`);
        }

        for (let i = start; i <= Math.min(end, totalSlides); i++) {
          pages.push(i);
        }
      } else {
        // Single page
        const pageNum = parseInt(trimmed, 10);
        if (isNaN(pageNum)) {
          throw new Error(`Invalid page number: ${trimmed}`);
        }

        if (pageNum >= 1 && pageNum <= totalSlides) {
          pages.push(pageNum);
        }
      }
    }

    return [...new Set(pages)].sort((a, b) => a - b);
  }

  /**
   * Aggregate results
   */
  private aggregateResults(totalSlides: number, slides: SlideResult[]): CheckResult {
    const slidesWithIssues = slides.map(s => s.page);
    const issuesFound = slides.reduce((sum, s) => sum + s.issueCount, 0);

    // Aggregate by issue type
    const textOverflowSlides = new Set<number>();
    const elementOverflowSlides = new Set<number>();
    const scrollbarSlides = new Set<number>();

    slides.forEach(slide => {
      slide.issues.forEach(issue => {
        switch (issue.type) {
          case 'text-overflow':
            textOverflowSlides.add(slide.page);
            break;
          case 'element-overflow':
            elementOverflowSlides.add(slide.page);
            break;
          case 'scrollbar':
            scrollbarSlides.add(slide.page);
            break;
        }
      });
    });

    return {
      timestamp: new Date().toISOString(),
      totalSlides,
      slidesWithIssues,
      issuesFound,
      summary: {
        textOverflow: {
          count: textOverflowSlides.size,
          slides: Array.from(textOverflowSlides).sort((a, b) => a - b),
        },
        elementOverflow: {
          count: elementOverflowSlides.size,
          slides: Array.from(elementOverflowSlides).sort((a, b) => a - b),
        },
        scrollbar: {
          count: scrollbarSlides.size,
          slides: Array.from(scrollbarSlides).sort((a, b) => a - b),
        },
      },
      slides,
    };
  }

  /**
   * Cleanup
   */
  private async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = undefined;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
    }

    // Stop Slidev process
    if (this.launcher) {
      console.log('Stopping Slidev...');
      await this.launcher.stop();
      this.launcher = undefined;
    }
  }
}
