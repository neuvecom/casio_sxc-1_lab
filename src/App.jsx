// ルーティング定義。
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import BankGrid from './pages/BankGrid.jsx'
import Presets from './pages/Presets.jsx'
import Feedback from './pages/Feedback.jsx'
import Admin from './pages/Admin.jsx'
import AdminFeedback from './pages/AdminFeedback.jsx'
import Privacy from './pages/Privacy.jsx'
import Terms from './pages/Terms.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
      <Route path="/terms" element={<Layout><Terms /></Layout>} />
      <Route path="/" element={<Layout><Home /></Layout>} />
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
      <Route
        path="/presets"
        element={
          <ProtectedRoute>
            <Layout>
              <Presets />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/feedback"
        element={
          <ProtectedRoute>
            <Layout>
              <Feedback />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Layout>
              <Admin />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/feedback"
        element={
          <AdminRoute>
            <Layout>
              <AdminFeedback />
            </Layout>
          </AdminRoute>
        }
      />
    </Routes>
  )
}
