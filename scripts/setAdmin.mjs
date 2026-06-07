// 指定ユーザーに管理者権限（Custom Claims: admin: true）を付与するスクリプト。
//
// 使い方:
//   1. Firebase コンソール > プロジェクトの設定 > サービスアカウント で
//      「新しい秘密鍵の生成」を実行し、JSON をダウンロード
//   2. リポジトリ直下に serviceAccountKey.json として配置（※コミット禁止・.gitignore済）
//   3. 対象ユーザーの UID（コンソール > Authentication > Users で確認）を引数に実行:
//        node scripts/setAdmin.mjs <UID>
//   4. 付与後、対象ユーザーは一度ログアウト→再ログイン（トークン更新）で反映される
//
// 取り消す場合は scripts/setAdmin.mjs の claims を { admin: false } にして実行。
import admin from 'firebase-admin'
import { readFile } from 'node:fs/promises'

const keyPath = new URL('../serviceAccountKey.json', import.meta.url)

let serviceAccount
try {
  serviceAccount = JSON.parse(await readFile(keyPath, 'utf8'))
} catch {
  console.error('serviceAccountKey.json が見つかりません。手順1〜2を実施してください。')
  process.exit(1)
}

const uid = process.argv[2]
if (!uid) {
  console.error('使い方: node scripts/setAdmin.mjs <UID>')
  process.exit(1)
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })

await admin.auth().setCustomUserClaims(uid, { admin: true })
console.log(`✔ admin:true を付与しました: ${uid}`)
console.log('※ 反映には対象ユーザーの再ログイン（トークン更新）が必要です')
process.exit(0)
