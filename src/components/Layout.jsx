// 共通レイアウト（ヘッダー＋ナビ）。
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function Layout({ children }) {
  const { user, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
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
            {user && (
              <>
                <NavLink to="/" end className={navClass}>
                  マイページ
                </NavLink>
                <NavLink to="/banks" className={navClass}>
                  バンク
                </NavLink>
                <NavLink to="/presets" className={navClass}>
                  プリセット
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
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  )
}
