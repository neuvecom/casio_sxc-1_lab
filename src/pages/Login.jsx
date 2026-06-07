// ログイン／新規登録ページ（Google・メールアドレス）。
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function Login() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, isFirebaseConfigured } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleGoogle = async () => {
    setError('')
    setBusy(true)
    try {
      await loginWithGoogle()
      navigate('/')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const handleEmail = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') await loginWithEmail(email, password)
      else await registerWithEmail(email, password)
      navigate('/')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center">
          SXC-1 <span className="text-emerald-400">Lab</span>
        </h1>
        <p className="mt-1 text-center text-sm text-slate-400">
          プリセット／バンク管理
        </p>

        {!isFirebaseConfigured && (
          <div className="mt-4 rounded-md border border-amber-600/50 bg-amber-950/40 p-3 text-sm text-amber-300">
            Firebase が未設定です。<code>.env.example</code> を参考に <code>.env</code> を作成してください。
          </div>
        )}

        <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950 p-6">
          <button
            onClick={handleGoogle}
            disabled={busy || !isFirebaseConfigured}
            className="w-full rounded-md bg-white px-4 py-2 font-medium text-slate-900 hover:bg-slate-200 disabled:opacity-50"
          >
            Google でログイン
          </button>

          <div className="my-4 flex items-center gap-3 text-xs text-slate-500">
            <span className="h-px flex-1 bg-slate-800" />または<span className="h-px flex-1 bg-slate-800" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            <input
              type="email"
              required
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="パスワード（6文字以上）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={busy || !isFirebaseConfigured}
              className="w-full rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {mode === 'login' ? 'ログイン' : '新規登録'}
            </button>
          </form>

          {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="mt-4 w-full text-center text-sm text-slate-400 hover:text-slate-200"
          >
            {mode === 'login' ? 'アカウントを作成する' : 'ログインに戻る'}
          </button>
        </div>
      </div>
    </div>
  )
}
