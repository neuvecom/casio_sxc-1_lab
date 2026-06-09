// users/{uid} プロフィールの初期化ヘルパー。
// 新規ユーザーの初回ログイン時に、プロフィールを作成しつつ
// 管理者が保存したデフォルト配置（defaultSlots）を各自のスロットへコピーする。
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  onSnapshot,
  query,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase.js'
import { fetchDefaultSlots, currentDefaultsVersion } from './defaultSlots.js'

const BATCH_LIMIT = 450

// 既にスロットを1件でも持っているか（読み取り1回で判定）。
async function userHasAnySlot(uid) {
  const snap = await getDocs(query(collection(db, 'users', uid, 'slots'), limit(1)))
  return !snap.empty
}

// 自分のプロフィールを購読（{ ...data } または null）。defaultsVersion 等の取得に使う。
export function subscribeUserProfile(uid, onChange, onError) {
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => onChange(snap.exists() ? snap.data() : null),
    onError,
  )
}

// 空きスロットだけをデフォルトで埋める（既存配置は保護）。
// existingSlotIds: 既に使用中の slotId の集合。返り値は取り込んだ件数。
export async function fillEmptySlotsFromDefaults(uid, existingSlotIds) {
  const defaults = await fetchDefaultSlots()
  const entries = Object.entries(defaults).filter(([id]) => !existingSlotIds.has(id))
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

// 取り込み／見送り後に「確認済みデフォルトバージョン」を記録（以後バナーを出さない）。
export async function markDefaultsVersion(uid, version) {
  await setDoc(doc(db, 'users', uid), { defaultsVersion: version }, { merge: true })
}

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

  // プロフィール未作成。ただしプロフィール導入前から登録している既存会員が
  // すでにスロットを持っている場合は、その配置を上書きしないようコピーしない。
  // （新規ユーザー＝スロット0件のときだけデフォルトを丸ごとコピーする）
  let seededSlotCount = 0
  // defaultsVersion: 丸ごとコピーした新規は最新版で初期化（バナーを出さない）。
  // コピーしなかった既存会員は 0 のままにして、バナーで取り込みを促す。
  let defaultsVersion = 0
  try {
    if (!(await userHasAnySlot(user.uid))) {
      seededSlotCount = await seedSlotsFromDefaults(user.uid)
      defaultsVersion = await currentDefaultsVersion()
    }
  } catch {
    // デフォルト配置のコピー失敗はログインを妨げない（後から手動配置も可能）
  }

  await setDoc(profileRef, {
    displayName: user.displayName || '',
    createdAt: serverTimestamp(),
    seededSlotCount, // デフォルトから何件コピーしたかの記録（既存会員は 0）
    defaultsVersion, // 確認済みデフォルトバージョン（既存会員は 0＝未確認）
  })
  return true
}
