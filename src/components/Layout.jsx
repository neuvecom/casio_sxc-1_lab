// 共通レイアウト（ヘッダー＋ナビ）。
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function Layout({ children }) {
  const { user, isAdmin, signOut, resendVerification } = useAuth()
  const navigate = useNavigate()
  const [resent, setResent] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleResend = async () => {
    try {
      await resendVerification()
      setResent(true)
    } catch {
      setResent(true)
    }
  }

  const navClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'
    }`

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-bold tracking-tight">
            SXC-1 <span className="text-emerald-400">Lab</span>
          </Link>
          <nav className="flex items-center gap-1">
            {user ? (
              <>
                <NavLink to="/" end className={navClass}>
                  ホーム
                </NavLink>
                <NavLink to="/banks" className={navClass}>
                  バンク
                </NavLink>
                <NavLink to="/presets" className={navClass}>
                  プリセット
                </NavLink>
                <NavLink to="/feedback" className={navClass}>
                  フィードバック
                </NavLink>
                {isAdmin && (
                  <NavLink to="/admin" className={navClass}>
                    管理
                  </NavLink>
                )}
                <button
                  onClick={handleSignOut}
                  className="ml-2 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  ログイン
                </Link>
                <Link
                  to="/login?mode=register"
                  className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                >
                  新規登録
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      {user && user.emailVerified === false && (
        <div className="border-b border-amber-700/40 bg-amber-950/40 text-amber-200">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-2 text-sm">
            メールアドレスが未確認です。受信メールのリンクから確認してください。
            {resent ? (
              <span className="text-amber-300">確認メールを再送しました。</span>
            ) : (
              <button onClick={handleResend} className="underline hover:text-amber-100">
                確認メールを再送
              </button>
            )}
          </div>
        </div>
      )}
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-4 text-center text-xs text-slate-500">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span>SXC-1 Lab（運営: ヘボ談）</span>
            <Link to="/privacy" className="hover:text-slate-300">プライバシーポリシー</Link>
            <Link to="/terms" className="hover:text-slate-300">利用規約</Link>
            <a href="mailto:tsunomegane@gmail.com" className="hover:text-slate-300">お問い合わせ</a>
          </div>
          <p className="mt-2 text-slate-600">
            当サイトは Amazon アソシエイト・プログラムの参加者です。
          </p>
        </div>
      </footer>
    </div>
  )
}
