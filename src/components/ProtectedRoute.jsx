// ログイン必須ページのガード。未ログインなら /login へ。
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="p-8 text-slate-400">読み込み中…</div>
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}
