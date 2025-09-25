import React, { useState } from 'react'
import Card from './ui/Card'
import Button from './ui/Button'
import type { StudyRoom } from '../lib/studyRooms'

interface StudyMaterialViewerProps {
  roomId: string
  room: StudyRoom
}

interface MaterialCategory {
  id: string
  name: string
  icon: string
  description: string
  count: number
}

const StudyMaterialViewer: React.FC<StudyMaterialViewerProps> = ({ roomId, room }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('concepts')

  // 분야별 학습 자료 카테고리 (목업 없이 구조만)
  const getCategories = (): MaterialCategory[] => {
    const baseCategories = [
      {
        id: 'concepts',
        name: '핵심 개념',
        icon: '💡',
        description: '기본 이론과 핵심 개념 설명',
        count: 0
      },
      {
        id: 'practice',
        name: '연습 문제',
        icon: '✏️',
        description: '실력 향상을 위한 연습 문제',
        count: 0
      }
    ]

    if (room.goal_type === 'certification') {
      return [
        ...baseCategories,
        {
          id: 'exams',
          name: '기출 문제',
          icon: '📝',
          description: '실제 시험 기출 문제',
          count: 0
        },
        {
          id: 'tips',
          name: '시험 팁',
          icon: '🎯',
          description: '합격을 위한 실전 팁',
          count: 0
        }
      ]
    } else {
      return [
        ...baseCategories,
        {
          id: 'tutorials',
          name: '실습 가이드',
          icon: '🛠️',
          description: '단계별 실습 가이드',
          count: 0
        },
        {
          id: 'resources',
          name: '참고 자료',
          icon: '📚',
          description: '추가 학습 참고 자료',
          count: 0
        }
      ]
    }
  }

  const categories = getCategories()
  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory)

  const renderEmptyState = (category: MaterialCategory) => {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-3xl flex items-center justify-center text-4xl">
          {category.icon}
        </div>
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          {category.name} 준비 중
        </h4>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {room.subject} 분야의 {category.description.toLowerCase()}이 곧 추가됩니다.<br />
          지금은 AI 튜터와 대화하며 학습해보세요!
        </p>
        <Button
          variant="primary"
          className="gradient-primary text-white shadow-colored hover:shadow-lg transition-all duration-300"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          AI 튜터에게 질문하기
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 카테고리 선택 */}
      <div className="card-premium p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">학습 자료</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
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
                  {category.count}
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 text-sm mb-1">{category.name}</h4>
              <p className="text-xs text-gray-600 leading-tight">{category.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 선택된 카테고리 콘텐츠 */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-xl">{selectedCategoryData?.icon}</span>
              {selectedCategoryData?.name}
            </h4>
            <p className="text-sm text-gray-600 mt-1">{selectedCategoryData?.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="hover:bg-gray-100">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              필터
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-gray-100">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              검색
            </Button>
          </div>
        </div>

        {selectedCategoryData && renderEmptyState(selectedCategoryData)}
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