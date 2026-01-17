# Slidev Overflow Checker

**通过真实浏览器渲染检测Slidev演示文稿中的视觉溢出**

专为**AI代理**设计，自动发现和修复仅靠Markdown无法检测的布局问题。

**[English](./README.md)** | **[日本語](./README.ja.md)**

## 快速开始

```bash
# 1. 安装
npm install -g slidev-overflow-checker

# 2. 启动Slidev演示文稿
cd your-slidev-project
npx slidev dev

# 3. 运行检查器（在另一个终端）
slidev-overflow-checker --url http://localhost:3030 --project ./ --verbose
```

## 特性

- **真实浏览器渲染** - 使用Playwright精确再现实际显示效果
- **精确检测** - 以像素为单位测量溢出，报告准确的源代码行
- **AI友好输出** - AI代理可以解析和处理的结构化输出
- **零配置** - 开箱即用，适用于任何Slidev项目

## 检测类型

| 类型 | 描述 | 示例 |
|------|------|------|
| `text-overflow` | 文本水平方向超出容器 | 长标题、未换行的文本 |
| `element-overflow` | 元素超出幻灯片边界 | 列表项过多、大图片 |
| `scrollbar` | 出现意外的滚动条 | 内容溢出导致滚动 |

## 输出示例

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

## AI代理设置

为AI代理（Claude Code、Cursor等）启用自动检测和修复：

### 1. 全局安装

```bash
npm install -g slidev-overflow-checker
# 或者从GitHub安装
npm install -g github:mizuirorivi/slidev-overflow-checker
```

### 2. 添加命令模板

```bash
mkdir -p .claude/commands
curl -o .claude/commands/fix-slidev-overflow.md \
  https://raw.githubusercontent.com/mizuirorivi/slidev-overflow-checker/master/templates/fix-slidev-overflow.md
```

### 3. 与AI一起使用

启动Slidev后，向AI请求：

```
/fix-slidev-overflow ./
```

AI将自动：
1. 运行溢出检查器
2. 识别有问题的Markdown行
3. 修复问题（缩短文本、拆分幻灯片等）
4. 重新运行以验证修复

## CLI选项

| 选项 | 简写 | 描述 | 默认值 |
|------|------|------|--------|
| `--url <url>` | `-u` | Slidev服务器URL（必需） | - |
| `--project <path>` | | 用于源映射的项目路径 | - |
| `--verbose` | `-v` | 显示详细信息 | false |
| `--pages <range>` | `-p` | 检查特定页面（如：1-10） | 所有页面 |
| `--format <type>` | `-f` | 输出格式：console、json、html | console |
| `--threshold <n>` | `-t` | 溢出阈值（像素） | 1 |
| `--fail-on-issues` | | 发现问题时返回退出码1（CI用） | false |

## 常见修复方法

| 问题 | 修复方法 |
|------|----------|
| 标题过长 | 缩短或拆分为标题+副标题 |
| 列表项过多 | 拆分为多张幻灯片 |
| 图片过大 | 添加宽度约束：`{width=500px}` |
| 表格过宽 | 减少列数或拆分 |
| 代码块过长 | 使用较小字体或拆分 |

## 配置文件

创建 `checker.config.js`：

```javascript
export default {
  url: 'http://localhost:3030',
  format: ['console', 'json'],
  threshold: 1,
  exclude: ['.slidev-page-indicator', '.slidev-nav']
};
```

运行：
```bash
slidev-overflow-checker --config ./checker.config.js
```

## CI/CD集成

```yaml
# GitHub Actions示例
- name: 检查Slidev溢出
  run: |
    npx slidev dev &
    sleep 10
    slidev-overflow-checker --url http://localhost:3030 --fail-on-issues
```

## 为什么需要这个工具？

LLM擅长生成文本，但**不擅长验证视觉布局**。

当AI生成Slidev演示文稿时：
- 文本溢出容器
- 元素超出幻灯片边界
- 出现意外的滚动条

这些问题**仅靠Markdown无法检测** - 只有渲染后才能发现。

这个工具弥合了这个差距：
1. 在真实浏览器中渲染幻灯片
2. 以像素为单位测量布局问题
3. 返回AI可以处理的机器可读信号

## 系统要求

- Node.js 18+
- Slidev 0.40+

## 许可证

MIT

## 链接

- [Slidev](https://sli.dev/)
- [Playwright](https://playwright.dev/)
- [GitHub](https://github.com/mizuirorivi/slidev-overflow-checker)
