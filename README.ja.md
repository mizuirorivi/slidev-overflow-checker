# Slidev Overflow Checker

**実ブラウザレンダリングでSlidevプレゼンテーションの見切れを検出**

Markdownだけでは検出できないレイアウト問題を、**AIエージェント**が自動的に発見・修正できるよう設計。

**[English](./README.md)** | **[中文](./README.zh.md)**

## クイックスタート

```bash
# 1. インストール
npm install -g slidev-overflow-checker

# 2. Slidevを起動
cd your-slidev-project
npx slidev dev

# 3. チェッカーを実行（別ターミナルで）
slidev-overflow-checker --url http://localhost:3030 --project ./ --verbose
```

## 特徴

- **実ブラウザレンダリング** - Playwrightで実際の表示を再現
- **精密な検出** - ピクセル単位でオーバーフローを測定、正確なソース行を報告
- **AI親和性** - AIエージェントがパース・処理できる構造化出力
- **設定不要** - どのSlidevプロジェクトでもすぐに使える

## 検出タイプ

| タイプ | 説明 | 例 |
|--------|------|-----|
| `text-overflow` | テキストが水平方向にはみ出し | 長いタイトル、改行されないテキスト |
| `element-overflow` | 要素がスライド境界を超過 | リスト項目が多すぎる、大きな画像 |
| `scrollbar` | 意図しないスクロールバー出現 | コンテンツ溢れによるスクロール |

## 出力例

```
Checking slide 19/40...
  ⚠ Element overflow detected:
    - Element: li
      Overflow: bottom 58.94px
      Content: "中央に露出 → 白の攻撃の的"

      Source: slides.md:520
      520 | 3. 中央に露出 → 白の攻撃の的

Summary:
  Total slides: 40
  Issues found: 5 slides (Slide 2, 19, 34, 35, 37)
```

## AIエージェント設定

AIエージェント（Claude Code、Cursorなど）で自動検出・修正を有効にする：

### 1. グローバルインストール

```bash
npm install -g slidev-overflow-checker
# または GitHubから
npm install -g github:mizuirorivi/slidev-overflow-checker
```

### 2. コマンドテンプレートを追加

```bash
mkdir -p .claude/commands
curl -o .claude/commands/fix-slidev-overflow.md \
  https://raw.githubusercontent.com/mizuirorivi/slidev-overflow-checker/master/templates/fix-slidev-overflow.md
```

### 3. AIで使用

Slidevを起動後、AIに依頼：

```
/fix-slidev-overflow ./
```

AIが自動的に：
1. オーバーフローチェッカーを実行
2. 問題のあるMarkdown行を特定
3. 修正（テキスト短縮、スライド分割など）
4. 再実行して修正を確認

## CLIオプション

| オプション | 短縮形 | 説明 | デフォルト |
|-----------|-------|------|-----------|
| `--url <url>` | `-u` | SlidevサーバーURL（必須） | - |
| `--project <path>` | | ソースマッピング用プロジェクトパス | - |
| `--verbose` | `-v` | 詳細情報を表示 | false |
| `--pages <range>` | `-p` | チェックするページ（例: 1-10） | 全ページ |
| `--format <type>` | `-f` | 出力形式: console, json, html | console |
| `--threshold <n>` | `-t` | オーバーフロー閾値（px） | 1 |
| `--fail-on-issues` | | 問題検出時に終了コード1（CI用） | false |

## よくある修正パターン

| 問題 | 修正方法 |
|------|---------|
| 長いタイトル | 短くするか、タイトル+サブタイトルに分割 |
| 箇条書きが多すぎる | 複数スライドに分割 |
| 大きな画像 | 幅を指定: `{width=500px}` |
| 幅広のテーブル | 列を減らすか分割 |
| 長いコードブロック | フォントを小さくするか分割 |

## 設定ファイル

`checker.config.js` を作成：

```javascript
export default {
  url: 'http://localhost:3030',
  format: ['console', 'json'],
  threshold: 1,
  exclude: ['.slidev-page-indicator', '.slidev-nav']
};
```

実行：
```bash
slidev-overflow-checker --config ./checker.config.js
```

## CI/CD連携

```yaml
# GitHub Actionsの例
- name: Slidevオーバーフローチェック
  run: |
    npx slidev dev &
    sleep 10
    slidev-overflow-checker --url http://localhost:3030 --fail-on-issues
```

## なぜこのツールが必要か？

LLMはテキスト生成は得意だが、**視覚的レイアウトの検証は苦手**。

AIがSlidevプレゼンテーションを生成すると：
- テキストがコンテナからはみ出す
- 要素がスライド境界を超える
- 意図しないスクロールバーが出現

これらの問題は**Markdownだけでは検出できない** - レンダリングして初めて分かる。

このツールはそのギャップを埋める：
1. 実ブラウザでスライドをレンダリング
2. ピクセル単位でレイアウト破綻を計測
3. AIが対応できる機械可読シグナルを返却

## 要件

- Node.js 18+
- Slidev 0.40+

## ライセンス

MIT

## リンク

- [Slidev](https://sli.dev/)
- [Playwright](https://playwright.dev/)
- [GitHub](https://github.com/mizuirorivi/slidev-overflow-checker)
