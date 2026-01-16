import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import { PageNavigator } from '../../src/checker/PageNavigator';

describe('PageNavigator', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await page.close();
    await browser.close();
  });

  describe('getTotalSlides', () => {
    it('should return total number of slides from a Slidev presentation', async () => {
      // シンプルなHTMLページを作成してテスト
      await page.setContent(`
        <html>
          <body>
            <div id="slideshow">
              <div class="slidev-page">Slide 1</div>
              <div class="slidev-page">Slide 2</div>
              <div class="slidev-page">Slide 3</div>
            </div>
          </body>
        </html>
      `);

      const navigator = new PageNavigator(page, { wait: 100 });
      const total = await navigator.getTotalSlides();

      expect(total).toBe(3);
    });

    it('should return 0 when no slides are found', async () => {
      await page.setContent(`
        <html>
          <body>
            <div>No slides here</div>
          </body>
        </html>
      `);

      const navigator = new PageNavigator(page, { wait: 100 });
      const total = await navigator.getTotalSlides();

      expect(total).toBe(0);
    });
  });

  describe('navigateToSlide', () => {
    it('should navigate to specific slide number', async () => {
      await page.setContent(`
        <html>
          <body>
            <div id="slideshow">
              <div class="slidev-page" data-page="1">Slide 1</div>
              <div class="slidev-page" data-page="2" style="display:none;">Slide 2</div>
              <div class="slidev-page" data-page="3" style="display:none;">Slide 3</div>
            </div>
            <script>
              window.navigateToSlide = (n) => {
                document.querySelectorAll('.slidev-page').forEach((el, i) => {
                  el.style.display = i === n - 1 ? 'block' : 'none';
                });
              };
            </script>
          </body>
        </html>
      `);

      const navigator = new PageNavigator(page, { wait: 100 });
      await navigator.navigateToSlide(2);

      const isVisible = await page.evaluate(() => {
        const slide2 = document.querySelector('[data-page="2"]') as HTMLElement;
        return slide2 && slide2.style.display !== 'none';
      });

      expect(isVisible).toBe(true);
    });
  });

  describe('getCurrentSlideNumber', () => {
    it('should return current slide number', async () => {
      await page.setContent(`
        <html>
          <body>
            <div class="slidev-page-indicator">
              <span class="slidev-page-number">5</span>
              <span>/</span>
              <span>20</span>
            </div>
          </body>
        </html>
      `);

      const navigator = new PageNavigator(page, { wait: 100 });
      const current = await navigator.getCurrentSlideNumber();

      expect(current).toBe(5);
    });
  });

  describe('waitForSlideLoad', () => {
    it('should wait for slide to be visible', async () => {
      await page.setContent(`
        <html>
          <body>
            <div class="slidev-page" style="width: 980px; height: 552px;">
              Slide content
            </div>
          </body>
        </html>
      `);

      const navigator = new PageNavigator(page, { wait: 50 });
      const start = Date.now();
      await navigator.waitForSlideLoad();
      const elapsed = Date.now() - start;

      // Should complete without timing out
      expect(elapsed).toBeLessThan(5000);
    });
  });
});
