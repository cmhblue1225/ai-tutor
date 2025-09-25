import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import Button from '../components/ui/Button'

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()

  const handleSignOut = async () => {
    await signOut()
  }

  const handleFileUpload = () => {
    navigate('/admin/upload')
  }

  const handleMonitoring = () => {
    navigate('/admin/monitoring')
  }

  const handleExamSchedule = () => {
    navigate('/admin/exam-schedule')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">관리자 대시보드</h1>
                <p className="text-sm text-gray-600">정보처리기사 학습 시스템 관리</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                관리자: {user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="hover:bg-gray-100"
              >
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 시스템 상태 카드 */}
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">시스템 현황</h2>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">활성 사용자</span>
                <span className="font-semibold">-</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">임베딩 상태</span>
                <span className="font-semibold text-green-600">준비됨</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">파일 업로드</span>
                <span className="font-semibold">0개</span>
              </div>
            </div>
          </div>

          {/* 과목 관리 카드 */}
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">과목 관리</h2>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">정보처리기사 카테고리</div>
              <div className="grid grid-cols-1 gap-1">
                {[
                  '🎨 소프트웨어 설계',
                  '💻 소프트웨어 개발',
                  '🗄️ 데이터베이스 구축',
                  '⚡ 프로그래밍 언어 활용',
                  '🏗️ 정보시스템 구축관리',
                  '📝 기출문제',
                  '📈 출제동향',
                  '📋 시험정보',
                  '💡 학습꿀팁',
                  '📊 모의고사',
                  '📚 요약정리'
                ].map((subject) => (
                  <div key={subject} className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {subject}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 최근 활동 카드 */}
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">최근 활동</h2>
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              아직 활동이 없습니다.
            </div>
          </div>
        </div>

        {/* 빠른 작업 버튼들 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            className="h-20 flex-col gradient-primary text-white"
            onClick={handleFileUpload}
          >
            <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            파일 업로드
          </Button>

          <Button
            variant="secondary"
            className="h-20 flex-col"
            onClick={handleMonitoring}
          >
            <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            임베딩 모니터링
          </Button>

          <Button
            variant="secondary"
            className="h-20 flex-col"
            onClick={handleExamSchedule}
          >
            <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-4h8m-4-6v6" />
            </svg>
            시험 일정 관리
          </Button>

          <Button variant="secondary" className="h-20 flex-col">
            <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            검색 테스트
          </Button>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard