# Slidev Overflow Checker

Slidev演示文稿内容溢出自动检测工具

**[English](./README.md)** | **[日本語](./README.ja.md)**

## 功能特点

- **3种溢出检测**: 自动检测文本溢出、元素溢出和滚动条出现
- **多种输出格式**: 支持控制台、HTML和JSON格式输出
- **灵活的启动方式**: 支持指定现有URL或自动启动Slidev
- **可视化报告**: 生成带截图的HTML报告
- **可定制**: 通过配置文件指定检测规则和排除条件
- **CI/CD就绪**: 发现问题时以退出码1退出

## 安装

```bash
npm install -g slidev-overflow-checker
```

或者在项目中本地安装:

```bash
npm install --save-dev slidev-overflow-checker
```

## 使用方法

### 基本用法

检查已运行的Slidev:
```bash
npx slidev-overflow-checker --url http://localhost:3030
```

自动启动Slidev并检查:
```bash
npx slidev-overflow-checker --slides ./slides.md
```

### 选项

```bash
# 生成HTML报告和JSON输出
npx slidev-overflow-checker --url http://localhost:3030 --format html,json

# 仅检查特定页面范围
npx slidev-overflow-checker --url http://localhost:3030 --pages 1-10

# 详细模式: 显示溢出元素的详细信息
npx slidev-overflow-checker --url http://localhost:3030 --verbose

# 指定项目路径以显示对应的Markdown源代码行
npx slidev-overflow-checker --url http://localhost:3030 --project ./my-presentation --verbose

# 使用自定义配置文件
npx slidev-overflow-checker --config ./checker.config.js

# 截图（仅针对有问题的幻灯片）
npx slidev-overflow-checker --url http://localhost:3030 --screenshot

# CI/CD模式: 发现问题时以退出码1退出
npx slidev-overflow-checker --url http://localhost:3030 --fail-on-issues

# 自定义截图选项
npx slidev-overflow-checker --url http://localhost:3030 \
  --screenshot \
  --screenshot-dir ./my-screenshots \
  --screenshot-full-page \
  --no-screenshot-highlight
```

### 详细模式（--verbose）

在详细模式下，会显示溢出元素的详细信息:

- **元素标识**: 标签名、CSS类、选择器
- **溢出量**: 具体像素值
- **元素位置**: 坐标和尺寸
- **文本内容**: 溢出文本的部分内容（文本溢出时）

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

### 项目路径选项（--project）

通过`--project`选项指定Slidev项目目录后，还会显示**对应的Markdown源代码行号**:

```bash
npx slidev-overflow-checker --url http://localhost:3030 --project ./my-presentation --verbose
```

输出示例:
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

这样可以清楚地知道**需要修复哪个文件的哪一行**。

### 配置文件示例

`checker.config.js`:
```javascript
export default {
  url: 'http://localhost:3030',
  format: ['console', 'html'],
  output: './reports',
  threshold: 1,
  wait: 1000,
  concurrency: 1,  // 建议使用1以获得稳定结果
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

## 输出示例

### 控制台输出（普通模式）
```
Checking slide 1/20...
  ✓ No issues found

Checking slide 5/20...
  ⚠ Text overflow detected
  ⚠ Element overflow detected

Checking slide 12/20...
  ⚠ Scrollbar detected

Summary:
  Total slides: 20
  Issues found: 3 slides (Slide 5, 12, 18)
  - Text overflow: 2 slides (Slide 5, 18)
  - Element overflow: 1 slide (Slide 5)
  - Scrollbar detected: 1 slide (Slide 12)
```

### 控制台输出（详细模式 --verbose）
```
Checking slide 5/20...
  ⚠ Text overflow detected:
    - Element: h1.slide-title
      Selector: .slidev-page:nth-child(5) > h1.slide-title
      Container width: 980px
      Content width: 1250px
      Overflow: 270px
      Text: "Introduction to Advanced TypeScript Patterns and Best..."

  ⚠ Element overflow detected:
    - Element: img.hero-image
      Selector: .slidev-page:nth-child(5) > .content > img.hero-image
      Slide bounds: 0, 0, 980, 552
      Element bounds: 50, 100, 1050, 450
      Overflow: right 70px

Summary:
  Total slides: 20
  Issues found: 3 slides (Slide 5, 12, 18)
  - Text overflow: 2 slides (Slide 5, 18)
  - Element overflow: 1 slide (Slide 5)
  - Scrollbar detected: 1 slide (Slide 12)

Detailed issues by slide:
  Slide 5: 2 issues (text overflow, element overflow)
  Slide 12: 1 issue (scrollbar)
  Slide 18: 1 issue (text overflow)
```

### HTML报告

在 `./reports/overflow-report-[timestamp].html` 生成可视化报告。
包含每个有问题幻灯片的截图和详细信息。

## CLI选项列表

| 选项 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--url <url>` | `-u` | 要检查的Slidev URL | - |
| `--slides <path>` | `-s` | Slidev Markdown文件路径 | - |
| `--project <path>` | | Slidev项目目录路径 | - |
| `--pages <range>` | `-p` | 要检查的页面范围（如: 1-10） | 所有页面 |
| `--format <formats>` | `-f` | 输出格式（console,html,json） | console |
| `--output <dir>` | `-o` | 输出目录 | ./reports |
| `--threshold <n>` | `-t` | 溢出检测阈值（px） | 1 |
| `--wait <ms>` | `-w` | 页面切换后等待时间（ms） | 0 |
| `--viewport <size>` | | 视口尺寸 | 1920x1080 |
| `--browser <name>` | `-b` | 浏览器（chromium/firefox/webkit） | chromium |
| `--headless` | | 无头模式 | true |
| `--verbose` | `-v` | 输出详细日志 | false |
| `--fail-on-issues` | | 发现问题时以退出码1退出 | false |
| `--concurrency <n>` | | 并行检查数 | 4 |
| `--config <path>` | `-c` | 配置文件路径 | - |

**注意**: 指定`--project`后，输出中会包含对应的Markdown源代码行号。

## 检测的问题类型

### 1. 文本溢出
- 文本超出容器边界
- 被 `overflow: hidden` 或 `text-overflow: ellipsis` 隐藏的内容

### 2. 元素溢出
- 图片或DIV元素超出幻灯片边界
- 视觉上被裁切的内容

### 3. 滚动条出现
- 意外出现的垂直/水平滚动条
- 变为可滚动的容器

## 系统要求

- Node.js 18.x 或更高版本
- Slidev 0.40.x 或更高版本

## 开发

### 设置

```bash
git clone https://github.com/your-username/slidev-overflow-checker.git
cd slidev-overflow-checker
npm install
```

### 构建

```bash
npm run build
```

### 测试

```bash
npm test
```

### 本地运行

```bash
npm run dev -- --url http://localhost:3030
```

## 许可证

MIT

## 贡献

欢迎提交Issue和Pull Request。

## 相关链接

- [Slidev](https://sli.dev/)
- [Playwright](https://playwright.dev/)
