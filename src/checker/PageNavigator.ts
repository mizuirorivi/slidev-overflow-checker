import { Page } from 'playwright';

export interface NavigatorOptions {
  wait?: number; // Wait time after page transition (milliseconds)
}

/**
 * Class responsible for navigating Slidev pages
 */
export class PageNavigator {
  private page: Page;
  private options: NavigatorOptions;

  constructor(page: Page, options: NavigatorOptions = {}) {
    this.page = page;
    this.options = {
      wait: options.wait ?? 0,
    };
  }

  /**
   * Get total number of slides
   */
  async getTotalSlides(): Promise<number> {
    try {
      // Get total from Slidev navigation object
      const count = await this.page.evaluate(() => {
        // Get from Slidev $slidev.nav.total (recommended)
        if (typeof (window as any).$slidev !== 'undefined' &&
            (window as any).$slidev.nav &&
            typeof (window as any).$slidev.nav.total === 'number') {
          return (window as any).$slidev.nav.total;
        }

        // Fallback: Get from __slidev__ object
        if (typeof (window as any).__slidev__ !== 'undefined') {
          const slidev = (window as any).__slidev__;
          if (slidev.nav && typeof slidev.nav.total === 'number') {
            return slidev.nav.total;
          }
        }

        // Fallback: Get from page indicator
        const indicator = document.querySelector('.slidev-page-indicator');
        if (indicator) {
          const text = indicator.textContent || '';
          const match = text.match(/\/\s*(\d+)/);
          if (match) {
            return parseInt(match[1], 10);
          }
        }

        // Last resort: Count DOM elements
        const slides = document.querySelectorAll('.slidev-page');
        return slides.length;
      });

      return count;
    } catch (error) {
      console.error('Error getting total slides:', error);
      return 0;
    }
  }

  /**
   * Navigate to specified slide number
   */
  async navigateToSlide(slideNumber: number): Promise<void> {
    try {
      // Reset navigation completion flag
      await this.page.evaluate(() => {
        delete (window as any).__slideRenderComplete;
      });

      // Call Slidev navigation function
      await this.page.evaluate((n) => {
        // Use globally defined navigate function
        if (typeof (window as any).navigateToSlide === 'function') {
          (window as any).navigateToSlide(n);
        } else if (typeof (window as any).$slidev !== 'undefined') {
          // Standard Slidev navigation
          (window as any).$slidev.nav.go(n);
        } else if (typeof (window as any).__slidev__ !== 'undefined') {
          // Use __slidev__ object
          const slidev = (window as any).__slidev__;
          if (slidev.nav && typeof slidev.nav.go === 'function') {
            slidev.nav.go(n);
          } else {
            // Fallback: Change URL hash
            window.location.hash = `${n}`;
          }
        } else {
          // Fallback: Change URL hash
          window.location.hash = `${n}`;
        }
      }, slideNumber);

      await this.waitForSlideLoad();
    } catch (error) {
      // Continue with warning on navigation error
      console.warn(`Warning: Error navigating to slide ${slideNumber}, retrying...`);
      // Retry: Wait a bit and try again
      await this.page.waitForTimeout(500);
      await this.waitForSlideLoad();
    }
  }

  /**
   * Get current slide number
   */
  async getCurrentSlideNumber(): Promise<number> {
    try {
      const currentSlide = await this.page.evaluate(() => {
        // Get from Slidev page indicator
        const indicator = document.querySelector('.slidev-page-number');
        if (indicator) {
          const num = parseInt(indicator.textContent || '0', 10);
          return num || 1;
        }

        // Fallback: Get from URL hash
        const hash = window.location.hash;
        if (hash) {
          const match = hash.match(/(\d+)/);
          if (match) {
            return parseInt(match[1], 10);
          }
        }

        return 1;
      });

      return currentSlide;
    } catch (error) {
      console.error('Error getting current slide number:', error);
      return 1;
    }
  }

  /**
   * Wait for slide to load (proportional wait based on slide count)
   */
  async waitForSlideLoad(): Promise<void> {
    try {
      // Step 1: Wait until page is visible
      await this.page.waitForFunction(() => {
        const allSlidePages = document.querySelectorAll('.slidev-page');
        return Array.from(allSlidePages).some((page: Element) => {
          const rect = page.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
      }, { timeout: 3000 });

      // Step 2: Get total slides (if not already obtained)
      if (!this.totalSlides) {
        this.totalSlides = await this.getTotalSlides();
      }

      // Calculate wait time based on slide count
      // Base: 600ms
      // More slides = shorter wait time per slide
      // Example: 10 slides or less = 600ms, 20 slides = 500ms, 40 slides = 400ms, 100 slides = 300ms
      let waitTime = 600;
      if (this.totalSlides > 10) {
        waitTime = Math.max(300, 600 - Math.floor((this.totalSlides - 10) / 10) * 50);
      }

      await this.page.waitForTimeout(waitTime);
    } catch (error) {
      // Continue even on error
    }

    // Optional additional wait time
    const minWait = this.options.wait ?? 0;
    if (minWait > 0) {
      await this.page.waitForTimeout(minWait);
    }
  }

  private totalSlides?: number;

  /**
   * Check if page is ready
   */
  async waitForReady(): Promise<void> {
    try {
      // Wait for Slidev app to load
      await this.page.waitForSelector('.slidev-page', { timeout: 10000 });

      // Wait until $slidev or __slidev__ object is available (optional)
      try {
        await this.page.waitForFunction(() => {
          return (typeof (window as any).$slidev !== 'undefined' &&
                  (window as any).$slidev.nav &&
                  typeof (window as any).$slidev.nav.total === 'number') ||
                 (typeof (window as any).__slidev__ !== 'undefined');
        }, { timeout: 5000 });
      } catch (error) {
        // If Slidev object is unavailable, fallback to DOM element counting
      }

      await this.waitForSlideLoad();
    } catch (error) {
      console.error('Error waiting for page ready:', error);
      throw new Error('Slidev presentation not found or failed to load');
    }
  }
}
