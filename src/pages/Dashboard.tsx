import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import StudyRoomCard from '../components/StudyRoomCard'
import CreateStudyRoomModal from '../components/CreateStudyRoomModal'
import PremiumStatsCard from '../components/PremiumStatsCard'
import PremiumHeader from '../components/PremiumHeader'
import { getStudyRooms, createStudyRoom, deleteStudyRoom, type StudyRoom, type CreateStudyRoomData } from '../lib/studyRooms'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuthStore()
  const [studyRooms, setStudyRooms] = useState<StudyRoom[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  // 스터디 룸 목록 로드
  useEffect(() => {
    if (user?.id) {
      loadStudyRooms()
    }
  }, [user?.id])

  const loadStudyRooms = async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      const rooms = await getStudyRooms(user.id)
      setStudyRooms(rooms)
    } catch (error) {
      console.error('Failed to load study rooms:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleCreateStudyRoom = async (roomData: CreateStudyRoomData & { category: string, goal_type: 'certification' | 'skill_improvement' }) => {
    if (!user?.id) return

    try {
      setIsCreating(true)
      // goal_type과 category를 포함한 확장된 룸 데이터로 생성
      const extendedRoomData = {
        name: roomData.name,
        description: roomData.description,
        goal: roomData.goal,
        subject: roomData.subject,
        category: roomData.category,
        goal_type: roomData.goal_type
      }

      const newRoom = await createStudyRoom(user.id, extendedRoomData)
      setStudyRooms(prev => [newRoom, ...prev])
      setIsCreateModalOpen(false)
    } catch (error) {
      console.error('Failed to create study room:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteStudyRoom = async (roomId: string) => {
    if (!confirm('정말로 이 스터디 룸을 삭제하시겠습니까?')) return

    try {
      await deleteStudyRoom(roomId)
      setStudyRooms(prev => prev.filter(room => room.id !== roomId))
    } catch (error) {
      console.error('Failed to delete study room:', error)
    }
  }

  const handleEnterRoom = (roomId: string) => {
    navigate(`/room/${roomId}`)
  }

  const handleEditRoom = (roomId: string) => {
    // TODO: 스터디 룸 편집 모달 열기
    console.log('Editing room:', roomId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* 프리미엄 헤더 */}
      <PremiumHeader user={user} profile={profile} onSignOut={handleSignOut} />

      {/* 메인 콘텐츠 */}
      <main className="container-custom py-xl">
        {/* 프리미엄 환영 섹션 */}
        <div className="relative mb-16 overflow-hidden">
          {/* 배경 장식 */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-8 left-8 w-72 h-72 bg-gradient-to-br from-blue-200/30 to-purple-200/20 rounded-full blur-3xl float-animation" />
            <div className="absolute top-16 right-16 w-96 h-96 bg-gradient-to-br from-orange-200/20 to-yellow-200/30 rounded-full blur-3xl float-animation" style={{ animationDelay: '3s' }} />
          </div>

          <div className="card-premium">
            <div className="p-12 text-center relative">
              {/* 장식 패턴 */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 rounded-t-3xl" />

              <div className="mb-8">
                {/* 시간대별 인사 */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full text-blue-700 font-medium mb-6">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {new Date().getHours() < 12 ? '좋은 아침입니다' :
                   new Date().getHours() < 18 ? '안녕하세요' : '수고하셨습니다'}
                </div>

                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent mb-4">
                  {profile?.full_name || '학습자'}님
                </h1>

                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                  오늘도 <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI 튜터</span>와 함께
                  새로운 지식을 탐험하고 목표에 한 걸음 더 가까워져보세요
                </p>
              </div>

              {/* 액션 버튼들 */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="gradient-primary text-white shadow-colored hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  새 스터디 룸 만들기
                </Button>

                <Button
                  variant="ghost"
                  size="lg"
                  className="hover:bg-white/80 transition-all duration-300"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  학습 가이드 보기
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 프리미엄 통계 카드들 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* 총 학습 시간 */}
          <div className="fade-in-up">
            <PremiumStatsCard
              title="총 학습 시간"
              value={`${profile?.stats?.total_study_hours || 0}시간`}
              subtitle="이번 주 +5시간"
              gradient="primary"
              trend={{ value: 12, isPositive: true }}
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              delay={100}
            />
          </div>

          {/* 연속 학습일 */}
          <div className="fade-in-up">
            <PremiumStatsCard
              title="연속 학습일"
              value={`${profile?.stats?.current_streak || 0}일`}
              subtitle="목표: 30일 달성"
              gradient="secondary"
              trend={{ value: 8, isPositive: true }}
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              }
              delay={200}
            />
          </div>

          {/* 획득 포인트 */}
          <div className="fade-in-up">
            <PremiumStatsCard
              title="획득 포인트"
              value={`${profile?.stats?.total_points || 0}P`}
              subtitle={`레벨 ${profile?.stats?.level || 1} • 다음 레벨까지 150P`}
              gradient="success"
              trend={{ value: 25, isPositive: true }}
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              }
              delay={300}
            />
          </div>
        </div>

        {/* 내 스터디 룸 */}
        <div className="mb-16">
          {/* 섹션 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">내 스터디 룸</h2>
              <p className="text-gray-600">개인 맞춤형 AI 학습 공간에서 효율적으로 학습하세요</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="gradient-primary text-white hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              새로 만들기
            </Button>
          </div>

          {isLoading ? (
            <div className="card-premium text-center py-16">
              <div className="w-16 h-16 mx-auto mb-6">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center">
                  <div className="loading-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">스터디 룸을 불러오는 중...</h3>
              <p className="text-gray-600">잠시만 기다려주세요</p>
            </div>
          ) : studyRooms.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {studyRooms.map((room, index) => (
                <div
                  key={room.id}
                  className="fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <StudyRoomCard
                    room={room}
                    onEnter={handleEnterRoom}
                    onEdit={handleEditRoom}
                    onDelete={handleDeleteStudyRoom}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="card-premium text-center py-16 fade-in-up relative overflow-hidden">
              {/* 배경 장식 */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-orange-100/30 to-yellow-100/30 rounded-full translate-y-12 -translate-x-12" />

              <div className="relative z-10">
                <div className="w-20 h-20 mx-auto mb-6 gradient-primary rounded-3xl flex items-center justify-center shadow-colored">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">새로운 학습 여정을 시작하세요</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  AI 튜터와 함께하는 개인 맞춤형 스터디 룸에서<br />
                  효율적이고 즐거운 학습을 경험해보세요
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="gradient-primary text-white shadow-colored hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    첫 번째 스터디 룸 만들기
                  </Button>

                  <Button
                    variant="ghost"
                    size="lg"
                    className="hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    데모 보기
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 스터디 룸 생성 모달 */}
      <CreateStudyRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateStudyRoom}
        isLoading={isCreating}
      />
    </div>
  )
}

export default Dashboard