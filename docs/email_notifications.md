# メール通知の導入計画（Blaze 前提・未実装）

> 状態: 計画のみ。**Cloud Functions が必要 ＝ Firebase Blaze（従量課金）プラン**が前提。
> 小規模なら無料枠内に収まる見込みだが、課金アカウントの紐付けが要る。

## やりたいこと

1. **新規ユーザー登録時に管理者へメール通知**
2. **フィードバック投稿時に管理者へメール通知**
3.（任意）**ユーザーへウェルカムメール**

いずれも「サーバー側でメールを送る」処理が必要で、静的ホスティング＋クライアントだけでは
実現できない。Cloud Functions（または同等のサーバー）＋メール送信サービスを使う。

## 構成案

- **トリガ**:
  - 新規登録 → Auth `onCreate`（または `beforeUserCreated`）
  - フィードバック → Firestore `feedback/{id}` の `onCreate`
- **送信**: 外部メールAPI（無料枠あり）
  - 例: Resend / SendGrid / Mailgun / Brevo
  - APIキーは Functions のシークレット（`firebase functions:secrets`）で管理（コミット禁止）
- **宛先**: 運営者のメール（環境変数/シークレット）

## 必要な手順（概要）

1. Firebase を **Blaze プラン**にアップグレード（無料枠あり）
2. `firebase init functions`（Node）
3. メール送信サービスに登録し、APIキーを取得 → `firebase functions:secrets:set` で登録
4. 関数を実装（Auth onCreate / Firestore onCreate → メール送信）
5. `firebase deploy --only functions`

## コードのイメージ（Resend の例・未配置）

```js
// functions/index.js（イメージ）
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { defineSecret } from 'firebase-functions/params'
const RESEND_KEY = defineSecret('RESEND_KEY')

export const notifyFeedback = onDocumentCreated(
  { document: 'feedback/{id}', secrets: [RESEND_KEY] },
  async (event) => {
    const d = event.data.data()
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY.value()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'SXC-1 Lab <noreply@example.com>',
        to: '運営者のメール',
        subject: `【SXC-1 Lab】${d.type}が届きました`,
        text: `${d.message}\n\nfrom: ${d.email} ${d.contact || ''}`,
      }),
    })
  },
)
```

## コスト感

- Cloud Functions・メールAPIともに**小規模なら無料枠内**で収まることが多い。
- ただし Blaze は従量課金。上限アラート（予算アラート）を設定しておくと安心。

## 当面の代替（Blaze 不要）

- 新規登録の確認: Authentication のユーザー一覧を目視。
- フィードバック確認: `/admin/feedback` を定期的に開く（実装済み）。
- 本人確認メール: email verification（無料・実装済み）。
