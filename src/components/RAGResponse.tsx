import React, { useState } from 'react'
import type { RAGResponse } from '../lib/ai/ragSystem'
import Card from './ui/Card'

interface RAGResponseProps {
  response: RAGResponse
  onSourceClick?: (chunkId: string) => void
}

const RAGResponse: React.FC<RAGResponseProps> = ({ response, onSourceClick }) => {
  const [showSources, setShowSources] = useState(false)
  const [showContext, setShowContext] = useState(false)

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getResponseTypeIcon = (type: RAGResponse['responseType']) => {
    switch (type) {
      case 'direct':
        return '🎯'
      case 'contextual':
        return '🔍'
      case 'general':
        return '💭'
      default:
        return '❓'
    }
  }

  const getResponseTypeText = (type: RAGResponse['responseType']) => {
    switch (type) {
      case 'direct':
        return '직접 답변'
      case 'contextual':
        return '관련 자료 기반'
      case 'general':
        return '일반 지식 기반'
      default:
        return '알 수 없음'
    }
  }

  return (
    <div className="space-y-4">
      {/* 메인 답변 */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="prose prose-blue max-w-none">
          {response.answer.split('\n').map((line, index) => (
            <p key={index} className="text-gray-800 leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      </div>

      {/* 메타 정보 */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            {getResponseTypeIcon(response.responseType)}
            <span className="text-gray-600">{getResponseTypeText(response.responseType)}</span>
          </span>

          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getConfidenceColor(response.confidence)}`}>
            신뢰도 {Math.round(response.confidence * 100)}%
          </span>

          {response.sources.length > 0 && (
            <span className="text-gray-500">
              {response.sources.length}개 참조 자료
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {response.sources.length > 0 && (
            <button
              onClick={() => setShowSources(!showSources)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showSources ? '참조 숨기기' : '참조 보기'}
            </button>
          )}

          {response.context && (
            <button
              onClick={() => setShowContext(!showContext)}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              세부정보
            </button>
          )}
        </div>
      </div>

      {/* 참조 자료 */}
      {showSources && response.sources.length > 0 && (
        <Card className="bg-gray-50">
          <div className="p-4">
            <h4 className="font-semibold text-gray-900 mb-3">참조 자료</h4>
            <div className="space-y-3">
              {response.sources.map((source, index) => (
                <div
                  key={source.chunk_id}
                  className={`p-3 bg-white rounded border hover:bg-gray-50 transition-colors ${
                    onSourceClick ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => onSourceClick?.(source.chunk_id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-gray-900 text-sm">
                      [{index + 1}] {source.title}
                    </h5>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>유사도 {Math.round(source.similarity_score * 100)}%</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {source.subject}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed">
                    {source.content.substring(0, 200)}
                    {source.content.length > 200 && '...'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* 컨텍스트 정보 */}
      {showContext && response.context && (
        <Card className="bg-gray-50">
          <div className="p-4">
            <h4 className="font-semibold text-gray-900 mb-3">검색 세부정보</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">검색 쿼리:</span>
                <p className="font-medium text-gray-900">{response.context.query}</p>
              </div>
              <div>
                <span className="text-gray-600">검색된 청크 수:</span>
                <p className="font-medium text-gray-900">{response.context.retrievedChunks.length}개</p>
              </div>
              <div>
                <span className="text-gray-600">평균 유사도:</span>
                <p className="font-medium text-gray-900">
                  {response.context.retrievedChunks.length > 0
                    ? Math.round((response.context.totalSimilarityScore / response.context.retrievedChunks.length) * 100)
                    : 0}%
                </p>
              </div>
              <div>
                <span className="text-gray-600">검색 옵션:</span>
                <p className="font-medium text-gray-900">
                  {response.context.searchOptions.subject} | 임계값 {Math.round(response.context.searchOptions.threshold * 100)}%
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default RAGResponse