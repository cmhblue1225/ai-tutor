import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import FileUpload, { type UploadResult } from '../components/FileUpload'
import Button from '../components/ui/Button'

const AdminFileUpload: React.FC = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const [selectedSubject, setSelectedSubject] = useState<string>('software_design')
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const subjects = [
    // 정보처리기사 5과목
    { id: 'software_design', name: '소프트웨어 설계', icon: '🎨' },
    { id: 'software_development', name: '소프트웨어 개발', icon: '💻' },
    { id: 'database_construction', name: '데이터베이스 구축', icon: '🗄️' },
    { id: 'programming_language', name: '프로그래밍 언어 활용', icon: '⚡' },
    { id: 'information_system', name: '정보시스템 구축관리', icon: '🏗️' },
    // 기타 학습 자료 카테고리
    { id: 'exam_questions', name: '기출문제', icon: '📝' },
    { id: 'exam_trends', name: '출제동향', icon: '📈' },
    { id: 'exam_info', name: '시험정보', icon: '📋' },
    { id: 'study_tips', name: '학습꿀팁', icon: '💡' },
    { id: 'mock_tests', name: '모의고사', icon: '📊' },
    { id: 'summary_notes', name: '요약정리', icon: '📚' }
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  const handleUploadComplete = (result: UploadResult) => {
    setUploadResults(prev => [result, ...prev])
    setIsUploading(false)
  }

  const handleUploadProgress = (progress: number) => {
    setIsUploading(progress < 100)
  }

  const clearResults = () => {
    setUploadResults([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg hover:shadow-lg transition-shadow"
              >
                ←
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">파일 업로드 관리</h1>
                <p className="text-sm text-gray-600">정보처리기사 학습자료 업로드</p>
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

      <main className="container-custom py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="card-premium p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">업로드할 과목 선택</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => setSelectedSubject(subject.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                    selectedSubject === subject.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{subject.icon}</span>
                    <div>
                      <p className={`font-medium ${
                        selectedSubject === subject.id ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {subject.name}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                파일 업로드: {subjects.find(s => s.id === selectedSubject)?.name}
              </h2>

              {uploadResults.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearResults}
                  className="text-gray-600 hover:text-gray-800"
                >
                  결과 지우기
                </Button>
              )}
            </div>

            <FileUpload
              subjectId={selectedSubject}
              onUploadComplete={handleUploadComplete}
              onUploadProgress={handleUploadProgress}
            />
          </div>

          {uploadResults.length > 0 && (
            <div className="card-premium p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">업로드 결과</h2>

              <div className="space-y-3">
                {uploadResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.success
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {result.success ? '✅' : '❌'}
                      </span>
                      <div className="flex-1">
                        {result.success ? (
                          <div>
                            <p className="font-medium text-green-900">
                              {result.fileName} 업로드 성공
                            </p>
                            <p className="text-sm text-green-700">
                              {result.chunksCount}개의 텍스트 청크로 분할되었습니다.
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium text-red-900">업로드 실패</p>
                            <p className="text-sm text-red-700">{result.error}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card-premium p-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">📚 업로드 가이드</h3>

            <div className="space-y-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">지원하는 파일 형식:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>PDF</strong>: 교재, 기출문제집, 학습자료</li>
                  <li><strong>TXT</strong>: 텍스트 형태의 학습 내용</li>
                  <li><strong>MD</strong>: 마크다운 형태의 정리본</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">카테고리별 활용:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>5과목</strong>: 각 과목별 교재 및 학습자료</li>
                  <li><strong>기출문제</strong>: 연도별/회차별 기출문제 모음</li>
                  <li><strong>출제동향</strong>: 최신 출제 경향 분석 자료</li>
                  <li><strong>시험정보</strong>: 시험 제도, 일정, 접수 방법</li>
                  <li><strong>학습꿀팁</strong>: 효과적인 공부법 및 시험 팁</li>
                  <li><strong>모의고사</strong>: 실전 연습용 모의시험</li>
                  <li><strong>요약정리</strong>: 핵심 내용 정리 노트</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">파일 처리 방식:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>교재</strong>: 2000자 단위로 청킹 (200자 오버랩)</li>
                  <li><strong>기출문제</strong>: 문제별로 자동 분할</li>
                  <li><strong>연도/회차</strong>: 파일명 또는 내용에서 자동 인식</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">권장사항:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>파일명에 연도/회차 정보 포함 (예: 2024년_1회_기출문제.pdf)</li>
                  <li>카테고리에 맞는 적절한 분류로 업로드</li>
                  <li>최대 20MB 이하의 파일 업로드</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminFileUpload