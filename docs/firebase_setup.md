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

方法はいくつかあります。手軽な順に:

### 方法A: コンソールに貼り付け（CLI 不要・最も簡単）

1. Firebase コンソール →「Firestore Database」→「ルール」タブ
2. リポジトリの `firestore.rules` の中身を貼り付け →「公開」

### 方法B: npx（グローバルインストール不要）

```bash
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore:rules
```

### 方法C: Homebrew で CLI を導入（macOS）

```bash
brew install firebase-cli
firebase login
firebase use --add              # .firebaserc が作られる
firebase deploy --only firestore:rules
```

> 注意: `npm install -g firebase-tools` は macOS（Homebrew）だと
> `/usr/local/lib` の権限で EACCES になりがちです。`sudo` は使わず、
> 上記 A〜C のいずれかを推奨します。

## 8. 管理者権限の付与（プリセット登録用）

プリセットの登録・編集は管理者（Custom Claims `admin: true`）のみ可能です。
運営アカウントの UID に、付属スクリプト `scripts/setAdmin.mjs` で一度だけ付与します。

1. Firebase コンソール > プロジェクトの設定 > サービスアカウント で
   「新しい秘密鍵の生成」→ JSON をダウンロード
2. リポジトリ直下に `serviceAccountKey.json` として配置（※`.gitignore` 済・コミット禁止）
3. 対象 UID（コンソール > Authentication > Users で確認）を引数に実行:

```bash
node scripts/setAdmin.mjs <管理者のUID>
```

4. 付与後、対象ユーザーは**一度ログアウト→再ログイン**するとトークンが更新され、
   画面に「管理」メニューと `/admin` ページが現れる。

> サービスアカウント鍵は機密情報です。リポジトリに**絶対にコミットしない**でください。
