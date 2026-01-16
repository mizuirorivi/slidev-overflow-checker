#!/usr/bin/env node

import { Command } from 'commander';
import { SlidevChecker } from './checker/SlidevChecker';
import { ConfigLoader } from './utils/ConfigLoader';
import { CheckerOptions } from './types';

const program = new Command();

program
  .name('slidev-overflow-checker')
  .description('Automatically detect content overflow in Slidev presentations')
  .version('0.1.0');

program
  .option('-u, --url <url>', 'URL of the Slidev presentation (required)')
  .option('--project <path>', 'Path to Slidev project directory (for source mapping)')
  .option('-p, --pages <range>', 'Page range to check (e.g., 1-10, 5)')
  .option(
    '-f, --format <formats>',
    'Output formats (console,html,json)',
    'console'
  )
  .option('-o, --output <dir>', 'Output directory', './reports')
  .option(
    '-t, --threshold <n>',
    'Overflow detection threshold in pixels',
    '1'
  )
  .option(
    '-w, --wait <ms>',
    'Additional wait time after rendering stabilizes in milliseconds',
    '0'
  )
  .option(
    '--viewport <size>',
    'Viewport size (e.g., 1920x1080)',
    '1920x1080'
  )
  .option(
    '-b, --browser <name>',
    'Browser to use (chromium/firefox/webkit)',
    'chromium'
  )
  .option('--headless', 'Run in headless mode', true)
  .option('--no-headless', 'Run in non-headless mode')
  .option('-v, --verbose', 'Show detailed logs', false)
  .option('--screenshot', 'Enable screenshot capture for slides with issues', false)
  .option('--screenshot-dir <dir>', 'Screenshot output directory', './screenshots')
  .option('--screenshot-full-page', 'Capture full page screenshots', false)
  .option('--no-screenshot-highlight', 'Disable highlighting of issues in screenshots')
  .option('--fail-on-issues', 'Exit with code 1 if issues are found (for CI/CD)', false)
  .option('--concurrency <n>', 'Number of slides to check in parallel', '1')
  .option('-c, --config <path>', 'Path to configuration file');

program.action(async (options) => {
  try {
    // Load configuration file
    let config: Partial<CheckerOptions> = {};
    if (options.config) {
      const configLoader = new ConfigLoader();
      config = await configLoader.loadConfig(options.config);
    }

    // Validate options
    if (!options.url && !config.url) {
      console.error('Error: --url option is required');
      process.exit(1);
    }

    // Parse viewport
    let viewport = config.viewport || { width: 1920, height: 1080 };
    if (options.viewport) {
      const [width, height] = options.viewport.split('x').map(Number);
      if (isNaN(width) || isNaN(height)) {
        console.error('Error: Invalid viewport size format. Use WIDTHxHEIGHT (e.g., 1920x1080)');
        process.exit(1);
      }
      viewport = { width, height };
    }

    // Validate browser
    const browser = (options.browser || config.browser || 'chromium') as 'chromium' | 'firefox' | 'webkit';
    if (!['chromium', 'firefox', 'webkit'].includes(browser)) {
      console.error('Error: Invalid browser. Use chromium, firefox, or webkit');
      process.exit(1);
    }

    // Screenshot options
    const screenshotOptions = (options.screenshot || config.screenshot) ? {
      enabled: true,
      outputDir: options.screenshotDir || config.screenshot?.outputDir,
      fullPage: options.screenshotFullPage || config.screenshot?.fullPage,
      highlightIssues: options.screenshotHighlight !== false && config.screenshot?.highlightIssues !== false,
    } : undefined;

    // CLI options (only non-undefined values)
    const cliOptions: Partial<CheckerOptions> = {
      url: options.url,
      project: options.project,
      pages: options.pages,
      format: options.format?.split(','),
      output: options.output,
      threshold: options.threshold ? parseInt(options.threshold, 10) : undefined,
      wait: options.wait ? parseInt(options.wait, 10) : undefined,
      viewport,
      browser,
      headless: options.headless,
      verbose: options.verbose,
      screenshot: screenshotOptions,
      failOnIssues: options.failOnIssues,
      concurrency: options.concurrency ? parseInt(options.concurrency, 10) : undefined,
    };

    // Merge configuration file and CLI options
    const configLoader = new ConfigLoader();
    const checkerOptions = configLoader.mergeWithCliOptions(config, cliOptions) as CheckerOptions;

    // Execute check
    const checker = new SlidevChecker(checkerOptions);
    const result = await checker.check();

    // Exit with code 1 if --fail-on-issues is specified and issues are found
    if (checkerOptions.failOnIssues && result.issuesFound > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
});

program.parse();
