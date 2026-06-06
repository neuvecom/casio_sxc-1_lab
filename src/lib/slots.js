// users/{uid}/slots の読み書きヘルパー。
// スロット種別が 'empty' のときはドキュメントを削除し、書き込み量を節約する
// （ドキュメント未作成＝空き、という db_schema の方針に合わせる）。
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase.js'
import { slotId } from './banks.js'

function slotsCollection(uid) {
  return collection(db, 'users', uid, 'slots')
}

// スロットの変更を購読。onChange に { slotId: data } のマップを渡す。
// 返り値は購読解除関数。
export function subscribeSlots(uid, onChange, onError) {
  return onSnapshot(
    slotsCollection(uid),
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

// スロットの内容を保存。type が 'empty' なら削除。
// data: { type, presetId, sampleName, memo }
export async function setSlot(uid, bank, pad, data) {
  const ref = doc(db, 'users', uid, 'slots', slotId(bank, pad))
  if (!data.type || data.type === 'empty') {
    await deleteDoc(ref)
    return
  }
  await setDoc(
    ref,
    {
      bank,
      pad,
      type: data.type,
      presetId: data.type === 'preset' ? data.presetId || null : null,
      sampleName: data.type === 'sample' ? data.sampleName || '' : '',
      memo: data.memo || '',
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
