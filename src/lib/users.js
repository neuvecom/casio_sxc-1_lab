// users/{uid} プロフィールの初期化ヘルパー。
// 新規ユーザーの初回ログイン時に、プロフィールを作成しつつ
// 管理者が保存したデフォルト配置（defaultSlots）を各自のスロットへコピーする。
import {
  doc,
  getDoc,
  setDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase.js'
import { fetchDefaultSlots } from './defaultSlots.js'

const BATCH_LIMIT = 450

// デフォルト配置を自分のスロットへコピーする。返り値はコピーした件数。
async function seedSlotsFromDefaults(uid) {
  const defaults = await fetchDefaultSlots()
  const entries = Object.entries(defaults)
  if (entries.length === 0) return 0

  for (let i = 0; i < entries.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db)
    for (const [id, s] of entries.slice(i, i + BATCH_LIMIT)) {
      batch.set(doc(db, 'users', uid, 'slots', id), {
        bank: s.bank,
        pad: s.pad,
        type: s.type,
        presetId: s.type === 'preset' ? s.presetId ?? null : null,
        sampleName: s.type === 'sample' ? s.sampleName ?? '' : '',
        memo: s.memo ?? '',
        updatedAt: serverTimestamp(),
      })
    }
    await batch.commit()
  }
  return entries.length
}

// 初回ログイン処理（冪等）。プロフィールが既にあれば何もしない。
// プロフィールが無ければ＝初回とみなし、デフォルト配置をコピーしてから
// プロフィールを作成する。コピーの失敗はログイン自体を妨げない。
// 返り値: 初回初期化を行ったら true、そうでなければ false。
export async function ensureUserInitialized(user) {
  if (!user) return false
  const profileRef = doc(db, 'users', user.uid)
  const snap = await getDoc(profileRef)
  if (snap.exists()) return false // 初回ではない

  let seededSlotCount = 0
  try {
    seededSlotCount = await seedSlotsFromDefaults(user.uid)
  } catch {
    // デフォルト配置のコピー失敗はログインを妨げない（後から手動配置も可能）
  }

  await setDoc(profileRef, {
    displayName: user.displayName || '',
    createdAt: serverTimestamp(),
    seededSlotCount, // デフォルトから何件コピーしたかの記録
  })
  return true
}
