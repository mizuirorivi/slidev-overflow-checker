import chalk from 'chalk';
import { CheckResult, Issue } from '../types';

export class ConsoleReporter {
  private verbose: boolean;

  constructor(verbose = false) {
    this.verbose = verbose;
  }

  /**
   * Report slide check start
   */
  reportSlideStart(slideNumber: number, totalSlides: number): void {
    console.log(chalk.gray(`Checking slide ${slideNumber}/${totalSlides}...`));
  }

  /**
   * Report slide issues
   */
  reportSlideIssues(_slideNumber: number, issues: Issue[]): void {
    if (issues.length === 0) {
      console.log(chalk.green('  ✓ No issues found'));
      return;
    }

    if (!this.verbose) {
      // Normal mode: Show issue type only
      const types = new Set(issues.map(i => i.type));
      types.forEach(type => {
        const message = this.getIssueTypeMessage(type);
        console.log(chalk.yellow(`  ⚠ ${message}`));
      });
    } else {
      // Verbose mode: Show details of each issue
      issues.forEach(issue => {
        this.reportIssueDetails(issue);
      });
    }
  }

  /**
   * Report issue details (verbose mode)
   */
  private reportIssueDetails(issue: Issue): void {
    const typeMessage = this.getIssueTypeMessage(issue.type);
    console.log(chalk.yellow(`  ⚠ ${typeMessage}:`));

    // Element info
    const tagAndClass = issue.element.class
      ? `${issue.element.tag}.${issue.element.class}`
      : issue.element.tag;
    console.log(chalk.gray(`    - Element: ${tagAndClass}`));
    console.log(chalk.gray(`      Selector: ${issue.element.selector}`));

    // Detail info
    if (issue.type === 'text-overflow') {
      console.log(
        chalk.gray(
          `      Container width: ${issue.details.containerWidth}px`
        )
      );
      console.log(
        chalk.gray(`      Content width: ${issue.details.contentWidth}px`)
      );
      console.log(
        chalk.gray(`      Overflow: ${issue.details.overflowX}px`)
      );

      if (issue.element.text) {
        const truncated =
          issue.element.text.length > 80
            ? issue.element.text.substring(0, 80) + '...'
            : issue.element.text;
        console.log(chalk.red(`      Overflowing text: "${truncated}"`));
      }
    } else if (issue.type === 'element-overflow') {
      const bounds = issue.details.slideBounds;
      const elementBounds = issue.details.elementBounds;
      console.log(
        chalk.gray(
          `      Slide bounds: ${bounds.left}, ${bounds.top}, ${bounds.right}, ${bounds.bottom}`
        )
      );
      console.log(
        chalk.gray(
          `      Element bounds: ${elementBounds.left}, ${elementBounds.top}, ${elementBounds.right}, ${elementBounds.bottom}`
        )
      );

      const overflows: string[] = [];
      if (issue.details.overflow.left > 0)
        overflows.push(`left ${issue.details.overflow.left}px`);
      if (issue.details.overflow.right > 0)
        overflows.push(`right ${issue.details.overflow.right}px`);
      if (issue.details.overflow.top > 0)
        overflows.push(`top ${issue.details.overflow.top}px`);
      if (issue.details.overflow.bottom > 0)
        overflows.push(`bottom ${issue.details.overflow.bottom}px`);

      if (overflows.length > 0) {
        console.log(chalk.gray(`      Overflow: ${overflows.join(', ')}`));
      }

      if (issue.element.text) {
        const truncated =
          issue.element.text.length > 80
            ? issue.element.text.substring(0, 80) + '...'
            : issue.element.text;
        console.log(chalk.red(`      Content: "${truncated}"`));
      }

      if (issue.element.src) {
        console.log(chalk.gray(`      Image source: ${issue.element.src}`));
      }
    } else if (issue.type === 'scrollbar') {
      console.log(
        chalk.gray(`      Scrollbar type: ${issue.details.scrollbarType}`)
      );
      console.log(
        chalk.gray(
          `      Container height: ${issue.details.containerHeight}px`
        )
      );
      console.log(
        chalk.gray(`      Content height: ${issue.details.contentHeight}px`)
      );
      console.log(chalk.gray(`      Overflow: ${issue.details.overflow}px`));
    }

    // Source info (when project path is specified)
    if (issue.source) {
      console.log();
      console.log(
        chalk.cyan(
          `      Source: ${issue.source.file}:${issue.source.line}${
            issue.source.lineEnd !== issue.source.line
              ? `-${issue.source.lineEnd}`
              : ''
          }`
        )
      );
      const lines = issue.source.content.split('\n');
      lines.forEach((line, index) => {
        const lineNumber = issue.source!.line + index;
        console.log(chalk.gray(`      ${lineNumber} | ${line}`));
      });
    }

    console.log();
  }

  /**
   * Report final summary
   */
  reportSummary(result: CheckResult): void {
    console.log();
    console.log(chalk.bold('Summary:'));
    console.log(`  Total slides: ${result.totalSlides}`);

    if (result.slidesWithIssues.length === 0) {
      console.log(chalk.green('  No issues found! 🎉'));
      return;
    }

    const slidesList = result.slidesWithIssues.join(', ');
    console.log(
      chalk.yellow(
        `  Issues found: ${result.slidesWithIssues.length} slides (Slide ${slidesList})`
      )
    );

    if (result.summary.textOverflow.count > 0) {
      const slides = result.summary.textOverflow.slides.join(', ');
      console.log(
        chalk.yellow(
          `  - Text overflow: ${result.summary.textOverflow.count} slides (Slide ${slides})`
        )
      );
    }

    if (result.summary.elementOverflow.count > 0) {
      const slides = result.summary.elementOverflow.slides.join(', ');
      console.log(
        chalk.yellow(
          `  - Element overflow: ${result.summary.elementOverflow.count} slides (Slide ${slides})`
        )
      );
    }

    if (result.summary.scrollbar.count > 0) {
      const slides = result.summary.scrollbar.slides.join(', ');
      console.log(
        chalk.yellow(
          `  - Scrollbar detected: ${result.summary.scrollbar.count} slides (Slide ${slides})`
        )
      );
    }

    // In verbose mode, show issue list per slide
    if (this.verbose && result.slides.length > 0) {
      console.log();
      console.log(chalk.bold('Detailed issues by slide:'));
      result.slides.forEach(slide => {
        console.log(
          `  Slide ${slide.page}: ${slide.issueCount} issue${
            slide.issueCount > 1 ? 's' : ''
          }`
        );
        slide.issues.forEach(issue => {
          const type = this.getShortIssueType(issue.type);
          if (issue.source) {
            console.log(
              chalk.gray(
                `    - ${issue.source.file}:${issue.source.line} (${issue.element.tag}: ${type})`
              )
            );
          }
        });
      });
    }
  }

  /**
   * Get issue type message
   */
  private getIssueTypeMessage(type: string): string {
    switch (type) {
      case 'text-overflow':
        return 'Text overflow detected';
      case 'element-overflow':
        return 'Element overflow detected';
      case 'scrollbar':
        return 'Scrollbar detected';
      default:
        return 'Unknown issue detected';
    }
  }

  /**
   * Get short version of issue type
   */
  private getShortIssueType(type: string): string {
    switch (type) {
      case 'text-overflow':
        return 'text overflow';
      case 'element-overflow':
        return 'element overflow';
      case 'scrollbar':
        return 'scrollbar';
      default:
        return 'unknown';
    }
  }
}
