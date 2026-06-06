# プロジェクト設定

Hebodan（へぼ談）は Python 製の YouTube 動画自動生成パイプラインです。
テーマ入力 → Gemini で台本生成 → COEIROINK で音声合成 → MoviePy で動画合成
までを `python -m src run` で実行します。

## Claude Code 使用時の重要な指示
- **回答言語**: 必ず日本語で回答すること（英語での回答は禁止）
- **出力スタイル**: Explanatory（説明的）モードを使用
  - 実行する操作の理由を明確に説明
  - コードの変更内容を詳細に解説
  - 各ステップの目的と結果を記述

## ツール実行時の許可ルール
- ツール実行（Bash、ファイル操作など）の許可を求めるときは、必ず日本語で説明・確認を行うこと
- 許可を求める際、以下のセキュリティリスクをパーセンテージ(%)で提示すること
  - パスワードや秘密鍵が外に漏れる可能性
  - 外部サーバーにデータが送られる可能性
  - 悪意あるコードが勝手に動く可能性
  - PCの設定が書き換わる可能性

## ドキュメント構成
- `README.md` — 概要・セットアップ・最小限の使い方（外部向け）
- `manual.md` — 詳細マニュアル（コマンド体系・ワークフロー・アセット構成など）
- `docs-dev/work_log/YYYY-MM-DD.md` — Claude Code との作業ログ
- `docs-dev/idea/` — 検討中・保留中のアイデアメモ
- `docs-dev/assets/` — 本番パイプライン未使用の参考画像

## ブランチ運用
- `main` — 安定ブランチ。直接プッシュ禁止、PR ベースでマージ
- `claude/<feature名>` — 機能追加・修正用ブランチ（例: `claude/long-format-mode`）
  - 1 PR = 1 トピックを原則とする
  - マージ後はブランチ削除して OK

## コミット・PR 規則
- コミットメッセージと GitHub のコメントは日本語で記載
- コミットメッセージ形式：`[種類] 変更内容の説明`
  - 例：`[feat] 長尺モード(--long)を追加`、`[fix] 朗読アノテーション誤発動の修正`
  - 種類: `feat` / `fix` / `refactor` / `perf` / `docs` / `chore` / `test`
- PR タイトルも同じ形式で日本語

## 作業ログ管理
- Claude Code との作業は `docs-dev/work_log/YYYY-MM-DD.md` に保存
- **重要**: 日付は必ず環境設定の `Today's date` を優先して使用すること
  （ファイル名や既存の日付に惑わされない）
- 日付形式は YYYY-MM-DD（例: 2026-06-03）
- 1 日に複数トピックある場合は同じファイルに章を分けて追記
- 過去ログの粒度に合わせ、章構成 `実施内容 / 変更 / 検証 / 後方互換性` を意識

## よく使うコマンド
```bash
# 開発フロー
git checkout main && git pull origin main && git checkout -b claude/<feature>
git status && git diff
git add <files> && git commit -m "[種類] 説明"
git push -u origin claude/<feature>

# アプリ実行（メインユースケース）
.venv/bin/python -m src run "テーマ"               # 全自動・インタラクティブ
.venv/bin/python -m src run -s output/XXXX/script.json    # 既存台本から再開
.venv/bin/python -m src reading <青空文庫URL>      # 朗読コーナーモード
```

## コードスタイル
- インデント: 2 スペース
- 文字コード: UTF-8
- 改行コード: LF
- 言語: Python 3.13 以上
- 依存パッケージ: `requirements.txt` で管理

## 環境前提
- Gemini API キー（`.env` の `GEMINI_API_KEY`）
- COEIROINK ローカル起動（`http://localhost:50032` を期待）
- YouTube OAuth 認証済み（`credentials/youtube_token.json`）
- X (Twitter) API キー（`.env` の `X_*`）
