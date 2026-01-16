import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import { ScreenshotCapture } from '../../src/utils/ScreenshotCapture';
import { createServer } from 'http';
import { existsSync, unlinkSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import type { Server } from 'http';

describe('ScreenshotCapture', () => {
  let server: Server;
  let browser: Browser;
  let page: Page;
  const testDir = join(__dirname, '..', 'screenshots-test');

  beforeAll(async () => {
    // テスト用HTTPサーバーを起動
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .overflow-box {
              width: 100px;
              height: 50px;
              overflow: hidden;
              background: red;
            }
            .content {
              width: 200px;
              height: 100px;
              background: blue;
            }
          </style>
        </head>
        <body>
          <h1>Test Page</h1>
          <div class="overflow-box">
            <div class="content">This is overflow content</div>
          </div>
        </body>
      </html>
    `;

    server = createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    });

    await new Promise<void>((resolve) => {
      server.listen(3333, () => resolve());
    });

    // ブラウザとページを作成
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto('http://localhost:3333');

    // テスト用ディレクトリを作成
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(async () => {
    await page.close();
    await browser.close();
    server.close();

    // テスト用ディレクトリをクリーンアップ
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('takeScreenshot', () => {
    it('should capture screenshot of the page', async () => {
      const capture = new ScreenshotCapture(page);
      const filePath = join(testDir, 'test-1.png');

      await capture.takeScreenshot(filePath);

      expect(existsSync(filePath)).toBe(true);

      // クリーンアップ
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    });

    it('should capture full page screenshot when fullPage is true', async () => {
      const capture = new ScreenshotCapture(page);
      const filePath = join(testDir, 'test-2.png');

      await capture.takeScreenshot(filePath, { fullPage: true });

      expect(existsSync(filePath)).toBe(true);

      // クリーンアップ
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    });
  });

  describe('highlightElements', () => {
    it('should highlight elements on the page', async () => {
      const capture = new ScreenshotCapture(page);
      const selectors = ['.overflow-box'];

      await capture.highlightElements(selectors);

      // ハイライトが適用されているか確認
      const hasHighlight = await page.evaluate(() => {
        const element = document.querySelector('.overflow-box');
        if (!element) return false;
        const style = window.getComputedStyle(element);
        return style.outline !== 'none' && style.outline !== '';
      });

      expect(hasHighlight).toBe(true);
    });

    it('should remove highlights when clearHighlights is called', async () => {
      const capture = new ScreenshotCapture(page);
      const selectors = ['.overflow-box'];

      await capture.highlightElements(selectors);
      await capture.clearHighlights();

      // data-highlighted属性が削除されているか確認
      const hasHighlight = await page.evaluate(() => {
        const element = document.querySelector('.overflow-box');
        if (!element) return false;
        return element.hasAttribute('data-highlighted');
      });

      expect(hasHighlight).toBe(false);
    });
  });
});
