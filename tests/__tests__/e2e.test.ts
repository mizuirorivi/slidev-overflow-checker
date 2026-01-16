import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, Browser } from 'playwright';
import { SlidevChecker } from '../../src/checker/SlidevChecker';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import http from 'http';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('E2E Test', () => {
  let browser: Browser;
  let server: http.Server;
  let serverUrl: string;

  beforeAll(async () => {
    // シンプルなHTTPサーバーを起動
    const testHtmlPath = join(__dirname, '..', 'fixtures', 'test-slides.html');
    const testHtml = fs.readFileSync(testHtmlPath, 'utf-8');

    server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(testHtml);
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address();
        if (address && typeof address === 'object') {
          serverUrl = `http://localhost:${address.port}`;
        }
        resolve();
      });
    });

    browser = await chromium.launch({ headless: true });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  it('should detect overflow issues in test slides', async () => {
    const checker = new SlidevChecker({
      url: serverUrl,
      headless: true,
      verbose: false,
    });

    const result = await checker.check();

    // 総スライド数を確認
    expect(result.totalSlides).toBe(3);

    // 問題のあるスライドを確認
    expect(result.slidesWithIssues.length).toBeGreaterThan(0);

    // スライド3でエレメントオーバーフローが検出されることを確認
    const slide3 = result.slides.find(s => s.page === 3);
    expect(slide3).toBeDefined();
    if (slide3) {
      const elementOverflow = slide3.issues.find(i => i.type === 'element-overflow');
      expect(elementOverflow).toBeDefined();
    }
  }, 30000);

  it('should work with page range', async () => {
    const checker = new SlidevChecker({
      url: serverUrl,
      pages: '2-3',
      headless: true,
      verbose: false,
    });

    const result = await checker.check();

    // スライド1はチェックされていないはず
    const slide1 = result.slides.find(s => s.page === 1);
    expect(slide1).toBeUndefined();

    // スライド3はチェックされているはず（スライド3に問題がある）
    expect(result.slidesWithIssues.includes(3)).toBe(true);
  }, 30000);
});
