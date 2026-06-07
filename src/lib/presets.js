// presets コレクションの CRUD ヘルパー（書き込みは管理者のみ＝ルールで保護）。
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase.js'

export const CATEGORIES = ['Kick', 'Snare', 'Hihat', 'Loop', 'Synth', 'Bass', 'Voice', 'SE', 'Other']
export const ORIGINS = ['SK-1', 'SK-5', 'CZ-101', 'MT-40', 'unknown']

const presetsCol = () => collection(db, 'presets')

// 入力フォームの値を Firestore 用に整形
function normalize(form) {
  const toNum = (v) => (v === '' || v == null ? null : Number(v))
  const tags =
    typeof form.tags === 'string'
      ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : Array.isArray(form.tags)
        ? form.tags
        : []
  return {
    name: (form.name || '').trim(),
    category: form.category || 'Other',
    origin: form.origin || 'unknown',
    group: (form.group || '').trim(),
    color: form.color || '',
    oneShot: !!form.oneShot,
    loop: !!form.loop,
    defaultBank: toNum(form.defaultBank),
    defaultPad: toNum(form.defaultPad),
    description: (form.description || '').trim(),
    tags,
  }
}

export function subscribePresets(onChange, onError) {
  const q = query(presetsCol(), orderBy('name'))
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError,
  )
}

export async function addPreset(form) {
  return addDoc(presetsCol(), {
    ...normalize(form),
    ratingAvg: 0,
    ratingCount: 0,
    favoriteCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updatePreset(id, form) {
  return updateDoc(doc(db, 'presets', id), {
    ...normalize(form),
    updatedAt: serverTimestamp(),
  })
}

export async function deletePreset(id) {
  return deleteDoc(doc(db, 'presets', id))
}
