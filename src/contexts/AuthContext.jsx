// 認証状態を全体に提供するコンテキスト。
// Firebase 未設定でも動くよう、未設定時は user=null・各操作はエラーを投げる。
import { createContext, useContext, useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../lib/firebase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        // Custom Claims (admin: true) で管理者を判定
        try {
          const token = await u.getIdTokenResult()
          setIsAdmin(token.claims.admin === true)
        } catch {
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const requireConfig = () => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase が未設定です（.env を確認してください）')
    }
  }

  const loginWithGoogle = () => {
    requireConfig()
    return signInWithPopup(auth, new GoogleAuthProvider())
  }
  const loginWithEmail = (email, password) => {
    requireConfig()
    return signInWithEmailAndPassword(auth, email, password)
  }
  const registerWithEmail = (email, password) => {
    requireConfig()
    return createUserWithEmailAndPassword(auth, email, password)
  }
  const signOut = () => {
    requireConfig()
    return fbSignOut(auth)
  }

  const value = {
    user,
    isAdmin,
    loading,
    isFirebaseConfigured,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth は AuthProvider の内側で使用してください')
  return ctx
}
