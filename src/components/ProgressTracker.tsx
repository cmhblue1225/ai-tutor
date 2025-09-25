import React, { useState } from 'react'
import Card from './ui/Card'
import Button from './ui/Button'
import type { StudyRoom } from '../lib/studyRooms'

interface ProgressTrackerProps {
  roomId: string
  room: StudyRoom
}

interface StudySession {
  id: string
  date: string
  duration: number // minutes
  topics: string[]
  notes: string
}

interface WeeklyProgress {
  week: string
  studyDays: number
  totalHours: number
  completedTopics: number
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ roomId, room }) => {
  const [activeView, setActiveView] = useState<'overview' | 'sessions' | 'analytics'>('overview')

  // 목업 데이터 없이 기본 구조만 제공
  const recentSessions: StudySession[] = []
  const weeklyProgress: WeeklyProgress[] = []

  const getProgressPercentage = () => {
    // 실제 구현에서는 데이터베이스에서 계산
    return 0
  }

  const getTotalStudyHours = () => {
    return 0
  }

  const getCurrentStreak = () => {
    return 0
  }

  const views = [
    { id: 'overview', name: '전체 현황', icon: '📊' },
    { id: 'sessions', name: '학습 기록', icon: '📝' },
    { id: 'analytics', name: '상세 분석', icon: '📈' }
  ]

  return (
    <div className="space-y-6">
      {/* 뷰 선택 탭 */}
      <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeView === view.id
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{view.icon}</span>
            <span className="font-medium">{view.name}</span>
          </button>
        ))}
      </div>

      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* 핵심 통계 카드 */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card-premium p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">전체 진도</h3>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {getProgressPercentage()}%
                </div>
                <div className="text-sm text-gray-600">
                  {room.goal_type === 'certification' ? '시험 준비 완료도' : '학습 목표 달성률'}
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>

              <div className="text-xs text-gray-500">
                목표: {room.goal}
              </div>
            </div>

            <div className="card-premium p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">총 학습 시간</h3>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="text-3xl font-bold text-gray-900 mb-1">
                {getTotalStudyHours()}시간
              </div>
              <div className="text-sm text-gray-600 mb-4">
                이번 주 +0시간
              </div>

              <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                꾸준한 학습을 시작해보세요!
              </div>
            </div>

            <div className="card-premium p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">연속 학습일</h3>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  </svg>
                </div>
              </div>

              <div className="text-3xl font-bold text-gray-900 mb-1">
                {getCurrentStreak()}일
              </div>
              <div className="text-sm text-gray-600 mb-4">
                최고 기록: 0일
              </div>

              <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full w-fit">
                오늘부터 연속 학습을 시작하세요!
              </div>
            </div>
          </div>

          {/* 학습 목표 카드 */}
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">현재 학습 목표</h3>
              <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                목표 수정
              </Button>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl">
                  {room.goal_type === 'certification' ? '🏆' : '🎨'}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{room.goal}</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">분야:</span>
                      <span>{room.category} - {room.subject}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">유형:</span>
                      <span>{room.goal_type === 'certification' ? '자격증 취득' : '스킬 향상'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 빈 상태 메시지 */}
          <div className="card-premium text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 gradient-primary rounded-3xl flex items-center justify-center text-white text-3xl">
              📚
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">학습을 시작해보세요!</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              AI 튜터와 대화하며 학습하면 자동으로 진도가 기록됩니다.<br />
              첫 번째 질문을 해보세요!
            </p>
            <Button
              variant="primary"
              className="gradient-primary text-white shadow-colored hover:shadow-lg transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            AI 튜터와 대화하기
            </Button>
          </div>
        </div>
      )}

      {activeView === 'sessions' && (
        <div className="card-premium p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">학습 기록</h3>

          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-400 text-3xl">
              📝
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">아직 학습 기록이 없습니다</h4>
            <p className="text-gray-600">
              학습을 시작하면 여기에 세션별 기록이 표시됩니다.
            </p>
          </div>
        </div>
      )}

      {activeView === 'analytics' && (
        <div className="space-y-6">
          <div className="card-premium p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">상세 분석</h3>

            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-400 text-3xl">
                📈
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">분석 데이터 준비 중</h4>
              <p className="text-gray-600">
                충분한 학습 데이터가 쌓이면 상세한 분석 정보를 제공합니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgressTracker