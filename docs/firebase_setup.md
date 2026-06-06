# Firebase 接続手順

このアプリを動かすには Firebase プロジェクトが必要です。以下を一度だけ実施します。

## 1. プロジェクト作成

1. [Firebase コンソール](https://console.firebase.google.com/) を開く
2. 「プロジェクトを追加」→ 名前（例: `sxc-1-lab`）を入力して作成
3. Google アナリティクスは任意（不要ならオフでOK）

## 2. Authentication を有効化

1. 左メニュー「Authentication」→「始める」
2. 「Sign-in method」タブで以下を有効化:
   - **Google**（プロジェクトのサポートメールを設定）
   - **メール / パスワード**

## 3. Cloud Firestore を作成

1. 左メニュー「Firestore Database」→「データベースの作成」
2. ロケーション（例: `asia-northeast1`＝東京）を選択
3. 本番モードで開始（ルールは後でこのリポジトリの `firestore.rules` を反映）

## 4. Web アプリ登録と設定値の取得

1. プロジェクト設定（歯車）→「マイアプリ」→ Web アプリ（`</>`）を追加
2. 表示される `firebaseConfig` の各値を控える

## 5. .env を作成

リポジトリ直下で:

```bash
cp .env.example .env
```

`.env` に手順4の値を記入:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

> 補足: Firebase の Web API キーは「秘密鍵」ではなく公開前提の識別子です。
> ただし誤コミット防止のため `.env` は `.gitignore` 済みにしています。

## 6. 起動して確認

```bash
npm run dev
```

ログイン画面の警告（「Firebase が未設定です」）が消え、Google／メールでログインできれば成功です。

## 7. セキュリティルールの反映（任意・推奨）

Firebase CLI を使うとリポジトリの `firestore.rules` をそのまま適用できます。

```bash
npm install -g firebase-tools   # 未インストールの場合
firebase login
firebase use --add              # 対象プロジェクトを選択（.firebaserc が作られる）
firebase deploy --only firestore:rules
```

## 8. 管理者権限の付与（プリセット登録用）

プリセットの登録・編集は管理者（Custom Claims `admin: true`）のみ可能です。
運営アカウントの UID に対し、Admin SDK で一度だけ付与します（例: ローカルの Node スクリプト）。

```js
// サービスアカウント鍵が必要（コンソール > プロジェクト設定 > サービスアカウント）
const admin = require('firebase-admin')
admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) })
admin.auth().setCustomUserClaims('<管理者のUID>', { admin: true })
  .then(() => console.log('done'))
```

> サービスアカウント鍵は機密情報です。リポジトリに**絶対にコミットしない**でください。
