# Slidev Overflow Checker

**通过真实浏览器渲染检测AI生成的Slidev幻灯片布局问题的评估工具**

Slidev Overflow Checker 设计为供**AI代理（如 Claude Code）使用**，而不仅仅是人类。

**[English](./README.md)** | **[日本語](./README.ja.md)**

## 为什么需要这个工具

LLM擅长生成文本和结构，但**不擅长验证视觉布局的正确性**。

当AI生成Slidev演示文稿时，经常会产生以下问题：
- 文本溢出容器
- 元素超出幻灯片边界
- 意外出现滚动条

这些问题**仅靠Markdown无法可靠检测**。

Slidev Overflow Checker 通过以下方式解决这个问题：
- 在真实浏览器（Playwright）中渲染幻灯片
- 以像素为单位测量布局问题
- 返回AI可处理的机器可读信号

## 预期用法（AI优先）

此工具主要设计为**AI代理的外部命令/技能**。

典型工作流程：

1. AI生成或编辑Slidev Markdown
2. AI运行 `slidev-overflow-checker`
3. 检查器返回结构化JSON
4. AI分析布局问题
5. AI修改文本、拆分幻灯片或调整内容
6. 重复直到没有布局问题

人类只需审核最终输出。

## 输出：机器可读的布局信号

JSON输出是此工具的**主要接口**。

```bash
npx slidev-overflow-checker --url http://localhost:3030 --format json --project ./slides --verbose
```

提供的信息：
- 幻灯片编号
- 问题类型（`text-overflow` / `element-overflow` / `scrollbar`）
- 溢出量（px）
- 受影响的DOM选择器
- 对应的Markdown源代码行（使用 `--project` 时）

这使AI代理能够：
- 决定需要精简什么内容
- 决定何时拆分幻灯片
- 决定需要调整或重写哪些元素

## 这个工具能实现什么

- 将视觉布局问题转换为结构化信号
- 使幻灯片布局正确性可被AI测试
- 弥合LLM与渲染输出之间的差距
- 实现"生成 → 评估 → 重新生成"的迭代循环

## 手动/CI使用（可选）

虽然设计为AI优先，但该工具也可以直接供人类使用：
- 演示前检查
- CI质量门禁
- 调试布局问题

## 安装

```bash
npm install -g slidev-overflow-checker
```

或者在项目中本地安装：

```bash
npm install --save-dev slidev-overflow-checker
```

## CLI使用方法

### 基本用法

检查已运行的Slidev服务器：
```bash
npx slidev-overflow-checker --url http://localhost:3030
```

自动启动Slidev并检查：
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

在详细模式下，会显示溢出元素的详细信息：

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

通过 `--project` 选项指定Slidev项目目录后，还会显示**对应的Markdown源代码行号**：

```bash
npx slidev-overflow-checker --url http://localhost:3030 --project ./my-presentation --verbose
```

输出示例：
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

## 配置

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
