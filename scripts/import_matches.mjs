// matches.csv の照合結果を Firestore のプリセットに反映する。
//
// 繋ぎ: matches.csv(bank/pad) → users/{uid}/slots(bank/pad→presetId) → presets/{id}
// 反映内容（方針: 由来＋補助情報・名前は上書きしない）:
//   - origin: 照合した機種（SK-1 / MT-40 ...）
//   - match:  { reference, name, note, category, type, similarity, confident, dupGroup, matchedAt }
//   ※ name / category / oneShot / loop など手入力した項目は変更しない。
//
// 使い方:
//   1. serviceAccountKey.json をリポジトリ直下に配置（.gitignore済）
//   2. ドライラン（書き込まない）:
//        node scripts/import_matches.mjs --csv matches.csv
//   3. 実際に反映:
//        node scripts/import_matches.mjs --csv matches.csv --apply
//   --uid を省略するとユーザーが1人ならそれを自動採用、複数なら一覧表示して終了。
import admin from 'firebase-admin'
import { readFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: {
    csv: { type: 'string', default: 'matches.csv' },
    uid: { type: 'string' },
    key: { type: 'string', default: 'serviceAccountKey.json' },
    apply: { type: 'boolean', default: false },
  },
})

// --- CSV パース（ダブルクォート対応の最小実装）---
function parseCSV(text) {
  const rows = []
  let field = ''
  let record = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { record.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      if (field !== '' || record.length) { record.push(field); rows.push(record); record = []; field = '' }
    } else field += c
  }
  if (field !== '' || record.length) { record.push(field); rows.push(record) }
  const header = rows.shift()
  return rows.map((r) => Object.fromEntries(header.map((h, idx) => [h, r[idx] ?? ''])))
}

async function main() {
  let sa
  try {
    sa = JSON.parse(await readFile(values.key, 'utf8'))
  } catch {
    console.error(`${values.key} が見つかりません（サービスアカウント鍵を配置してください）`)
    process.exit(1)
  }
  admin.initializeApp({ credential: admin.credential.cert(sa) })
  const db = admin.firestore()

  // uid 解決
  let uid = values.uid
  if (!uid) {
    const list = await admin.auth().listUsers(1000)
    if (list.users.length === 1) uid = list.users[0].uid
    else {
      console.error('ユーザーが複数います。--uid を指定してください:')
      list.users.forEach((u) => console.error('  ', u.uid, u.email || ''))
      process.exit(1)
    }
  }

  const rows = parseCSV(await readFile(values.csv, 'utf8'))

  // slotId -> presetId
  const slotsSnap = await db.collection('users').doc(uid).collection('slots').get()
  const slotToPreset = {}
  slotsSnap.forEach((d) => {
    const v = d.data()
    if (v.presetId) slotToPreset[d.id] = v.presetId
  })

  const updates = []
  let missing = 0
  for (const r of rows) {
    const slotId = r.slot_id || `b${r.bank}-p${r.pad}`
    const presetId = slotToPreset[slotId]
    if (!presetId) { missing++; continue }
    updates.push({
      presetId,
      slotId,
      data: {
        origin: r.origin || 'unknown',
        match: {
          reference: r.best_reference,
          name: r.sound_name,
          note: r.note,
          category: r.category,
          type: r.type,
          similarity: Number(r.similarity),
          confident: String(r.confident).toLowerCase() === 'true',
          dupGroup: Number(r.dup_group),
          matchedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      },
    })
  }

  console.log(`CSV ${rows.length}行 / スロット一致 ${updates.length} / 対応プリセットなし ${missing}`)
  if (!updates.length) process.exit(0)

  if (!values.apply) {
    console.log('\n[DRY RUN] 書き込みません。--apply で反映します。先頭10件の反映内容:')
    updates.slice(0, 10).forEach((u) =>
      console.log(`  ${u.slotId} → preset ${u.presetId}: origin=${u.data.origin}, name=${u.data.match.name}, note=${u.data.match.note}, conf=${u.data.match.confident}`),
    )
    process.exit(0)
  }

  let n = 0
  for (let i = 0; i < updates.length; i += 400) {
    const batch = db.batch()
    for (const u of updates.slice(i, i + 400)) {
      batch.set(db.collection('presets').doc(u.presetId), u.data, { merge: true })
      n++
    }
    await batch.commit()
  }
  console.log(`✔ ${n} 件のプリセットを更新しました`)
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
