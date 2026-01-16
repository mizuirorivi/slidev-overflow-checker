import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import { CheckerOptions } from '../types';

/**
 * Class for loading configuration files
 */
export class ConfigLoader {
  /**
   * Load configuration file
   */
  async loadConfig(configPath: string): Promise<Partial<CheckerOptions>> {
    if (!existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }

    // Determine by file extension
    if (configPath.endsWith('.json')) {
      return this.loadJsonConfig(configPath);
    } else if (configPath.endsWith('.js')) {
      return this.loadJsConfig(configPath);
    } else {
      throw new Error(`Unsupported config file format: ${configPath}`);
    }
  }

  /**
   * JSONLoad configuration file
   */
  private async loadJsonConfig(configPath: string): Promise<Partial<CheckerOptions>> {
    const content = await readFile(configPath, 'utf-8');
    const config = JSON.parse(content);
    return this.normalizeConfig(config);
  }

  /**
   * JavaScriptLoad configuration file
   */
  private async loadJsConfig(configPath: string): Promise<Partial<CheckerOptions>> {
    // Convert to absolute path
    const absolutePath = resolve(configPath);
    // Convert to file:// URL
    const fileUrl = pathToFileURL(absolutePath).href;
    // Add timestamp as query parameter to avoid cache
    const urlWithTimestamp = `${fileUrl}?t=${Date.now()}`;
    const module = await import(urlWithTimestamp);
    const config = module.default || module;
    return this.normalizeConfig(config);
  }

  /**
   * Normalize configuration
   */
  private normalizeConfig(config: any): Partial<CheckerOptions> {
    const normalized: Partial<CheckerOptions> = {};

    if (config.url) normalized.url = config.url;
    if (config.project) normalized.project = config.project;
    if (config.pages) normalized.pages = config.pages;
    if (config.format) normalized.format = config.format;
    if (config.output) normalized.output = config.output;
    if (config.threshold !== undefined) normalized.threshold = config.threshold;
    if (config.wait !== undefined) normalized.wait = config.wait;
    if (config.viewport) normalized.viewport = config.viewport;
    if (config.browser) normalized.browser = config.browser;
    if (config.headless !== undefined) normalized.headless = config.headless;
    if (config.verbose !== undefined) normalized.verbose = config.verbose;
    if (config.exclude) normalized.exclude = config.exclude;
    if (config.screenshot) normalized.screenshot = config.screenshot;

    return normalized;
  }

  /**
   * Merge CLI options and config file (CLI takes priority)
   */
  mergeWithCliOptions(
    config: Partial<CheckerOptions>,
    cliOptions: Partial<CheckerOptions>
  ): Partial<CheckerOptions> {
    return {
      ...config,
      ...Object.fromEntries(
        Object.entries(cliOptions).filter(([_, value]) => value !== undefined)
      ),
    };
  }
}
