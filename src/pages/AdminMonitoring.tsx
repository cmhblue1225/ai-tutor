import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { getUploadStatistics, getUploadedFiles, deleteUploadedFile } from '../lib/supabaseAdmin'
import { ITPE_SUBJECTS } from '../lib/ai/hybridRagClient'
import Button from '../components/ui/Button'

interface FileStats {
  totalFiles: number
  totalChunks: number
  processingFiles: number
  completedFiles: number
  errorFiles: number
  subjectBreakdown: { [key: string]: number }
}

interface UploadedFileInfo {
  id: string
  file_name: string
  file_type: string
  file_size: number
  subject_id: string
  status: 'uploading' | 'processing' | 'completed' | 'error'
  error_message?: string
  uploaded_at: string
  processed_at?: string
}

const AdminMonitoring: React.FC = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()

  const [stats, setStats] = useState<FileStats>({
    totalFiles: 0,
    totalChunks: 0,
    processingFiles: 0,
    completedFiles: 0,
    errorFiles: 0,
    subjectBreakdown: {}
  })

  const [files, setFiles] = useState<UploadedFileInfo[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // 통계 및 파일 목록 로드
  const loadData = async () => {
    try {
      setIsLoading(true)

      const [statsData, filesData] = await Promise.all([
        getUploadStatistics(),
        getUploadedFiles(
          selectedSubject === 'all' ? undefined : selectedSubject,
          selectedStatus === 'all' ? undefined : (selectedStatus as any)
        )
      ])

      setStats(statsData)
      setFiles(filesData)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('데이터 로드 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedSubject, selectedStatus])

  // 자동 새로고침 (30초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      loadData()
    }, 30000)

    return () => clearInterval(interval)
  }, [selectedSubject, selectedStatus])

  const handleSignOut = async () => {
    await signOut()
  }

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`"${fileName}" 파일을 삭제하시겠습니까? 관련된 모든 청크 데이터도 함께 삭제됩니다.`)) {
      return
    }

    try {
      await deleteUploadedFile(fileId)
      await loadData() // 데이터 새로고침
    } catch (error) {
      console.error('파일 삭제 오류:', error)
      alert('파일 삭제 중 오류가 발생했습니다.')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'processing': return 'text-blue-600 bg-blue-100'
      case 'uploading': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'completed': return '완료'
      case 'processing': return '처리중'
      case 'uploading': return '업로드중'
      case 'error': return '오류'
      default: return '알 수 없음'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* 헤더 */}
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
                <h1 className="text-xl font-bold text-gray-900">시스템 모니터링</h1>
                <p className="text-sm text-gray-600">파일 업로드 및 임베딩 현황</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                마지막 업데이트: {formatDate(lastUpdated.toISOString())}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadData}
                disabled={isLoading}
                className="hover:bg-gray-100"
              >
                {isLoading ? '새로고침 중...' : '새로고침'}
              </Button>
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
        <div className="space-y-8">
          {/* 전체 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card-premium p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">전체 파일</h3>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">📁</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalFiles}</div>
            </div>

            <div className="card-premium p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">총 청크 수</h3>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">🧩</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalChunks}</div>
            </div>

            <div className="card-premium p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">처리 완료</h3>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">✅</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.completedFiles}</div>
            </div>

            <div className="card-premium p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">처리 중/오류</h3>
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-bold text-lg">⚠️</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.processingFiles + stats.errorFiles}
              </div>
            </div>
          </div>

          {/* 과목별 통계 */}
          <div className="card-premium p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">과목별 현황</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.subjectBreakdown).map(([subjectId, count]) => (
                <div key={subjectId} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {ITPE_SUBJECTS[subjectId as keyof typeof ITPE_SUBJECTS] || subjectId}
                    </span>
                    <span className="text-lg font-bold text-blue-600">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 필터 및 파일 목록 */}
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">파일 목록</h2>

              <div className="flex gap-3">
                {/* 과목 필터 */}
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">모든 과목</option>
                  {Object.entries(ITPE_SUBJECTS).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>

                {/* 상태 필터 */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">모든 상태</option>
                  <option value="completed">완료</option>
                  <option value="processing">처리중</option>
                  <option value="uploading">업로드중</option>
                  <option value="error">오류</option>
                </select>
              </div>
            </div>

            {/* 파일 테이블 */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      파일명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      과목
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      파일 크기
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      업로드일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {files.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {file.file_name}
                        </div>
                        {file.error_message && (
                          <div className="text-xs text-red-600 mt-1">
                            {file.error_message}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {ITPE_SUBJECTS[file.subject_id as keyof typeof ITPE_SUBJECTS] || file.subject_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(file.status)}`}>
                          {getStatusText(file.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatFileSize(file.file_size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(file.uploaded_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteFile(file.id, file.file_name)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {files.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg mb-2">📄</div>
                  <p className="text-gray-500">표시할 파일이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminMonitoring