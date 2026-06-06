// ログイン後のマイページ（最小実装）。
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { SLOT_COUNT, BANK_COUNT, PAD_COUNT } from '../lib/banks.js'

export default function MyPage() {
  const { user } = useAuth()

  return (
    <div>
      <h1 className="text-xl font-bold">マイページ</h1>
      <p className="mt-1 text-sm text-slate-400">
        ようこそ、{user?.displayName || user?.email || 'ユーザー'} さん
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
          <div className="text-3xl font-bold text-emerald-400">{BANK_COUNT}</div>
          <div className="text-sm text-slate-400">バンク</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
          <div className="text-3xl font-bold text-emerald-400">{PAD_COUNT}</div>
          <div className="text-sm text-slate-400">パッド／バンク</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
          <div className="text-3xl font-bold text-emerald-400">{SLOT_COUNT}</div>
          <div className="text-sm text-slate-400">総スロット</div>
        </div>
      </div>

      <div className="mt-6">
        <Link
          to="/banks"
          className="inline-block rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500"
        >
          バンク空き状況を見る →
        </Link>
      </div>
    </div>
  )
}
