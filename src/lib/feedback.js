// feedback コレクションの読み書き。要望・不具合の受付に使う。
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase.js'

const feedbackCol = () => collection(db, 'feedback')

export const FEEDBACK_TYPES = ['要望', '不具合', 'その他']

// ログインユーザーが送信（ルールで uid == 本人 を要求）
export async function submitFeedback(user, { type, message, contact }) {
  return addDoc(feedbackCol(), {
    uid: user.uid,
    email: user.email || '',
    type: type || 'その他',
    message: (message || '').trim(),
    contact: (contact || '').trim(),
    userAgent: navigator.userAgent,
    status: 'open',
    createdAt: serverTimestamp(),
  })
}

// 管理者向け: 一覧を新しい順で購読
export function subscribeFeedback(onChange, onError) {
  const q = query(feedbackCol(), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError,
  )
}

// 管理者向け: 対応状態の切替（open / resolved）
export async function setFeedbackStatus(id, status) {
  return updateDoc(doc(db, 'feedback', id), { status })
}
