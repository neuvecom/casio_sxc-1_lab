// 管理者専用ページのガード。未ログインは /login、非管理者は権限エラー表示。
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()

  if (loading) {
    return <div className="p-8 text-slate-400">読み込み中…</div>
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (!isAdmin) {
    return (
      <div className="p-8 text-rose-300">
        このページは管理者専用です。権限がありません。
      </div>
    )
  }
  return children
}
