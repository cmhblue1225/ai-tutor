import React from 'react'
import Button from './ui/Button'

interface PremiumHeaderProps {
  user: any
  profile: any
  onSignOut: () => void
}

const PremiumHeader: React.FC<PremiumHeaderProps> = ({ user, profile, onSignOut }) => {
  return (
    <nav className="relative overflow-hidden">
      {/* 배경 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-r from-white via-blue-50/30 to-orange-50/30" />

      {/* 장식 요소 */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/20 to-transparent rounded-full -translate-y-32 translate-x-32 float-animation" />
      <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-br from-orange-100/20 to-transparent rounded-full -translate-y-24 -translate-x-24 float-animation" style={{ animationDelay: '2s' }} />

      <div className="relative container-custom">
        <div className="flex items-center justify-between h-20">
          {/* 로고 */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-colored group-hover:scale-110 transition-transform duration-300">
                <span className="text-white font-bold text-lg">AI</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                StudyAI
              </div>
              <div className="text-xs text-text-tertiary font-medium">
                AI-Powered Learning
              </div>
            </div>
          </div>

          {/* 사용자 정보 */}
          <div className="flex items-center gap-6">
            {/* 알림 */}
            <button className="relative p-2 hover:bg-white/50 rounded-2xl transition-colors group">
              <svg className="w-6 h-6 text-text-secondary group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-3.5-3.5M9 7L3 13h5v7h4V10z" />
              </svg>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            </button>

            {/* 설정 */}
            <button className="p-2 hover:bg-white/50 rounded-2xl transition-colors group">
              <svg className="w-6 h-6 text-text-secondary group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* 구분선 */}
            <div className="w-px h-8 bg-gray-200" />

            {/* 사용자 프로필 */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-semibold text-text-primary">
                  {profile?.full_name || '학습자'}
                </div>
                <div className="text-xs text-text-tertiary">
                  Level {profile?.stats?.level || 1} • {profile?.stats?.total_points || 0}P
                </div>
              </div>

              {/* 아바타 */}
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-semibold shadow-lg">
                  {(profile?.full_name || user?.email || 'U')[0].toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full border-2 border-white" />
              </div>

              {/* 로그아웃 버튼 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onSignOut}
                className="hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default PremiumHeader