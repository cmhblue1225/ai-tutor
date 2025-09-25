import React, { useState, useEffect } from 'react'
import { VectorSearchEngine } from '../lib/ai/vectorSearch'
import { RAGSystem } from '../lib/ai/ragSystem'
import Button from './ui/Button'
import Card from './ui/Card'

interface RAGManagerProps {
  onClose: () => void
}

const RAGManager: React.FC<RAGManagerProps> = ({ onClose }) => {
  const [status, setStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<{ success: number; failed: number; total: number }>({
    success: 0,
    failed: 0,
    total: 0
  })
  const [testQuery, setTestQuery] = useState('')
  const [testResult, setTestResult] = useState<any>(null)

  // 초기 상태 로드
  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      setIsLoading(true)
      const systemStatus = await RAGSystem.getSystemStatus()
      setStatus(systemStatus)
    } catch (error) {
      console.error('상태 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 모든 임베딩 생성
  const generateAllEmbeddings = async () => {
    try {
      setIsLoading(true)
      setProgress({ success: 0, failed: 0, total: 0 })

      console.log('전체 임베딩 생성 시작')

      // 전체 청크 수 조회
      const embeddingStatus = await VectorSearchEngine.getEmbeddingStatus()
      setProgress(prev => ({ ...prev, total: embeddingStatus.total_chunks }))

      // 임베딩 생성 시작
      const result = await VectorSearchEngine.createAllEmbeddings()

      setProgress({
        success: result.success,
        failed: result.failed,
        total: result.success + result.failed
      })

      // 상태 업데이트
      await loadStatus()

      alert(`임베딩 생성 완료!\n성공: ${result.success}개\n실패: ${result.failed}개`)

    } catch (error) {
      console.error('임베딩 생성 실패:', error)
      alert('임베딩 생성 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 테스트 검색 수행
  const runTestSearch = async () => {
    if (!testQuery.trim()) return

    try {
      setIsLoading(true)
      setTestResult(null)

      const searchResults = await VectorSearchEngine.searchSimilar(testQuery, {
        limit: 5,
        similarityThreshold: 0.5,
        includeMetadata: true
      })

      setTestResult({
        query: testQuery,
        results: searchResults,
        count: searchResults.length
      })

    } catch (error) {
      console.error('테스트 검색 실패:', error)
      setTestResult({
        query: testQuery,
        results: [],
        count: 0,
        error: error instanceof Error ? error.message : '검색 실패'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">RAG 시스템 관리</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 시스템 상태 */}
          <Card className="mb-6">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">시스템 상태</h3>

              {isLoading && !status ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mr-3" />
                  <span>상태 확인 중...</span>
                </div>
              ) : status ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold mb-1 ${status.isReady ? 'text-green-600' : 'text-red-600'}`}>
                        {status.isReady ? '✓' : '✗'}
                      </div>
                      <div className="text-sm text-gray-600">시스템 준비</div>
                    </div>

                    {status.embeddingStatus && (
                      <>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600 mb-1">
                            {status.embeddingStatus.total_chunks}
                          </div>
                          <div className="text-sm text-gray-600">전체 청크</div>
                        </div>

                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 mb-1">
                            {status.embeddingStatus.embedded_chunks}
                          </div>
                          <div className="text-sm text-gray-600">임베딩 완료</div>
                        </div>

                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600 mb-1">
                            {status.embeddingStatus.missing_embeddings.length}
                          </div>
                          <div className="text-sm text-gray-600">누락 임베딩</div>
                        </div>
                      </>
                    )}
                  </div>

                  {status.recommendations.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <h4 className="font-medium text-yellow-800 mb-2">권장 사항</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {status.recommendations.map((rec: string, index: number) => (
                          <li key={index}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-red-600">
                  상태를 불러올 수 없습니다.
                </div>
              )}
            </div>
          </Card>

          {/* 임베딩 생성 */}
          <Card className="mb-6">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">임베딩 관리</h3>

              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-600">
                  지식 베이스의 모든 청크에 대해 벡터 임베딩을 생성합니다.
                </p>
                <Button
                  onClick={generateAllEmbeddings}
                  disabled={isLoading}
                  className="gradient-primary text-white"
                >
                  {isLoading ? '생성 중...' : '임베딩 생성'}
                </Button>
              </div>

              {progress.total > 0 && (
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>진행률</span>
                    <span>{Math.round(((progress.success + progress.failed) / progress.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((progress.success + progress.failed) / progress.total) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>성공: {progress.success}</span>
                    <span>실패: {progress.failed}</span>
                    <span>전체: {progress.total}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* 테스트 검색 */}
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">벡터 검색 테스트</h3>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  placeholder="테스트할 검색어를 입력하세요..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && runTestSearch()}
                />
                <Button
                  onClick={runTestSearch}
                  disabled={isLoading || !testQuery.trim()}
                  className="bg-blue-600 text-white"
                >
                  검색
                </Button>
              </div>

              {testResult && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-900">검색 결과</h4>
                    <span className="text-sm text-gray-600">
                      {testResult.count}개 결과
                    </span>
                  </div>

                  {testResult.error ? (
                    <div className="text-red-600 text-sm">
                      오류: {testResult.error}
                    </div>
                  ) : testResult.results.length > 0 ? (
                    <div className="space-y-3">
                      {testResult.results.map((result: any, index: number) => (
                        <div key={result.chunk_id} className="bg-white rounded border p-3">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-gray-900 text-sm">
                              {result.title}
                            </h5>
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              {Math.round(result.similarity_score * 100)}% 유사
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {result.content.substring(0, 150)}...
                          </p>
                          <div className="text-xs text-gray-500">
                            {result.subject} | {result.category}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-4">
                      검색 결과가 없습니다.
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default RAGManager