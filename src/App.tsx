import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AuthGuard from './components/auth/AuthGuard'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import StudyRoom from './pages/StudyRoom'

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
          <Route
            path="/dashboard"
            element={
              <AuthGuard fallback={<AuthPage />}>
                <Dashboard />
              </AuthGuard>
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
