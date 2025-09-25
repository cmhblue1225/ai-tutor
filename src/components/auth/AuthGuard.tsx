import React, { useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback = <div className="flex items-center justify-center min-h-screen">로딩중...</div>
}) => {
  const { user, loading, initialized, initialize } = useAuthStore()

  useEffect(() => {
    if (!initialized) {
      initialize()
    }
  }, [initialized, initialize])

  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-m" />
          <p className="text-body text-text-secondary">로딩중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export default AuthGuard