// 要望・不具合の送信フォーム（ログインユーザー向け）。
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { FEEDBACK_TYPES, submitFeedback } from '../lib/feedback.js'

export default function Feedback() {
  const { user } = useAuth()
  const [type, setType] = useState('要望')
  const [message, setMessage] = useState('')
  const [contact, setContact] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) {
      setError('内容を入力してください')
      return
    }
    setError('')
    setBusy(true)
    try {
      await submitFeedback(user, { type, message, contact })
      setDone(true)
      setMessage('')
      setContact('')
    } catch (err) {
      setError(`送信に失敗しました：${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    'w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500'

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold">フィードバック</h1>
      <p className="mt-1 text-sm text-slate-400">
        要望・不具合・ご意見をお寄せください。開発の参考にします。
      </p>

      {done ? (
        <div className="mt-6 rounded-md border border-emerald-600/50 bg-emerald-950/40 p-4 text-sm text-emerald-300">
          送信ありがとうございました！
          <button onClick={() => setDone(false)} className="ml-2 underline hover:text-emerald-200">
            続けて送る
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          {error && (
            <div className="rounded-md border border-rose-600/50 bg-rose-950/40 p-3 text-sm text-rose-300">
              {error}
            </div>
          )}
          <label className="block text-sm">
            種類
            <select className={`${inputClass} mt-1`} value={type} onChange={(e) => setType(e.target.value)}>
              {FEEDBACK_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            内容 <span className="text-rose-400">*</span>
            <textarea
              rows={5}
              className={`${inputClass} mt-1`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="例：バンク一覧で○○できると嬉しい / ○○の操作で表示が崩れる"
            />
          </label>
          <label className="block text-sm">
            連絡先（任意）
            <input
              className={`${inputClass} mt-1`}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="返信が必要な場合のメール等（任意）"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            送信する
          </button>
        </form>
      )}
    </div>
  )
}
