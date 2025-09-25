import React, { useState, useEffect } from 'react'
import Card from './ui/Card'
import Button from './ui/Button'
import type { StudyRoom } from '../lib/studyRooms'
import { MaterialRecommendationEngine, type StudyMaterial, type MaterialCategory } from '../lib/ai/materialRecommendations'
import { useProgressData } from '../hooks/useProgressData'
import { materialCache } from '../lib/ai/materialCache'

interface StudyMaterialViewerProps {
  roomId: string
  room: StudyRoom
}

const StudyMaterialViewer: React.FC<StudyMaterialViewerProps> = ({ roomId, room }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('concepts')
  const [materials, setMaterials] = useState<MaterialCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastProgressSnapshot, setLastProgressSnapshot] = useState<number>(0)

  // 진도 데이터 로드
  const { roadmap, goal, stats } = useProgressData(roomId)

  // AI 자료 추천 엔진 초기화
  useEffect(() => {
    const loadMaterials = async () => {
      if (!room) return

      console.log('AI 학습 자료 로딩 시작:', {
        roomId,
        subject: room.subject,
        goalType: room.goal_type,
        currentStep: roadmap?.completed_steps || 0
      })

      try {
        setIsLoading(true)
        setError(null)

        // 현재 학습 단계와 수준 결정
        const currentStep = roadmap?.completed_steps || 0
        const userLevel = stats.totalProgress < 30 ? 'beginner' :
                         stats.totalProgress < 70 ? 'intermediate' : 'advanced'

        console.log('자료 생성 파라미터:', { currentStep, userLevel, totalProgress: stats.totalProgress })

        // 진도 변화 감지 및 캐시 무효화
        if (lastProgressSnapshot > 0 && Math.abs(stats.totalProgress - lastProgressSnapshot) >= 25) {
          console.log('🔄 진도 수준 변경 감지 - 캐시 무효화')
          materialCache.invalidateProgressLevel(roomId, lastProgressSnapshot, stats.totalProgress)
        }

        // AI 자료 추천 엔진으로 자료 생성 (캐싱 포함)
        const engine = new MaterialRecommendationEngine(room, currentStep, userLevel, stats.totalProgress)
        const generatedMaterials = await engine.generateIntelligentMaterials()

        // 진도 스냅샷 업데이트
        setLastProgressSnapshot(stats.totalProgress)

        console.log('생성된 학습 자료:', generatedMaterials)
        setMaterials(generatedMaterials)

        // 첫 번째 카테고리를 기본 선택으로 설정
        if (generatedMaterials.length > 0) {
          setSelectedCategory(generatedMaterials[0].id)
        }
      } catch (error) {
        console.error('자료 로딩 실패:', error)
        setError('학습 자료를 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadMaterials()
  }, [room, roomId, roadmap?.completed_steps, stats.totalProgress])

  const selectedCategoryData = materials.find(cat => cat.id === selectedCategory)

  // 학습 자료 카드 렌더링
  const renderMaterialCard = (material: StudyMaterial) => {
    const getDifficultyColor = (difficulty: string) => {
      switch (difficulty) {
        case 'beginner': return 'bg-green-100 text-green-800 border-green-200'
        case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        case 'advanced': return 'bg-red-100 text-red-800 border-red-200'
        default: return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }

    const getDifficultyText = (difficulty: string) => {
      switch (difficulty) {
        case 'beginner': return '초급'
        case 'intermediate': return '중급'
        case 'advanced': return '고급'
        default: return '기본'
      }
    }

    return (
      <Card key={material.id} className="p-6 hover:shadow-lg transition-shadow duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h5 className="font-semibold text-gray-900 text-lg mb-2">{material.title}</h5>
            <p className="text-gray-600 text-sm mb-3">{material.description}</p>
          </div>
          <div className="ml-4 flex flex-col items-end gap-2">
            <span className={`px-2 py-1 rounded-full text-xs border ${getDifficultyColor(material.difficulty)}`}>
              {getDifficultyText(material.difficulty)}
            </span>
            <span className="text-xs text-gray-500 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {material.estimatedTime}분
            </span>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-gray-700 text-sm leading-relaxed">{material.content}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {material.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                #{tag}
              </span>
            ))}
            {material.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded-full text-xs">
                +{material.tags.length - 3}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              자세히
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="gradient-primary text-white shadow-colored"
            >
              학습하기
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  // 로딩 상태 렌더링
  const renderLoadingState = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6">
          <div className="animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded-md w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
              </div>
              <div className="ml-4 space-y-2">
                <div className="h-6 bg-gray-200 rounded-full w-12"></div>
                <div className="h-4 bg-gray-200 rounded-md w-16"></div>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-200 rounded-md w-full"></div>
              <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <div className="h-6 bg-gray-200 rounded-full w-12"></div>
                <div className="h-6 bg-gray-200 rounded-full w-12"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded-md w-16"></div>
                <div className="h-8 bg-gray-200 rounded-md w-20"></div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )

  // 에러 상태 렌더링
  const renderErrorState = () => (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-3xl flex items-center justify-center text-4xl">
        ⚠️
      </div>
      <h4 className="text-lg font-semibold text-gray-900 mb-3">
        자료 로드 실패
      </h4>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {error}
      </p>
      <Button
        variant="primary"
        onClick={() => window.location.reload()}
        className="gradient-primary text-white shadow-colored hover:shadow-lg transition-all duration-300"
      >
        다시 시도
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* 카테고리 선택 */}
      <div className="card-premium p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">학습 자료</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading ? (
            // 로딩 상태의 카테고리 버튼들
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-xl border-2 border-gray-200 animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="w-6 h-4 bg-gray-200 rounded-full"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))
          ) : (
            materials.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  selectedCategory === category.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{category.icon}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedCategory === category.id
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {category.materials.length}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1">{category.name}</h4>
                <p className="text-xs text-gray-600 leading-tight">{category.description}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 선택된 카테고리 콘텐츠 */}
      <div className="card-premium p-6">
        {!isLoading && selectedCategoryData && (
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-xl">{selectedCategoryData?.icon}</span>
                {selectedCategoryData?.name}
              </h4>
              <p className="text-sm text-gray-600 mt-1">{selectedCategoryData?.description}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                총 {selectedCategoryData.materials.length}개 자료
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-gray-100"
                onClick={() => {
                  console.log('🗑️ 수동 캐시 클리어 및 자료 새로고침')
                  materialCache.invalidateRoom(roomId)
                  setIsLoading(true)
                  setMaterials([])
                  // useEffect가 자동으로 다시 실행됨
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                새로고침
              </Button>
            </div>
          </div>
        )}

        {/* 콘텐츠 렌더링 */}
        {isLoading ? (
          renderLoadingState()
        ) : error ? (
          renderErrorState()
        ) : selectedCategoryData && selectedCategoryData.materials.length > 0 ? (
          <div className="space-y-4">
            {selectedCategoryData.materials.map((material) => renderMaterialCard(material))}
          </div>
        ) : selectedCategoryData ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-3xl flex items-center justify-center text-4xl">
              {selectedCategoryData.icon}
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              {selectedCategoryData.name} 자료 생성 중
            </h4>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              AI가 {room.subject} 분야의 맞춤형 {selectedCategoryData.description.toLowerCase()}을 생성하고 있습니다.
            </p>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-3xl flex items-center justify-center text-4xl">
              📚
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              자료를 선택해주세요
            </h4>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              위 카테고리 중 하나를 선택하여 AI 생성 학습 자료를 확인하세요.
            </p>
          </div>
        )}
      </div>

      {/* AI 튜터 추천 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl">
            🤖
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-2">AI 튜터 추천</h4>
            <p className="text-sm text-gray-600 mb-4">
              {room.subject} 학습을 위한 맞춤형 자료를 AI 튜터가 추천해드립니다.
              구체적인 주제나 궁금한 점을 말씀해 주세요!
            </p>
            <div className="flex flex-wrap gap-2">
              {room.goal_type === 'certification' ? (
                <>
                  <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-600">시험 범위 안내</span>
                  <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-600">출제 경향 분석</span>
                  <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-600">취약점 진단</span>
                </>
              ) : (
                <>
                  <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-600">기초 가이드</span>
                  <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-600">실습 예제</span>
                  <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-600">심화 학습</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudyMaterialViewer