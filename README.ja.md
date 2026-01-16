# Slidev Overflow Checker

**AIが生成・編集したSlidevスライドのレイアウト破綻を実レンダリングで検出する評価ツール**

Slidev Overflow Checkerは、人間だけでなく**AIエージェント（例：Claude Code）が使用する**ことを想定して設計されています。

**[English](./README.md)** | **[中文](./README.zh.md)**

## なぜこのツールが存在するのか

LLMはテキストや構造の生成は得意ですが、**視覚的なレイアウトの正しさを検証するのは苦手**です。

AIがSlidevプレゼンテーションを生成すると、しばしば以下のような問題が発生します：
- コンテナからはみ出すテキスト
- スライド境界を超える要素
- 意図しないスクロールバーの出現

これらの問題は**Markdownだけでは確実に検出できません**。

Slidev Overflow Checkerは以下の方法でこの問題を解決します：
- 実際のブラウザ（Playwright）でスライドをレンダリング
- レイアウト破綻をピクセル単位で計測
- AIが対応できる機械可読なシグナルを返却

## 想定される使い方（AI-first）

このツールは主に**AIエージェントの外部コマンド/スキル**として使用されることを想定しています。

典型的なワークフロー：

1. AIがSlidev Markdownを生成または編集
2. AIが`slidev-overflow-checker`を実行
3. チェッカーが構造化されたJSONを返却
4. AIがレイアウトの問題を分析
5. AIがテキストを修正、スライドを分割、コンテンツを調整
6. レイアウトの問題がなくなるまで繰り返し

人間は最終出力を確認するだけです。

## 出力：機械可読なレイアウトシグナル

JSON出力がこのツールの**主要なインターフェース**です。

```bash
npx slidev-overflow-checker --url http://localhost:3030 --format json --project ./slides --verbose
```

提供される情報：
- スライド番号
- 問題の種類（`text-overflow` / `element-overflow` / `scrollbar`）
- オーバーフロー量（px）
- 影響を受けるDOMセレクタ
- 対応するMarkdownソースの行（`--project`指定時）

これにより、AIエージェントは以下を判断できます：
- 何を要約すべきか
- いつスライドを分割すべきか
- どの要素をリサイズまたは書き換えるべきか

## このツールが可能にすること

- 視覚的なレイアウト破綻を構造化されたシグナルに変換
- スライドのレイアウト正確性をAIがテスト可能に
- LLMとレンダリング出力のギャップを埋める
- 「生成 → 評価 → 再生成」の反復ループを実現

## 手動 / CI での使用（オプション）

AI-firstの設計ですが、以下の用途で人間が直接使用することも可能です：
- プレゼンテーション前のチェック
- CIの品質ゲート
- レイアウト問題のデバッグ

## インストール

```bash
npm install -g slidev-overflow-checker
```

または、プロジェクトローカルにインストール：

```bash
npm install --save-dev slidev-overflow-checker
```

## CLIの使い方

### 基本的な使い方

既存のSlidevサーバーをチェック：
```bash
npx slidev-overflow-checker --url http://localhost:3030
```

Slidevを自動起動してチェック：
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

詳細モードでは、見切れている要素の詳細情報が表示されます：

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

`--project`オプションでSlidevプロジェクトのディレクトリを指定すると、**Markdownソースの該当行番号**も表示されます：

```bash
npx slidev-overflow-checker --url http://localhost:3030 --project ./my-presentation --verbose
```

出力例：
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

## CLIオプション一覧

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

## 設定

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
