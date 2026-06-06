// ルーティング定義。
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Login from './pages/Login.jsx'
import MyPage from './pages/MyPage.jsx'
import BankGrid from './pages/BankGrid.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <MyPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/banks"
        element={
          <ProtectedRoute>
            <Layout>
              <BankGrid />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
