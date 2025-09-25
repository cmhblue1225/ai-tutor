import React, { useState, useEffect } from 'react'
import { materialCache } from '../lib/ai/materialCache'
import Button from './ui/Button'

// 개발 환경에서만 표시되는 캐시 디버그 패널
const CacheDebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [stats, setStats] = useState<any>({ size: 0, entries: [] })

  // 개발 환경에서만 렌더링
  if (import.meta.env.PROD) {
    return null
  }

  const refreshStats = () => {
    setStats(materialCache.getStats())
  }

  useEffect(() => {
    if (isVisible) {
      refreshStats()
      const interval = setInterval(refreshStats, 1000) // 1초마다 업데이트
      return () => clearInterval(interval)
    }
  }, [isVisible])

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-gray-800 text-white hover:bg-gray-700 text-xs"
        >
          캐시 상태
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">캐시 디버그 패널</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">캐시 크기:</span>
          <span className="font-mono font-bold">{stats.size}/50</span>
        </div>

        {stats.entries.length > 0 && (
          <div>
            <span className="text-gray-600 block mb-2">캐시 엔트리:</span>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {stats.entries.map((entry: any, index: number) => (
                <div key={index} className="bg-gray-50 rounded p-2">
                  <div className="text-gray-800 font-mono text-xs truncate">
                    {entry.key.split('_').slice(0, 3).join('_')}...
                  </div>
                  <div className="text-gray-500 text-xs mt-1">
                    생성: {entry.createdAt}
                  </div>
                  <div className="text-gray-500 text-xs">
                    만료: {entry.expiresAt}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshStats}
            className="text-xs"
          >
            새로고침
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              materialCache.clear()
              refreshStats()
            }}
            className="text-xs text-red-600 hover:text-red-700"
          >
            캐시 클리어
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CacheDebugPanel