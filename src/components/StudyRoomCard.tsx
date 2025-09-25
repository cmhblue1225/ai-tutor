import React from 'react'
import Card from './ui/Card'
import Button from './ui/Button'

interface StudyRoom {
  id: string
  name: string
  description?: string
  goal: string
  subject: string
  category: string
  goal_type: 'certification' | 'skill_improvement'
  status: 'active' | 'completed' | 'archived'
  created_at: string
}

interface StudyRoomCardProps {
  room: StudyRoom
  onEnter: (roomId: string) => void
  onEdit: (roomId: string) => void
  onDelete: (roomId: string) => void
}

const StudyRoomCard: React.FC<StudyRoomCardProps> = ({
  room,
  onEnter,
  onEdit,
  onDelete
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500 bg-green-100'
      case 'completed':
        return 'text-blue-500 bg-blue-100'
      case 'archived':
        return 'text-gray-500 bg-gray-100'
      default:
        return 'text-gray-500 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '진행중'
      case 'completed':
        return '완료'
      case 'archived':
        return '보관됨'
      default:
        return '알수없음'
    }
  }

  const getGoalTypeIcon = (goalType: 'certification' | 'skill_improvement') => {
    return goalType === 'certification' ? '🏆' : '🎨'
  }

  const getGoalTypeColor = (goalType: 'certification' | 'skill_improvement') => {
    return goalType === 'certification'
      ? 'text-orange-600 bg-orange-50 border-orange-200'
      : 'text-purple-600 bg-purple-50 border-purple-200'
  }

  return (
    <div className="card-premium group cursor-pointer relative overflow-hidden">
      {/* 상태별 상단 라인 */}
      <div className={`h-1 ${getStatusColor(room.status).includes('green') ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
        getStatusColor(room.status).includes('blue') ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
        'bg-gradient-to-r from-gray-300 to-gray-400'} rounded-t-3xl`} />

      {/* 배경 패턴 */}
      <div className="absolute top-4 right-4 w-16 h-16 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full rotate-12 group-hover:rotate-45 transition-transform duration-500">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>

      <div className="p-6 space-y-4">
        {/* 헤더 */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 flex-1">
                {room.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(room.status)}`}>
                  {getStatusText(room.status)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-gray-700 font-medium">{room.goal}</p>

              {/* 카테고리와 목표 유형 표시 */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border ${getGoalTypeColor(room.goal_type)}`}>
                  <span>{getGoalTypeIcon(room.goal_type)}</span>
                  {room.goal_type === 'certification' ? '자격증' : '스킬향상'}
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {room.category}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m4 0V9a2 2 0 012-2h2a2 2 0 012 2v12" />
                </svg>
                {room.subject}
              </div>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(room.id)
              }}
              className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
              title="편집"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(room.id)
              }}
              className="p-2 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
              title="삭제"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* 설명 */}
        {room.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{room.description}</p>
        )}

        {/* 하단 정보 및 액션 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(room.created_at).toLocaleDateString('ko-KR')}
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEnter(room.id)
            }}
            disabled={room.status === 'archived'}
            className={`${room.status === 'active' ?
              'gradient-primary text-white shadow-colored hover:shadow-lg' :
              'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } transition-all duration-300 hover:-translate-y-0.5`}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {room.status === 'active' ? '학습 시작' : '보기'}
          </Button>
        </div>

        {/* 진행률 표시 바 */}
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-1000 transform -translate-x-full group-hover:translate-x-0"
            style={{ width: room.status === 'completed' ? '100%' : '60%' }}
          />
        </div>
      </div>

      {/* 호버 글로우 효과 */}
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 blur-xl" />
      </div>
    </div>
  )
}

export default StudyRoomCard