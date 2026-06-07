# casio_sxc-1_lab

CASIO **SXC-1**（ポータブル・スタンドアロン・サンプラー）の
**プリセット／バンク管理 Web アプリ**です。

公式の全プリセット名一覧が非公開なため、管理者が実機を採取して作成するプリセット DB を
基盤に、ユーザーが自分の 1280スロット（80バンク × 16パッド）の空き状況・メモ・お気に入りを
管理できるようにします。

## 技術スタック

- フロントエンド: Vite + React + React Router
- スタイリング: Tailwind CSS（v4）
- バックエンド／認証: Firebase（Authentication + Cloud Firestore）

## セットアップ

```bash
npm install
cp .env.example .env   # Firebase の設定値を記入
npm run dev            # 開発サーバー起動
npm run build          # 本番ビルド
```

`.env` には Firebase コンソールで取得した設定（`VITE_FIREBASE_*`）を記入します。
未設定でもアプリは起動しますが、認証は無効になります。
詳しい接続手順は `docs/firebase_setup.md` を参照してください。

## ドキュメント

- `docs/requirements.md` — 要件定義
- `docs/db_schema.md` — Firestore データ設計
- `docs/reference/` — 公式マニュアル PDF など一次情報

## ディレクトリ

```
docs/         # 要件・設計・一次情報
src/
  pages/      # 画面（Login / MyPage / BankGrid）
  components/ # 共通UI（Layout / ProtectedRoute）
  contexts/   # 認証コンテキスト
  lib/        # Firebase 初期化・バンク定数
```
