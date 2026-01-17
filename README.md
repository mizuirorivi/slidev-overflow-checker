# Slidev Overflow Checker

**Detect visual overflow in Slidev presentations through real browser rendering.**

Designed for **AI agents** to automatically find and fix layout issues that cannot be detected from Markdown alone.

**[日本語](./README.ja.md)** | **[中文](./README.zh.md)**

## Quick Start

```bash
# 1. Install
npm install -g slidev-overflow-checker

# 2. Start your Slidev presentation
cd your-slidev-project
npx slidev dev

# 3. Run checker (in another terminal)
slidev-overflow-checker --url http://localhost:3030 --project ./ --verbose
```

## Features

- **Real Browser Rendering** - Uses Playwright to render slides exactly as users see them
- **Precise Detection** - Measures overflow in pixels, reports exact source lines
- **AI-Friendly Output** - Structured output that AI agents can parse and act on
- **Zero Config** - Works out of the box with any Slidev project

## Detection Types

| Type | Description | Example |
|------|-------------|---------|
| `text-overflow` | Text extends horizontally beyond container | Long titles, unwrapped text |
| `element-overflow` | Elements exceed slide boundaries | Too many list items, large images |
| `scrollbar` | Unintended scrollbars appear | Content overflow causing scroll |

## Output Example

```
Checking slide 19/40...
  ⚠ Element overflow detected:
    - Element: li
      Overflow: bottom 58.94px
      Content: "Black's King is exposed in center"

      Source: slides.md:520
      520 | 3. Black's King is exposed in center

Summary:
  Total slides: 40
  Issues found: 5 slides (Slide 2, 19, 34, 35, 37)
```

## AI Agent Setup

For AI agents (Claude Code, Cursor, etc.) to automatically detect and fix overflow:

### 1. Install globally

```bash
npm install -g slidev-overflow-checker
# or from GitHub
npm install -g github:mizuirorivi/slidev-overflow-checker
```

### 2. Add command template to your project

```bash
mkdir -p .claude/commands
curl -o .claude/commands/fix-slidev-overflow.md \
  https://raw.githubusercontent.com/mizuirorivi/slidev-overflow-checker/master/templates/fix-slidev-overflow.md
```

### 3. Use with AI

Start Slidev, then ask your AI:

```
/fix-slidev-overflow ./
```

The AI will:
1. Run the overflow checker
2. Identify problematic markdown lines
3. Fix issues (shorten text, split slides, etc.)
4. Re-run to verify fixes

## CLI Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--url <url>` | `-u` | Slidev server URL (required) | - |
| `--project <path>` | | Project path for source mapping | - |
| `--verbose` | `-v` | Show detailed issue information | false |
| `--pages <range>` | `-p` | Check specific pages (e.g., 1-10) | all |
| `--format <type>` | `-f` | Output: console, json, html | console |
| `--threshold <n>` | `-t` | Overflow threshold in px | 1 |
| `--fail-on-issues` | | Exit code 1 if issues found (CI) | false |

## Common Fixes

| Issue | Fix |
|-------|-----|
| Long title | Shorten or split into title + subtitle |
| Too many bullets | Split into multiple slides |
| Large image | Add width constraint: `{width=500px}` |
| Wide table | Reduce columns or split |
| Long code block | Use smaller font or split |

## Configuration File

Create `checker.config.js`:

```javascript
export default {
  url: 'http://localhost:3030',
  format: ['console', 'json'],
  threshold: 1,
  exclude: ['.slidev-page-indicator', '.slidev-nav']
};
```

Run with:
```bash
slidev-overflow-checker --config ./checker.config.js
```

## CI/CD Integration

```yaml
# GitHub Actions example
- name: Check Slidev overflow
  run: |
    npx slidev dev &
    sleep 10
    slidev-overflow-checker --url http://localhost:3030 --fail-on-issues
```

## Why This Tool?

LLMs are good at generating text, but **bad at validating visual layout**.

When AI generates Slidev presentations:
- Text overflows containers
- Elements exceed slide boundaries
- Unintended scrollbars appear

These issues **cannot be detected from Markdown alone** - they only appear when rendered.

This tool bridges the gap by:
1. Rendering slides in a real browser
2. Measuring layout breakage in pixels
3. Returning machine-readable signals for AI to act on

## Requirements

- Node.js 18+
- Slidev 0.40+

## License

MIT

## Links

- [Slidev](https://sli.dev/)
- [Playwright](https://playwright.dev/)
- [GitHub](https://github.com/mizuirorivi/slidev-overflow-checker)
