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
- **Overflow amount**: Specific pixel values (horizontal for text, directional for elements)
- **Overflowing content**: The actual text or element content that is overflowing
- **Source location**: Specific line numbers in Markdown (with `--project`)

```bash
Checking slide 2/40...
  ⚠ Text overflow detected:
    - Element: p
      Selector: p
      Container width: 1917.39px
      Content width: 1947.66px
      Overflow: 171.48px
      Overflowing text: "Opening sequence to critical position aaaaaaaaaaaaaaaaaaaaa..."

      Source: slides.md:35
      35 | Opening sequence to critical position
```

### Project Path Option (--project)

By specifying the Slidev project directory with `--project`, **corresponding Markdown source line numbers** are also displayed with precise content matching:

```bash
npx slidev-overflow-checker --url http://localhost:3030 --project ./my-presentation --verbose
```

Example output:
```bash
Checking slide 19/40...
  ⚠ Element overflow detected:
    - Element: li
      Selector: li
      Slide bounds: 1.30, 0, 1918.70, 1080
      Element bounds: 168.53, 1076.94, 1828.91, 1138.94
      Overflow: bottom 58.94px
      Content: "Black's King is exposed in center"

      Source: slides.md:520
      520 | 3. Black's King is exposed in center

  ⚠ Element overflow detected:
    - Element: p
      Selector: p
      Slide bounds: 1.30, 0, 1918.70, 1080
      Element bounds: 130.26, 1170.24, 1828.52, 1217.20
      Overflow: bottom 137.20px
      Content: "White's winning plan: long-term pressure (d3, Bf4, 0-0-0, h4-h5...)"

      Source: slides.md:522
      522 | **White's winning plan**: long-term pressure (d3, Bf4, 0-0-0, h4-h5...)

Summary:
  Total slides: 40
  Issues found: 5 slides (Slide 2, 19, 34, 35, 37)
  - Text overflow: 1 slides (Slide 2)
  - Element overflow: 4 slides (Slide 19, 34, 35, 37)

Detailed issues by slide:
  Slide 19: 4 issues
    - slides.md:499 (ol: element overflow)
    - slides.md:520 (li: element overflow)
    - slides.md:522 (p: element overflow)
    - slides.md:522 (strong: element overflow)
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

### 1. Text Overflow (Horizontal)
- Text extending beyond its container horizontally
- Long lines that exceed the slide width
- Content hidden by `overflow: hidden` or `text-overflow: ellipsis`
- Displays the actual overflowing text content

### 2. Element Overflow (Positional)
- Elements exceeding slide boundaries (top, bottom, left, right)
- Images, lists, paragraphs positioned outside visible area
- Content cut off at slide edges
- Shows overflow direction and amount in pixels

### 3. Scrollbar Appearance
- Unintended vertical/horizontal scrollbar appearance
- Containers that have become scrollable

## Requirements

- Node.js 18.x or higher
- Slidev 0.40.x or higher

## Development

### Setup

```bash
git clone https://github.com/mizuirorivi/slidev-overflow-checker.git
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
