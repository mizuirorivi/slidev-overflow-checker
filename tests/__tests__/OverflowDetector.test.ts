import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import { OverflowDetector } from '../../src/checker/OverflowDetector';
import { DetectionConfig } from '../../src/types';

describe('OverflowDetector', () => {
  let browser: Browser;
  let page: Page;

  const defaultConfig: DetectionConfig = {
    textOverflow: true,
    elementOverflow: true,
    scrollbar: true,
    exclude: ['.slidev-page-indicator', '.slidev-nav'],
    threshold: 1,
  };

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await page.close();
    await browser.close();
  });

  describe('detectTextOverflow', () => {
    it('should detect text overflow when content exceeds container', async () => {
      await page.setContent(`
        <html>
          <body>
            <div class="slidev-page" style="width: 980px; height: 552px; position: relative;">
              <div class="slidev-layout">
                <div style="width: 200px;">
                  <h1 style="width: 500px; white-space: nowrap; overflow: hidden;">
                    This is a very long title that will overflow
                  </h1>
                </div>
              </div>
            </div>
          </body>
        </html>
      `);

      await page.waitForTimeout(100); // Wait for layout

      const detector = new OverflowDetector(page, defaultConfig);
      const issues = await detector.detectIssues();

      expect(issues.length).toBeGreaterThan(0);
      const textOverflowIssues = issues.filter(i => i.type === 'text-overflow');
      expect(textOverflowIssues.length).toBeGreaterThan(0);
      expect(textOverflowIssues[0].element.tag).toBe('h1');
    });

    it('should not detect overflow when content fits', async () => {
      await page.setContent(`
        <html>
          <body>
            <div class="slidev-page" style="width: 980px; height: 552px; position: relative;">
              <div class="slidev-layout">
                <div style="width: 500px;">
                  <h1 style="width: 200px;">Short title</h1>
                </div>
              </div>
            </div>
          </body>
        </html>
      `);

      await page.waitForTimeout(100);

      const detector = new OverflowDetector(page, defaultConfig);
      const issues = await detector.detectIssues();

      expect(issues.length).toBe(0);
    });

    it('should exclude elements matching exclude selectors', async () => {
      await page.setContent(`
        <html>
          <body>
            <div class="slidev-page" style="width: 980px; height: 552px; position: relative;">
              <div class="slidev-layout">
                <div style="width: 200px;">
                  <div class="slidev-page-indicator" style="width: 500px; overflow: hidden; white-space: nowrap;">
                    Should be excluded because it matches .slidev-page-indicator
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `);

      await page.waitForTimeout(100);

      const detector = new OverflowDetector(page, defaultConfig);
      const issues = await detector.detectIssues();

      // .slidev-page-indicatorは除外されるべき
      expect(issues.length).toBe(0);
    });
  });

  describe('detectElementOverflow', () => {
    it('should detect element overflowing slide bounds', async () => {
      await page.setContent(`
        <html>
          <body>
            <div class="slidev-page" style="position: relative; width: 980px; height: 552px; overflow: hidden;">
              <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                   style="position: absolute; left: 900px; width: 200px; height: 100px;"
                   alt="Overflowing image" />
            </div>
          </body>
        </html>
      `);

      await page.waitForTimeout(100);

      const detector = new OverflowDetector(page, defaultConfig);
      const issues = await detector.detectIssues();

      const elementOverflows = issues.filter(i => i.type === 'element-overflow');
      expect(elementOverflows.length).toBeGreaterThan(0);
    });
  });

  describe('detectScrollbar', () => {
    it('should detect vertical scrollbar', async () => {
      await page.setContent(`
        <html>
          <body>
            <div class="slidev-layout">
              <div style="width: 300px; height: 200px; overflow: auto;">
                <div style="height: 500px;">Long content</div>
              </div>
            </div>
          </body>
        </html>
      `);

      await page.waitForTimeout(100);

      const detector = new OverflowDetector(page, defaultConfig);
      const issues = await detector.detectIssues();

      const scrollbarIssues = issues.filter(i => i.type === 'scrollbar');
      expect(scrollbarIssues.length).toBeGreaterThan(0);
      if (scrollbarIssues.length > 0 && scrollbarIssues[0].type === 'scrollbar') {
        expect(scrollbarIssues[0].details.scrollbarType).toMatch(/vertical|both/);
      }
    });

    it('should detect horizontal scrollbar', async () => {
      await page.setContent(`
        <html>
          <body>
            <div class="slidev-layout">
              <div style="width: 300px; height: 200px; overflow: auto;">
                <div style="width: 500px;">Wide content</div>
              </div>
            </div>
          </body>
        </html>
      `);

      await page.waitForTimeout(100);

      const detector = new OverflowDetector(page, defaultConfig);
      const issues = await detector.detectIssues();

      const scrollbarIssues = issues.filter(i => i.type === 'scrollbar');
      expect(scrollbarIssues.length).toBeGreaterThan(0);
      if (scrollbarIssues.length > 0 && scrollbarIssues[0].type === 'scrollbar') {
        expect(scrollbarIssues[0].details.scrollbarType).toMatch(/horizontal|both/);
      }
    });
  });
});
