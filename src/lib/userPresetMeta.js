// users/{uid}/userPresetMeta の読み書きヘルパー。
// プリセットごとのユーザー個別データ（お気に入り・★評価・メモ）を保持する。
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase.js'

function metaCollection(uid) {
  return collection(db, 'users', uid, 'userPresetMeta')
}

// 変更を購読。onChange に { presetId: data } のマップを渡す。
export function subscribeUserPresetMeta(uid, onChange, onError) {
  return onSnapshot(
    metaCollection(uid),
    (snap) => {
      const map = {}
      snap.forEach((d) => {
        map[d.id] = d.data()
      })
      onChange(map)
    },
    onError,
  )
}

// 部分更新（favorite / rating / memo のいずれか）をマージ保存。
export async function setUserPresetMeta(uid, presetId, patch) {
  const ref = doc(db, 'users', uid, 'userPresetMeta', presetId)
  await setDoc(ref, { ...patch, updatedAt: serverTimestamp() }, { merge: true })
}
