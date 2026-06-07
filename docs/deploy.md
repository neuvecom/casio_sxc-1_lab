# main へのマージ／本番デプロイ

## 1. ブランチ運用とマージ

- `main` は安定ブランチ。**直接プッシュせず、PR でマージ**する。
- 開発は `claude/<feature名>` ブランチで行う（現状: `claude/zealous-turing-80e95`）。

### マージの流れ

1. GitHub で作業ブランチ → `main` への Pull Request を作成
2. 差分・CI を確認してマージ
3. マージ後、作業ブランチは削除して OK

> いま GitHub 上には作業ブランチが push 済み。PR 作成は Web の「Compare & pull request」から、
> または依頼があれば Claude 側で作成可能。

## 2. 本番デプロイ（Firebase Hosting）

`firebase.json` に Hosting 設定（`public: dist`／SPA リライト）を用意済み。

### 手動デプロイ

```bash
npm run build                       # dist/ を生成
firebase deploy --only hosting      # 本番へ反映
```

- 初回のみ `firebase use --add` でプロジェクトを紐付け（`.firebaserc` が作られる）。
- ルールも一緒に更新する場合: `firebase deploy --only hosting,firestore:rules`

公開 URL は `https://<プロジェクトID>.web.app`（および `.firebaseapp.com`）。

### 環境変数（重要）

- ビルド時に `.env` の `VITE_FIREBASE_*` が埋め込まれる。デプロイ環境でも同じ `.env` が必要。
- Firebase の Web API キーは公開前提（秘密ではない）。ただし機密（サービスアカウント鍵）は絶対に含めない。

## 3. （任意）GitHub Actions による自動デプロイ

`main` への push をトリガに自動ビルド＆デプロイする CI を組める。

- 必要なもの: Firebase のサービスアカウントを GitHub Secrets に登録、
  `VITE_FIREBASE_*` も Secrets 化してビルドに注入。
- `firebase init hosting:github` で雛形を生成するのが簡単。

> 自動デプロイを導入する場合は、Secrets 管理とプレビューチャンネル運用を別途設計する。
