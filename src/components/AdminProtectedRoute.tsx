import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

interface AdminProtectedRouteProps {
  children: React.ReactNode
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { checkAdminAccess, initialized, loading } = useAuthStore()

  // 초기화 중이거나 로딩 중일 때
  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="card-premium text-center py-16 max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 gradient-primary rounded-full flex items-center justify-center">
            <div className="loading-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">권한 확인 중...</h3>
          <p className="text-gray-600">잠시만 기다려주세요</p>
        </div>
      </div>
    )
  }

  // 관리자 권한이 없으면 로그인 페이지로 리다이렉트
  if (!checkAdminAccess()) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default AdminProtectedRoute