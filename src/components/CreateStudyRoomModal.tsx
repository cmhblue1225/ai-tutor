import React, { useState } from 'react'
import Button from './ui/Button'
import Input from './ui/Input'

interface CreateStudyRoomModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (roomData: {
    name: string
    description: string
    goal: string
    subject: string
    category: string
    goal_type: 'certification' | 'skill_improvement'
  }) => void
  isLoading?: boolean
}

const CreateStudyRoomModal: React.FC<CreateStudyRoomModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goal: '',
    subject: '',
    category: '',
    goal_type: 'certification' as 'certification' | 'skill_improvement'
  })

  const [selectedCategory, setSelectedCategory] = useState('')

  // 분야별 카테고리 구조
  const categories = {
    certification: {
      name: '자격증 취득 분야',
      description: '시험 합격을 목표로 하는 체계적 학습',
      icon: '🏆',
      subcategories: {
        'IT 분야': [
          '정보처리기사', '네트워크관리사', '리눅스마스터', 'SQLD',
          '컴활 1급', '정보보안기사', '전자계산기조직응용기사'
        ],
        '기술 분야': [
          '지게차조종기능사', '용접기능사', '전기기사', '건설기계정비기능사',
          '자동차정비기능사', '산업안전기사', '전산응용건축제도기능사'
        ],
        '서비스 분야': [
          '조리기능사', '제과제빵기능사', '미용사', '바리스타',
          '호텔관리사', '관광통역안내사', '컨벤션기획사'
        ],
        '전문직 분야': [
          '공인중개사', '사회복지사', '관세사', '세무사',
          '행정사', '법무사', '공인노무사'
        ],
        '공무원 시험': [
          '9급 일반직', '7급 일반직', '소방공무원', '경찰공무원',
          '교육공무원', '기술직공무원', '군무원'
        ]
      }
    },
    skill_improvement: {
      name: '취미/스킬 향상 분야',
      description: '실력과 지식 향상을 목표로 하는 자유로운 학습',
      icon: '🎨',
      subcategories: {
        '스포츠': [
          '수영', '클라이밍', '골프', '테니스', '축구',
          '농구', '배드민턴', '탁구', '스키/스노보드'
        ],
        '피트니스': [
          '퍼스널트레이닝', '요가', '필라테스', '크로스핏',
          '홈트레이닝', '다이어트', '보디빌딩', '마라톤'
        ],
        '예술/창작': [
          '그림/드로잉', '음악/악기', '사진', '글쓰기',
          '영상제작', '디자인', '캘리그라피', '도예'
        ],
        '언어학습': [
          '영어', '일본어', '중국어', '스페인어',
          '독일어', '프랑스어', '러시아어', '아랍어'
        ],
        '생활기술': [
          '요리', '투자/재테크', '마케팅', '개발/코딩',
          '사업/창업', '부동산', '심리학', '철학'
        ]
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      goal: '',
      subject: '',
      category: '',
      goal_type: 'certification'
    })
    setSelectedCategory('')
    onClose()
  }

  const handleGoalTypeChange = (goalType: 'certification' | 'skill_improvement') => {
    setFormData({
      ...formData,
      goal_type: goalType,
      category: '',
      subject: '',
      goal: ''
    })
    setSelectedCategory('')
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setFormData({
      ...formData,
      category: category,
      subject: ''
    })
  }

  // 현재 선택된 목표 유형의 카테고리
  const currentCategories = categories[formData.goal_type]

  // 현재 선택된 카테고리의 세부 과목들
  const currentSubjects = selectedCategory
    ? currentCategories.subcategories[selectedCategory] || []
    : []

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card-premium max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">새 학습 공간 만들기</h2>
              <p className="text-gray-600">AI 튜터와 함께할 맞춤형 학습 환경을 설정하세요</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              disabled={isLoading}
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 학습 유형 선택 */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                학습 유형을 선택하세요 *
              </label>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(categories).map(([key, category]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleGoalTypeChange(key as 'certification' | 'skill_improvement')}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                      formData.goal_type === key
                        ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-100'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">{category.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">{category.name}</h3>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 분야 카테고리 선택 */}
            {formData.goal_type && (
              <div className="fade-in-up">
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  분야를 선택하세요 *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.keys(currentCategories.subcategories).map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategoryChange(category)}
                      className={`p-4 rounded-xl border transition-all duration-200 text-sm font-medium ${
                        selectedCategory === category
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 세부 과목 선택 */}
            {selectedCategory && currentSubjects.length > 0 && (
              <div className="fade-in-up">
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  세부 과목을 선택하세요 *
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                  required
                >
                  <option value="">과목을 선택하세요</option>
                  {currentSubjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 스터디 룸 이름 */}
            {formData.subject && (
              <div className="fade-in-up">
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  스터디 룸 이름 *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={formData.goal_type === 'certification'
                    ? `예: ${formData.subject} 2025년 상반기 준비`
                    : `예: ${formData.subject} 마스터하기`
                  }
                  className="text-lg"
                  required
                />
              </div>
            )}

            {/* 학습 목표 */}
            {formData.name && (
              <div className="fade-in-up">
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  구체적인 학습 목표 *
                </label>
                <Input
                  type="text"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  placeholder={formData.goal_type === 'certification'
                    ? `예: ${formData.subject} 필기 1회 합격`
                    : `예: ${formData.subject} 기초부터 중급 수준까지`
                  }
                  className="text-lg"
                  required
                />
              </div>
            )}

            {/* 설명 */}
            {formData.goal && (
              <div className="fade-in-up">
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  추가 설명 (선택사항)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="학습 계획, 현재 수준, 특별한 요구사항 등을 자유롭게 작성하세요"
                  className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all resize-none"
                  rows={4}
                />
              </div>
            )}

            {/* 버튼 */}
            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 py-4 text-lg"
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || !formData.name || !formData.subject || !formData.goal}
                className="flex-1 py-4 text-lg gradient-primary text-white shadow-colored hover:shadow-lg transition-all duration-300"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    생성중...
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    AI 학습 공간 만들기
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateStudyRoomModal