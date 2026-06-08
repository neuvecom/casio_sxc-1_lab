// 管理者向け: フィードバック一覧。
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { subscribeFeedback, setFeedbackStatus } from '../lib/feedback.js'

export default function AdminFeedback() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsub = subscribeFeedback(
      (list) => {
        setItems(list)
        setLoading(false)
      },
      (e) => {
        setError(`読み込みに失敗しました：${e.message}`)
        setLoading(false)
      },
    )
    return unsub
  }, [])

  const toggle = (f) =>
    setFeedbackStatus(f.id, f.status === 'resolved' ? 'open' : 'resolved').catch((e) =>
      setError(`更新に失敗しました：${e.message}`),
    )

  const fmt = (ts) => (ts?.toDate ? ts.toDate().toLocaleString('ja-JP') : '')

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">フィードバック一覧</h1>
        <Link to="/admin" className="text-sm text-emerald-400 hover:underline">
          ← プリセット管理へ
        </Link>
      </div>
      <p className="mt-1 text-sm text-slate-400">未対応 {items.filter((f) => f.status !== 'resolved').length} 件</p>

      {error && (
        <div className="mt-3 rounded-md border border-rose-600/50 bg-rose-950/40 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 text-slate-400">読み込み中…</div>
      ) : items.length === 0 ? (
        <div className="mt-6 text-slate-500">まだフィードバックはありません。</div>
      ) : (
        <div className="mt-5 space-y-3">
          {items.map((f) => (
            <div
              key={f.id}
              className={`rounded-lg border p-4 ${
                f.status === 'resolved'
                  ? 'border-slate-800 bg-slate-950 opacity-60'
                  : 'border-slate-700 bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                <span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">{f.type}</span>
                  <span className="ml-2">{fmt(f.createdAt)}</span>
                </span>
                <button
                  onClick={() => toggle(f)}
                  className="rounded border border-slate-700 px-2 py-1 hover:bg-slate-800"
                >
                  {f.status === 'resolved' ? '未対応に戻す' : '対応済みにする'}
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-100">{f.message}</p>
              <div className="mt-2 text-xs text-slate-500">
                {f.email || '(メール不明)'}
                {f.contact && <> ／ 連絡先: {f.contact}</>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
