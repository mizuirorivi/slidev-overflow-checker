# Slidev Overflow Checker

**A visual evaluation tool that detects layout breakage in AI-generated Slidev slides through real browser rendering.**

Slidev Overflow Checker is designed to be used by **AI agents (e.g., Claude Code)**, not just humans.

**[日本語](./README.ja.md)** | **[中文](./README.zh.md)**

## Why This Tool Exists

LLMs are good at generating text and structure, but **bad at validating visual layout correctness**.

When AI generates Slidev presentations, it often produces:
- Text that overflows containers
- Elements that exceed slide boundaries
- Unintended scrollbars

These issues **cannot be reliably detected from Markdown alone**.

Slidev Overflow Checker solves this by:
- Rendering slides in a real browser (Playwright)
- Measuring layout breakage in pixels
- Returning machine-readable signals for AI to act on

## Intended Usage (AI-first)

This tool is primarily designed to be used as an **external command / skill for AI agents**.

Typical workflow:

1. AI generates or edits Slidev Markdown
2. AI runs `slidev-overflow-checker`
3. The checker returns structured JSON
4. AI analyzes layout issues
5. AI revises text, splits slides, or adjusts content
6. Repeat until no layout issues remain

Humans only review the final output.

## Output: Machine-Readable Layout Signals

The JSON output is the **primary interface** of this tool.

```bash
npx slidev-overflow-checker --url http://localhost:3030 --format json --project ./slides --verbose
```

It provides:
- Slide number
- Issue type (`text-overflow` / `element-overflow` / `scrollbar`)
- Overflow amount (px)
- Affected DOM selector
- Corresponding Markdown source lines (with `--project`)

This allows AI agents to:
- Decide what to summarize
- Decide when to split slides
- Decide which elements to resize or rewrite

## What This Tool Enables

- Converts visual layout breakage into structured signals
- Makes slide layout correctness testable by AI
- Bridges the gap between LLMs and rendered output
- Enables iterative "generate → evaluate → regenerate" loops

## Manual / CI Usage (Optional)

Although AI-first by design, the tool can also be used directly by humans for:
- Pre-presentation checks
- CI quality gates
- Debugging layout issues

## Installation

```bash
npm install -g slidev-overflow-checker
```

Or install locally in your project:

```bash
npm install --save-dev slidev-overflow-checker
```

## CLI Usage

### Basic Usage

Check an existing Slidev server:
```bash
npx slidev-overflow-checker --url http://localhost:3030
```

Auto-launch Slidev and check:
```bash
npx slidev-overflow-checker --slides ./slides.md
```

### Options

```bash
# Generate HTML report and JSON output
npx slidev-overflow-checker --url http://localhost:3030 --format html,json

# Check specific page range only
npx slidev-overflow-checker --url http://localhost:3030 --pages 1-10

# Verbose mode: Show detailed information about overflow elements
npx slidev-overflow-checker --url http://localhost:3030 --verbose

# Specify project path to display corresponding Markdown source lines
npx slidev-overflow-checker --url http://localhost:3030 --project ./my-presentation --verbose

# Use custom configuration file
npx slidev-overflow-checker --config ./checker.config.js

# Take screenshots (only for slides with issues)
npx slidev-overflow-checker --url http://localhost:3030 --screenshot

# CI/CD mode: Exit with code 1 if issues are found
npx slidev-overflow-checker --url http://localhost:3030 --fail-on-issues

# Customize screenshot options
npx slidev-overflow-checker --url http://localhost:3030 \
  --screenshot \
  --screenshot-dir ./my-screenshots \
  --screenshot-full-page \
  --no-screenshot-highlight
```

### Verbose Mode (--verbose)

In verbose mode, detailed information about overflow elements is displayed:

- **Element identification**: Tag name, CSS class, selector
- **Overflow amount**: Specific pixel values
- **Element position**: Coordinates and size
- **Text content**: Portion of overflowing text (for text overflow)

```bash
Checking slide 5/20...
  ⚠ Text overflow detected:
    - Element: h1.slide-title
      Selector: .slidev-page:nth-child(5) > h1.slide-title
      Container width: 980px
      Content width: 1250px
      Overflow: 270px
      Text: "Introduction to Advanced TypeScript Patterns..."
```

### Project Path Option (--project)

By specifying the Slidev project directory with `--project`, **corresponding Markdown source line numbers** are also displayed:

```bash
npx slidev-overflow-checker --url http://localhost:3030 --project ./my-presentation --verbose
```

Example output:
```bash
Checking slide 5/20...
  ⚠ Text overflow detected:
    - Element: h1.slide-title
      Selector: .slidev-page:nth-child(5) > h1.slide-title
      Container width: 980px
      Content width: 1250px
      Overflow: 270px
      Text: "Introduction to Advanced TypeScript Patterns..."

      Source: slides.md:46-47
      ---
      46 | # Introduction to Advanced TypeScript Patterns and Best Practices
      47 | ---

Summary:
  Detailed issues by slide:
    Slide 5: 2 issues
      - slides.md:46 (h1: text overflow)
      - slides.md:49 (img: element overflow)
```

## CLI Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--url <url>` | `-u` | URL of the Slidev presentation | - |
| `--slides <path>` | `-s` | Path to Slidev markdown file | - |
| `--project <path>` | | Path to Slidev project directory | - |
| `--pages <range>` | `-p` | Page range to check (e.g., 1-10) | All pages |
| `--format <formats>` | `-f` | Output formats (console,html,json) | console |
| `--output <dir>` | `-o` | Output directory | ./reports |
| `--threshold <n>` | `-t` | Overflow detection threshold (px) | 1 |
| `--wait <ms>` | `-w` | Wait time after page transition (ms) | 0 |
| `--viewport <size>` | | Viewport size | 1920x1080 |
| `--browser <name>` | `-b` | Browser (chromium/firefox/webkit) | chromium |
| `--headless` | | Headless mode | true |
| `--verbose` | `-v` | Output detailed logs | false |
| `--fail-on-issues` | | Exit with code 1 if issues found | false |
| `--concurrency <n>` | | Number of parallel checks | 4 |
| `--config <path>` | `-c` | Path to configuration file | - |

## Configuration

### Configuration File Example

`checker.config.js`:
```javascript
export default {
  url: 'http://localhost:3030',
  format: ['console', 'html'],
  output: './reports',
  threshold: 1,
  wait: 1000,
  concurrency: 1,  // Use 1 for stable results
  exclude: [
    '.slidev-page-indicator',
    '.slidev-nav'
  ],

  screenshot: {
    enabled: true,
    fullPage: false,
    highlightIssues: true,
    outputDir: './screenshots'
  }
};
```

`checker.config.json`:
```json
{
  "url": "http://localhost:3030",
  "format": ["console", "html"],
  "output": "./reports",
  "threshold": 1,
  "wait": 1000,
  "concurrency": 1,
  "exclude": [
    ".slidev-page-indicator",
    ".slidev-nav"
  ],
  "screenshot": {
    "enabled": true,
    "fullPage": false,
    "highlightIssues": true,
    "outputDir": "./screenshots"
  }
}
```

## Detected Issues

### 1. Text Overflow
- Text extending beyond its container
- Content hidden by `overflow: hidden` or `text-overflow: ellipsis`

### 2. Element Overflow
- Images or DIV elements exceeding slide boundaries
- Visually cut-off content

### 3. Scrollbar Appearance
- Unintended vertical/horizontal scrollbar appearance
- Containers that have become scrollable

## Requirements

- Node.js 18.x or higher
- Slidev 0.40.x or higher

## Development

### Setup

```bash
git clone https://github.com/your-username/slidev-overflow-checker.git
cd slidev-overflow-checker
npm install
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Local Execution

```bash
npm run dev -- --url http://localhost:3030
```

## License

MIT

## Contributing

Issues and Pull Requests are welcome.

## Related Links

- [Slidev](https://sli.dev/)
- [Playwright](https://playwright.dev/)
