# slidev-overflow-checker: AI Assistant Guide

## Purpose

Detects visual overflow issues in Slidev presentations through real browser rendering, and provides actionable feedback for AI to fix layout problems.

## AI Prompt

Japanese:
```
`slidev-overflow-checker --url http://localhost:3030 --project ./ --verbose` でSlidevスライドのオーバーフロー（見切れ）を検出できます。Slidevを起動した状態でこのコマンドを実行し、検出された問題箇所のMarkdownを修正してください。修正後は再度実行して問題が解消されたか確認してください。
```

English:
```
Run `slidev-overflow-checker --url http://localhost:3030 --project ./ --verbose` to detect overflow issues in Slidev slides. Execute this command while Slidev is running, fix the problematic markdown sections reported, and re-run to verify all issues are resolved.
```

Chinese:
```
运行 `slidev-overflow-checker --url http://localhost:3030 --project ./ --verbose` 检测Slidev幻灯片的溢出问题。在Slidev运行时执行此命令，修复报告的markdown问题部分，然后重新运行以验证所有问题已解决。
```

## Prerequisites

- Slidev dev server must be running
- Node.js 18+ installed

```bash
# Start Slidev first
npx slidev dev
```

## Installation

```bash
npm install -g slidev-overflow-checker
# or
yarn global add slidev-overflow-checker
# or from GitHub
npm install -g github:mizuirorivi/slidev-overflow-checker
```

## Key Options

| Option | Description |
|--------|-------------|
| `--url <url>` | Slidev server URL (required) |
| `--project <path>` | Project path for source mapping |
| `--verbose` | Show detailed issue information |
| `--threshold <n>` | Overflow detection threshold in px (default: 1) |
| `--pages <range>` | Check specific pages (e.g., 1-10, 5) |
| `--format <type>` | Output format: console, json, html |

## AI Fixing Workflow

### 1. Detect Issues

```bash
slidev-overflow-checker --url http://localhost:3030 --project ./ --verbose
```

### 2. Analyze Output

The output shows:
- **Slide number**: Which slide has the issue
- **Issue type**: `text-overflow` (horizontal) or `element-overflow` (positional)
- **Source location**: Exact line in markdown (e.g., `slides.md:520`)
- **Content**: The actual text/element causing overflow

### 3. Fix Based on Issue Type

Apply fixes based on the reported issue type.

### 4. Verify Fixes

Re-run the checker to confirm all issues resolved:

```bash
slidev-overflow-checker --url http://localhost:3030 --project ./ --verbose
```

## Output Format

```
Checking slide 19/40...
  ⚠ Element overflow detected:
    - Element: li
      Overflow: bottom 58.94px
      Content: "Black's King is exposed in center"

      Source: slides.md:520
      520 | 3. Black's King is exposed in center
```

## Issue Types and Fixes

### Text Overflow (Horizontal)

Text extends beyond slide width.

**Before:**
```markdown
# This is a very long title that will definitely overflow the slide boundary and cause issues
```

**After:**
```markdown
# Shorter Title
## Subtitle for additional context
```

### Element Overflow - Bottom

Too much content, extends below slide.

**Before:**
```markdown
- Item 1
- Item 2
- Item 3
- Item 4
- Item 5
- Item 6
- Item 7
- Item 8
```

**After (split into two slides):**
```markdown
- Item 1
- Item 2
- Item 3
- Item 4

---

- Item 5
- Item 6
- Item 7
- Item 8
```

### Element Overflow - Right

Wide content like tables or code blocks.

**Before:**
```markdown
| Column1 | Column2 | Column3 | Column4 | Column5 | Column6 | Column7 | Column8 |
```

**After:**
```markdown
| Column1 | Column2 | Column3 | Column4 |
```

Or split into multiple tables/slides.

### Large Images

**Before:**
```markdown
![Large Image](./image.png)
```

**After:**
```markdown
<img src="./image.png" class="w-2/3 mx-auto" />
```

Or with Slidev syntax:
```markdown
![Large Image](./image.png){width=500px}
```

## Common Patterns

| Pattern | Issue | Fix |
|---------|-------|-----|
| Long headings | Text overflow | Shorten or split into heading + subheading |
| Many list items | Bottom overflow | Split into multiple slides |
| Large code blocks | Bottom/right overflow | Use smaller font or split |
| Wide tables | Right overflow | Reduce columns or use scrollable container |
| Large images | Any overflow | Add width constraints |
| Dense paragraphs | Bottom overflow | Summarize or split content |

## Best Practices

1. **Run early and often** - Check after adding new content
2. **Fix highest overflow first** - Larger px values indicate bigger problems
3. **Consider slide density** - Aim for 3-5 bullet points per slide
4. **Use Slidev layouts** - `two-cols`, `image-right` help distribute content
5. **Test at target resolution** - Default is 1920x1080

## Iterative Workflow

```
┌─────────────────┐
│  Edit Markdown  │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Run Checker    │
└────────┬────────┘
         ▼
    ┌────┴────┐
    │ Issues? │
    └────┬────┘
     Yes │ No
         │  └──► Done!
         ▼
┌─────────────────┐
│  Fix Issues     │
└────────┬────────┘
         │
         └──► (repeat)
```
