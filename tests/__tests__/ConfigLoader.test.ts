import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ConfigLoader } from '../../src/utils/ConfigLoader';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

describe('ConfigLoader', () => {
  const testDir = join(__dirname, '..', 'fixtures', 'config-test');
  const jsonConfigPath = join(testDir, 'checker.config.json');
  const jsConfigPath = join(testDir, 'checker.config.js');

  beforeAll(async () => {
    if (!existsSync(testDir)) {
      await mkdir(testDir, { recursive: true });
    }

    // JSON設定ファイルを作成
    const jsonConfig = {
      url: 'http://localhost:3030',
      pages: '1-10',
      format: ['console', 'json'],
      threshold: 2,
      wait: 500,
      viewport: {
        width: 1280,
        height: 720,
      },
      browser: 'firefox',
      headless: false,
      verbose: true,
      exclude: ['.test-class'],
      screenshot: {
        enabled: true,
        fullPage: true,
        highlightIssues: false,
      },
    };

    await writeFile(jsonConfigPath, JSON.stringify(jsonConfig, null, 2), 'utf-8');

    // JS設定ファイルを作成（ESM形式）
    const jsConfig = `export default {
  url: 'http://localhost:4040',
  pages: '5-15',
  format: ['html'],
  threshold: 3,
};`;

    await writeFile(jsConfigPath, jsConfig, 'utf-8');
  });

  afterAll(async () => {
    try {
      await unlink(jsonConfigPath);
      await unlink(jsConfigPath);
    } catch (error) {
      // ファイルが存在しない場合は無視
    }
  });

  describe('loadConfig', () => {
    it('should load JSON config file', async () => {
      const loader = new ConfigLoader();
      const config = await loader.loadConfig(jsonConfigPath);

      expect(config.url).toBe('http://localhost:3030');
      expect(config.pages).toBe('1-10');
      expect(config.format).toEqual(['console', 'json']);
      expect(config.threshold).toBe(2);
      expect(config.wait).toBe(500);
      expect(config.viewport).toEqual({ width: 1280, height: 720 });
      expect(config.browser).toBe('firefox');
      expect(config.headless).toBe(false);
      expect(config.verbose).toBe(true);
      expect(config.exclude).toEqual(['.test-class']);
      expect(config.screenshot).toEqual({
        enabled: true,
        fullPage: true,
        highlightIssues: false,
      });
    });

    it('should load JS config file', async () => {
      const loader = new ConfigLoader();
      const config = await loader.loadConfig(jsConfigPath);

      expect(config.url).toBe('http://localhost:4040');
      expect(config.pages).toBe('5-15');
      expect(config.format).toEqual(['html']);
      expect(config.threshold).toBe(3);
    });

    it('should throw error for non-existent file', async () => {
      const loader = new ConfigLoader();
      const nonExistentPath = join(testDir, 'non-existent.json');

      await expect(loader.loadConfig(nonExistentPath)).rejects.toThrow();
    });
  });

  describe('mergeWithCliOptions', () => {
    it('should merge config with CLI options (CLI takes precedence)', async () => {
      const loader = new ConfigLoader();
      const config = await loader.loadConfig(jsonConfigPath);

      const merged = loader.mergeWithCliOptions(config, {
        url: 'http://localhost:5050', // CLI overrides config
        threshold: 5, // CLI overrides config
        // verbose not specified, so config value should be used
      });

      expect(merged.url).toBe('http://localhost:5050'); // CLI value
      expect(merged.threshold).toBe(5); // CLI value
      expect(merged.verbose).toBe(true); // Config value
      expect(merged.pages).toBe('1-10'); // Config value
    });

    it('should use config values when CLI options are not provided', async () => {
      const loader = new ConfigLoader();
      const config = await loader.loadConfig(jsonConfigPath);

      const merged = loader.mergeWithCliOptions(config, {});

      expect(merged.url).toBe('http://localhost:3030');
      expect(merged.threshold).toBe(2);
      expect(merged.verbose).toBe(true);
    });
  });
});
