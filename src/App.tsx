import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AuthGuard from './components/auth/AuthGuard'
import AdminProtectedRoute from './components/AdminProtectedRoute'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import StudyRoom from './pages/StudyRoom'
import AdminDashboard from './pages/AdminDashboard'
import AdminFileUpload from './pages/AdminFileUpload'
import AdminMonitoring from './pages/AdminMonitoring'
import AdminExamSchedule from './pages/AdminExamSchedule'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/"
            element={
              <AuthGuard fallback={<AuthPage />}>
                <Dashboard />
              </AuthGuard>
            }
          />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route
            path="/dashboard"
            element={
              <AuthGuard fallback={<AuthPage />}>
                <Dashboard />
              </AuthGuard>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/upload"
            element={
              <AdminProtectedRoute>
                <AdminFileUpload />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/monitoring"
            element={
              <AdminProtectedRoute>
                <AdminMonitoring />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/exam-schedule"
            element={
              <AdminProtectedRoute>
                <AdminExamSchedule />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/room/:roomId"
            element={
              <AuthGuard fallback={<AuthPage />}>
                <StudyRoom />
              </AuthGuard>
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
