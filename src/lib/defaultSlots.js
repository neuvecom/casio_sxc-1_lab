// defaultSlots コレクションの読み書きヘルパー。
// 管理者が「現在のバンク配置」を共有のデフォルトとして保存し、
// 新規ユーザーの初回ログイン時にこれを各自の users/{uid}/slots へコピーする。
// ドキュメント ID は users/{uid}/slots と同じ slotId（"b{bank}-p{pad}"）に揃える。
import {
  collection,
  doc,
  getDocs,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase.js'

// Firestore の1バッチ上限は500。余裕を持って450件ずつ commit する。
const BATCH_LIMIT = 450

function defaultSlotsCol() {
  return collection(db, 'defaultSlots')
}

// スロットデータから保存用フィールドを正規化（slots.js の setSlot と同じ形）。
function slotFields(s) {
  return {
    bank: s.bank,
    pad: s.pad,
    type: s.type,
    presetId: s.type === 'preset' ? s.presetId ?? null : null,
    sampleName: s.type === 'sample' ? s.sampleName ?? '' : '',
    memo: s.memo ?? '',
  }
}

async function commitInChunks(ops) {
  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db)
    for (const op of ops.slice(i, i + BATCH_LIMIT)) {
      const ref = doc(db, 'defaultSlots', op.id)
      if (op.type === 'delete') batch.delete(ref)
      else batch.set(ref, op.data)
    }
    await batch.commit()
  }
}

// 現在の配置（slotsMap: { slotId: data }）をデフォルトとして全置換保存する。
// 空き（type 無し / 'empty'）は対象外。既存デフォルトのうち現在配置に無いものは削除。
// 返り値は保存した（使用中）スロット数。
export async function saveDefaultSlots(slotsMap) {
  const existing = await getDocs(defaultSlotsCol())
  const currentIds = new Set(
    Object.entries(slotsMap)
      .filter(([, s]) => s?.type && s.type !== 'empty')
      .map(([id]) => id),
  )

  const ops = []
  // 既存にあるが現在配置に無いものは削除（古いデフォルトの掃除）
  existing.forEach((d) => {
    if (!currentIds.has(d.id)) ops.push({ type: 'delete', id: d.id })
  })
  // 現在配置の使用中スロットを保存
  for (const [id, s] of Object.entries(slotsMap)) {
    if (s?.type && s.type !== 'empty') {
      ops.push({
        type: 'set',
        id,
        data: { ...slotFields(s), updatedAt: serverTimestamp() },
      })
    }
  }

  await commitInChunks(ops)
  return currentIds.size
}

// デフォルト配置を全件取得して { slotId: data } のマップで返す。
export async function fetchDefaultSlots() {
  const snap = await getDocs(defaultSlotsCol())
  const map = {}
  snap.forEach((d) => {
    map[d.id] = d.data()
  })
  return map
}
