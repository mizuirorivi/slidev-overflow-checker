import { Page } from 'playwright';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import { existsSync } from 'fs';

export interface ScreenshotCaptureOptions {
  fullPage?: boolean;
  highlightColor?: string;
}

/**
 * Class for managing screenshot capture
 */
export class ScreenshotCapture {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(
    filePath: string,
    options: ScreenshotCaptureOptions = {}
  ): Promise<void> {
    const { fullPage = false } = options;

    // Create directory if it does not exist
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // Take screenshot
    await this.page.screenshot({
      path: filePath,
      fullPage,
    });
  }

  /**
   * Highlight elements
   */
  async highlightElements(
    selectors: string[],
    color: string = 'rgba(255, 0, 0, 0.5)'
  ): Promise<void> {
    await this.page.evaluate(
      ({ selectors, color }) => {
        selectors.forEach((selector) => {
          const elements = document.querySelectorAll(selector);
          elements.forEach((element) => {
            const htmlElement = element as HTMLElement;
            htmlElement.style.outline = `3px solid ${color}`;
            htmlElement.style.outlineOffset = '2px';
            // Add data attribute to track highlighted elements
            htmlElement.setAttribute('data-highlighted', 'true');
          });
        });
      },
      { selectors, color }
    );
  }

  /**
   * Clear highlights
   */
  async clearHighlights(): Promise<void> {
    await this.page.evaluate(() => {
      const highlightedElements = document.querySelectorAll('[data-highlighted="true"]');
      highlightedElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        htmlElement.style.outline = '';
        htmlElement.style.outlineOffset = '';
        htmlElement.removeAttribute('data-highlighted');
      });
    });
  }

  /**
   * Take screenshot with highlighted issues
   */
  async captureWithHighlights(
    filePath: string,
    selectors: string[],
    options: ScreenshotCaptureOptions = {}
  ): Promise<void> {
    try {
      // Highlight display
      await this.highlightElements(selectors, options.highlightColor);

      // Take screenshot
      await this.takeScreenshot(filePath, options);
    } finally {
      // Clear highlights
      await this.clearHighlights();
    }
  }
}
