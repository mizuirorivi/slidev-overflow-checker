# Slidev Overflow Checker

Slidevプレゼンテーションのコンテンツ見切れを自動検出するツール

**[English](./README.md)** | **[中文](./README.zh.md)**

## 特徴

- **3種類の見切れ検出**: テキストオーバーフロー、要素のはみ出し、スクロールバーの出現を自動検出
- **複数の出力形式**: コンソール、HTML、JSONで結果を出力
- **柔軟な起動方法**: 既存URLの指定またはSlidevの自動起動に対応
- **視覚的なレポート**: スクリーンショット付きのHTMLレポート生成
- **カスタマイズ可能**: 設定ファイルで検出ルールや除外条件を指定
- **CI/CD対応**: 問題検出時に終了コード1で終了

## インストール

```bash
npm install -g slidev-overflow-checker
```

または、プロジェクトローカルにインストール:

```bash
npm install --save-dev slidev-overflow-checker
```

## 使い方

### 基本的な使い方

既存のSlidevをチェック:
```bash
npx slidev-overflow-checker --url http://localhost:3030
```

Slidevを自動起動してチェック:
```bash
npx slidev-overflow-checker --slides ./slides.md
```

### オプション

```bash
# HTMLレポートとJSON出力を生成
npx slidev-overflow-checker --url http://localhost:3030 --format html,json

# 特定のページ範囲のみチェック
npx slidev-overflow-checker --url http://localhost:3030 --pages 1-10

# 詳細モード: どの要素が見切れているか詳細情報を表示
npx slidev-overflow-checker --url http://localhost:3030 --verbose

# プロジェクトパスを指定してMarkdownソースの該当行も表示
npx slidev-overflow-checker --url http://localhost:3030 --project ./my-presentation --verbose

# カスタム設定ファイルを使用
npx slidev-overflow-checker --config ./checker.config.js

# スクリーンショットを撮影（問題があるスライドのみ）
npx slidev-overflow-checker --url http://localhost:3030 --screenshot

# CI/CDモード: 問題が見つかった場合に終了コード1で終了
npx slidev-overflow-checker --url http://localhost:3030 --fail-on-issues

# スクリーンショットのカスタマイズ
npx slidev-overflow-checker --url http://localhost:3030 \
  --screenshot \
  --screenshot-dir ./my-screenshots \
  --screenshot-full-page \
  --no-screenshot-highlight
```

### 詳細モード（--verbose）

詳細モードでは、見切れている要素の詳細情報が表示されます:

- **要素の識別情報**: タグ名、CSSクラス、セレクタ
- **オーバーフロー量**: 具体的なピクセル数
- **要素の位置**: 座標とサイズ
- **テキスト内容**: 見切れているテキストの一部（テキストオーバーフローの場合）

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

### プロジェクトパス指定（--project）

`--project`オプションでSlidevプロジェクトのディレクトリを指定すると、**Markdownソースの該当行番号**も表示されます:

```bash
npx slidev-overflow-checker --url http://localhost:3030 --project ./my-presentation --verbose
```

出力例:
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

これにより、**どのファイルの何行目を修正すれば良いか**が一目瞭然になります。

### 設定ファイル例

`checker.config.js`:
```javascript
export default {
  url: 'http://localhost:3030',
  format: ['console', 'html'],
  output: './reports',
  threshold: 1,
  wait: 1000,
  concurrency: 1,  // 安定した結果を得るには1を推奨
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

## 出力例

### コンソール出力（通常モード）
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

### コンソール出力（詳細モード --verbose）
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

### HTMLレポート

`./reports/overflow-report-[timestamp].html` に視覚的なレポートが生成されます。
各問題のあるスライドのスクリーンショットと詳細情報が含まれます。

## CLI オプション一覧

| オプション | 短縮形 | 説明 | デフォルト |
|----------|-------|------|----------|
| `--url <url>` | `-u` | チェックするSlidevのURL | - |
| `--slides <path>` | `-s` | Slidevのマークダウンファイルパス | - |
| `--project <path>` | | Slidevプロジェクトのディレクトリパス | - |
| `--pages <range>` | `-p` | チェックするページ範囲 (例: 1-10) | 全ページ |
| `--format <formats>` | `-f` | 出力形式（console,html,json） | console |
| `--output <dir>` | `-o` | 出力ディレクトリ | ./reports |
| `--threshold <n>` | `-t` | オーバーフロー検出の閾値(px) | 1 |
| `--wait <ms>` | `-w` | ページ遷移後の待機時間(ms) | 0 |
| `--viewport <size>` | | ビューポートサイズ | 1920x1080 |
| `--browser <name>` | `-b` | ブラウザ (chromium/firefox/webkit) | chromium |
| `--headless` | | ヘッドレスモード | true |
| `--verbose` | `-v` | 詳細ログを出力 | false |
| `--fail-on-issues` | | 問題検出時に終了コード1で終了 | false |
| `--concurrency <n>` | | 並列チェック数 | 4 |
| `--config <path>` | `-c` | 設定ファイルのパス | - |

**注**: `--project`を指定すると、Markdownソースの該当行番号が出力に含まれます。

## 検出される問題

### 1. テキストのオーバーフロー
- テキストがコンテナからはみ出している
- `overflow: hidden` や `text-overflow: ellipsis` で隠されているコンテンツ

### 2. 要素の切れ・はみ出し
- 画像やDIV要素がスライド境界を超えている
- 視覚的に見切れているコンテンツ

### 3. スクロールバーの出現
- 意図しない縦・横スクロールバーの出現
- スクロール可能になっているコンテナ

## 要件

- Node.js 18.x 以上
- Slidev 0.40.x 以上

## 開発

### セットアップ

```bash
git clone https://github.com/your-username/slidev-overflow-checker.git
cd slidev-overflow-checker
npm install
```

### ビルド

```bash
npm run build
```

### テスト

```bash
npm test
```

### ローカル実行

```bash
npm run dev -- --url http://localhost:3030
```

## ライセンス

MIT

## 貢献

Issue や Pull Request を歓迎します。

## 関連リンク

- [Slidev](https://sli.dev/)
- [Playwright](https://playwright.dev/)
