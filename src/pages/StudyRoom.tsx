import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { getStudyRoom, type StudyRoom } from '../lib/studyRooms'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ChatInterface from '../components/ChatInterface'
import ProgressTracker from '../components/ProgressTracker'
import StudyMaterialViewer from '../components/StudyMaterialViewer'
import NotificationToast from '../components/NotificationToast'
import { useTabNotifications } from '../hooks/useTabNotifications'
import CacheDebugPanel from '../components/CacheDebugPanel'

const StudyRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [room, setRoom] = useState<StudyRoom | null>(null)
  const [activeTab, setActiveTab] = useState<'chat' | 'progress' | 'materials'>('chat')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 탭 알림 시스템
  const {
    notifications,
    badges,
    clearTabBadge,
    removeNotification,
    getTabBadge,
    getSuggestedTab
  } = useTabNotifications(roomId || '')

  useEffect(() => {
    if (!user?.id || !roomId) {
      navigate('/')
      return
    }
    loadStudyRoom()
  }, [user?.id, roomId])

  const loadStudyRoom = async () => {
    if (!roomId) return

    try {
      setIsLoading(true)
      const roomData = await getStudyRoom(roomId)

      // 사용자 소유 확인
      if (roomData.user_id !== user?.id) {
        setError('접근 권한이 없습니다.')
        return
      }

      setRoom(roomData)
    } catch (err) {
      console.error('Failed to load study room:', err)
      setError('스터디 룸을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const getGoalTypeIcon = (goalType: 'certification' | 'skill_improvement') => {
    return goalType === 'certification' ? '🏆' : '🎨'
  }

  const getGoalTypeText = (goalType: 'certification' | 'skill_improvement') => {
    return goalType === 'certification' ? '자격증 취득' : '스킬 향상'
  }

  // 탭 전환 핸들러 (배지 클리어 포함)
  const handleTabChange = (tabId: 'chat' | 'progress' | 'materials') => {
    setActiveTab(tabId)
    clearTabBadge(tabId) // 탭 전환 시 해당 탭의 배지 클리어
  }

  // 탭 배지 렌더링
  const renderTabBadge = (tabId: 'chat' | 'progress' | 'materials') => {
    const badge = getTabBadge(tabId)
    if (!badge) return null

    const badgeColor = badge.type === 'new' ? 'bg-green-500' :
                      badge.type === 'achievement' ? 'bg-yellow-500' : 'bg-blue-500'

    return (
      <span className={`absolute -top-1 -right-1 ${badgeColor} text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce-once`}>
        {badge.count}
      </span>
    )
  }

  const tabs = [
    {
      id: 'chat' as const,
      name: 'AI 튜터',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      id: 'progress' as const,
      name: '학습 진도',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'materials' as const,
      name: '학습 자료',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="card-premium text-center py-16 max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 gradient-primary rounded-full flex items-center justify-center">
            <div className="loading-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">스터디 룸 로딩 중...</h3>
          <p className="text-gray-600">잠시만 기다려주세요</p>
        </div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="card-premium text-center py-16 max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{error || '스터디 룸을 찾을 수 없습니다'}</h3>
          <Button
            variant="primary"
            onClick={() => navigate('/')}
            className="gradient-primary text-white"
          >
            대시보드로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="hover:bg-gray-100"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                대시보드
              </Button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white font-semibold">
                  {getGoalTypeIcon(room.goal_type)}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{room.name}</h1>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{getGoalTypeText(room.goal_type)}</span>
                    <span>•</span>
                    <span>{room.category}</span>
                    <span>•</span>
                    <span>{room.subject}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200/30">
        <div className="container-custom">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-4 border-b-2 transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.name}</span>
                {renderTabBadge(tab.id)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="container-custom py-8">
        {activeTab === 'chat' && (
          <ChatInterface roomId={room.id} room={room} />
        )}

        {activeTab === 'progress' && (
          <ProgressTracker roomId={room.id} room={room} />
        )}

        {activeTab === 'materials' && (
          <StudyMaterialViewer roomId={room.id} room={room} />
        )}
      </main>

      {/* 알림 토스트 컨테이너 */}
      <div className="fixed top-20 right-4 z-50 space-y-3 max-w-sm">
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onRemove={removeNotification}
            onTabSwitch={handleTabChange}
          />
        ))}
      </div>

      {/* 탭 전환 추천 배너 */}
      {getSuggestedTab() && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-w-md mx-auto animate-slide-in-right">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {getSuggestedTab()!.reason}
                </p>
                <button
                  onClick={() => handleTabChange(getSuggestedTab()!.tab)}
                  className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition-colors"
                >
                  {tabs.find(tab => tab.id === getSuggestedTab()!.tab)?.name} 확인하기
                </button>
              </div>
              <button
                onClick={() => {}} // getSuggestedTab를 숨기는 로직 필요 시 추가
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 개발용 캐시 디버그 패널 */}
      <CacheDebugPanel />
    </div>
  )
}

export default StudyRoomPage