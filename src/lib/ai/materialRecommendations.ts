import type { StudyRoom } from '../studyRooms'
import { aiClient } from './client'
import { materialCache } from './materialCache'

// 학습 자료 인터페이스
export interface StudyMaterial {
  id: string
  title: string
  description: string
  content: string
  type: 'concept' | 'practice' | 'exam' | 'tip' | 'tutorial' | 'resource'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number // 학습 예상 시간(분)
  tags: string[]
  priority: number // 우선순위 (1-10)
  roadmapStep?: number // 로드맵 단계와 연결
}

// 자료 카테고리별 인터페이스
export interface MaterialCategory {
  id: string
  name: string
  icon: string
  description: string
  materials: StudyMaterial[]
}

// AI 자료 추천 엔진
export class MaterialRecommendationEngine {
  private room: StudyRoom
  private currentStep: number
  private userLevel: string
  private totalProgress: number

  constructor(room: StudyRoom, currentStep: number = 0, userLevel: string = 'beginner', totalProgress: number = 0) {
    this.room = room
    this.currentStep = currentStep
    this.userLevel = userLevel
    this.totalProgress = totalProgress
  }

  // 지능형 자료 생성 (캐싱 포함)
  async generateIntelligentMaterials(): Promise<MaterialCategory[]> {
    console.log('AI 학습 자료 생성 시작:', {
      subject: this.room.subject,
      goalType: this.room.goal_type,
      currentStep: this.currentStep,
      userLevel: this.userLevel,
      totalProgress: this.totalProgress
    })

    // 1. 먼저 캐시 확인
    const cachedMaterials = materialCache.get(
      this.room.id,
      this.room.subject,
      this.room.goal_type,
      this.currentStep,
      this.userLevel as 'beginner' | 'intermediate' | 'advanced',
      this.totalProgress
    )

    if (cachedMaterials) {
      console.log('💾 캐시에서 학습 자료 반환')
      return cachedMaterials
    }

    console.log('🔥 캐시 미스 - AI 자료 새로 생성')

    try {
      // 2. AI 기반 자료 생성
      const materialPrompt = this.buildMaterialPrompt()

      const aiResponse = await aiClient.getChatResponse([
        { role: 'system', content: materialPrompt }
      ], {
        model: 'gpt-4o-mini',
        temperature: 0.4,
        max_tokens: 3000
      })

      console.log('AI 자료 생성 응답 완료')

      // 3. AI 응답 파싱
      const categories = this.parseAIMaterialResponse(aiResponse.content)

      console.log('파싱된 학습 자료:', categories.length, '개 카테고리')

      // 4. 성공적으로 생성된 자료를 캐시에 저장
      materialCache.set(
        this.room.id,
        this.room.subject,
        this.room.goal_type,
        this.currentStep,
        this.userLevel as 'beginner' | 'intermediate' | 'advanced',
        this.totalProgress,
        categories
      )

      return categories
    } catch (error) {
      console.error('AI 자료 생성 실패:', error)

      // 5. AI 실패 시 폴백 자료 생성 및 캐싱
      const fallbackMaterials = this.generateFallbackMaterials()

      // 폴백 자료도 캐싱 (단, 짧은 시간만)
      materialCache.set(
        this.room.id,
        this.room.subject,
        this.room.goal_type,
        this.currentStep,
        this.userLevel as 'beginner' | 'intermediate' | 'advanced',
        this.totalProgress,
        fallbackMaterials
      )

      return fallbackMaterials
    }
  }

  // AI 자료 생성 프롬프트 구성
  private buildMaterialPrompt(): string {
    const isExam = this.room.goal_type === 'certification'
    const stepInfo = this.currentStep > 0 ? `현재 학습 단계는 ${this.currentStep}단계입니다.` : '초기 학습 단계입니다.'

    return `당신은 ${this.room.subject} 분야의 전문 교육 컨텐츠 제작자입니다.
다음 조건에 맞는 맞춤형 학습 자료를 생성해주세요.

📋 **학습자 정보**:
- **학습 분야**: ${this.room.subject}
- **목표 유형**: ${isExam ? '자격증 취득' : '스킬 향상'}
- **현재 수준**: ${this.userLevel}
- **학습 진도**: ${stepInfo}

📚 **요구사항**:
1. 각 카테고리별로 3-5개의 실용적인 학습 자료를 생성하세요
2. 현재 학습 단계에 적합한 난이도로 구성하세요
3. 실제 도움이 되는 구체적인 내용을 포함하세요
4. ${isExam ? '시험 출제 경향을 반영한 내용' : '실무 활용 가능한 내용'}을 우선하세요

📝 **응답 형식** (다음 JSON 형식으로 정확히 응답해주세요):
\`\`\`json
{
  "categories": [
    {
      "id": "concepts",
      "name": "핵심 개념",
      "icon": "💡",
      "description": "기본 이론과 핵심 개념 설명",
      "materials": [
        {
          "title": "자료 제목",
          "description": "자료 설명 (50자 이내)",
          "content": "실제 학습 내용 (200자 이상 상세 설명)",
          "difficulty": "beginner|intermediate|advanced",
          "estimatedTime": 숫자,
          "tags": ["태그1", "태그2"],
          "priority": 숫자
        }
      ]
    }${isExam ? `,
    {
      "id": "exams",
      "name": "기출 문제",
      "icon": "📝",
      "description": "실제 시험 기출 문제",
      "materials": []
    },
    {
      "id": "tips",
      "name": "시험 팁",
      "icon": "🎯",
      "description": "합격을 위한 실전 팁",
      "materials": []
    }` : `,
    {
      "id": "tutorials",
      "name": "실습 가이드",
      "icon": "🛠️",
      "description": "단계별 실습 가이드",
      "materials": []
    },
    {
      "id": "resources",
      "name": "참고 자료",
      "icon": "📚",
      "description": "추가 학습 참고 자료",
      "materials": []
    }`}
  ]
}
\`\`\`

중요: 응답은 반드시 유효한 JSON 형식이어야 하며, 실제 도움이 되는 구체적인 내용을 한국어로 작성해주세요.`
  }

  // AI 응답 파싱
  private parseAIMaterialResponse(response: string): MaterialCategory[] {
    try {
      // JSON 블록 추출
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
      const jsonStr = jsonMatch ? jsonMatch[1] : response

      const parsedData = JSON.parse(jsonStr)

      if (!parsedData.categories || !Array.isArray(parsedData.categories)) {
        throw new Error('Invalid JSON structure')
      }

      return parsedData.categories.map((category: any) => ({
        id: category.id,
        name: category.name,
        icon: category.icon,
        description: category.description,
        materials: (category.materials || []).map((material: any, index: number) => ({
          id: `${category.id}_${index + 1}`,
          title: material.title || '제목 없음',
          description: material.description || '',
          content: material.content || '',
          type: this.getCategoryType(category.id),
          difficulty: material.difficulty || 'beginner',
          estimatedTime: material.estimatedTime || 10,
          tags: Array.isArray(material.tags) ? material.tags : [],
          priority: material.priority || 5,
          roadmapStep: this.currentStep
        }))
      }))
    } catch (error) {
      console.error('AI 응답 파싱 실패:', error)
      throw error
    }
  }

  // 카테고리 ID를 MaterialType으로 변환
  private getCategoryType(categoryId: string): StudyMaterial['type'] {
    const typeMap: Record<string, StudyMaterial['type']> = {
      concepts: 'concept',
      practice: 'practice',
      exams: 'exam',
      tips: 'tip',
      tutorials: 'tutorial',
      resources: 'resource'
    }
    return typeMap[categoryId] || 'concept'
  }

  // 폴백 자료 생성 (AI 실패시)
  private generateFallbackMaterials(): MaterialCategory[] {
    const isExam = this.room.goal_type === 'certification'

    const baseCategories = [
      {
        id: 'concepts',
        name: '핵심 개념',
        icon: '💡',
        description: '기본 이론과 핵심 개념 설명',
        materials: this.generateBasicConcepts()
      },
      {
        id: 'practice',
        name: '연습 문제',
        icon: '✏️',
        description: '실력 향상을 위한 연습 문제',
        materials: this.generatePracticeProblems()
      }
    ]

    if (isExam) {
      return [
        ...baseCategories,
        {
          id: 'exams',
          name: '기출 문제',
          icon: '📝',
          description: '실제 시험 기출 문제',
          materials: this.generateExamProblems()
        },
        {
          id: 'tips',
          name: '시험 팁',
          icon: '🎯',
          description: '합격을 위한 실전 팁',
          materials: this.generateExamTips()
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
          materials: this.generateTutorials()
        },
        {
          id: 'resources',
          name: '참고 자료',
          icon: '📚',
          description: '추가 학습 참고 자료',
          materials: this.generateResources()
        }
      ]
    }
  }

  // 기본 개념 자료 생성
  private generateBasicConcepts(): StudyMaterial[] {
    return [
      {
        id: 'concept_1',
        title: `${this.room.subject} 기본 개념`,
        description: '핵심 개념과 용어 정리',
        content: `${this.room.subject} 분야의 기본 개념과 핵심 용어들을 체계적으로 정리한 자료입니다. 초보자도 이해하기 쉽게 설명되어 있습니다.`,
        type: 'concept',
        difficulty: 'beginner',
        estimatedTime: 15,
        tags: ['기초', '개념', '용어'],
        priority: 9
      }
    ]
  }

  // 연습 문제 생성
  private generatePracticeProblems(): StudyMaterial[] {
    return [
      {
        id: 'practice_1',
        title: '기초 연습 문제',
        description: '개념 이해도를 점검하는 문제',
        content: '학습한 개념을 바탕으로 한 기초적인 연습 문제들입니다. 단계별로 난이도가 조정되어 있습니다.',
        type: 'practice',
        difficulty: 'beginner',
        estimatedTime: 20,
        tags: ['연습', '문제'],
        priority: 8
      }
    ]
  }

  // 기출 문제 생성
  private generateExamProblems(): StudyMaterial[] {
    return [
      {
        id: 'exam_1',
        title: '최근 기출 문제',
        description: '실제 시험에 출제된 문제',
        content: '최근 시험에서 출제된 실제 문제들을 모아 정리했습니다. 해설과 함께 제공됩니다.',
        type: 'exam',
        difficulty: 'intermediate',
        estimatedTime: 30,
        tags: ['기출', '시험'],
        priority: 10
      }
    ]
  }

  // 시험 팁 생성
  private generateExamTips(): StudyMaterial[] {
    return [
      {
        id: 'tip_1',
        title: '시험 합격 전략',
        description: '효과적인 시험 준비 방법',
        content: '시험 합격을 위한 체계적인 학습 전략과 시간 관리 방법을 제공합니다.',
        type: 'tip',
        difficulty: 'beginner',
        estimatedTime: 10,
        tags: ['전략', '팁'],
        priority: 7
      }
    ]
  }

  // 튜토리얼 생성
  private generateTutorials(): StudyMaterial[] {
    return [
      {
        id: 'tutorial_1',
        title: '실습 가이드',
        description: '단계별 실습 방법',
        content: '초보자도 따라할 수 있는 단계별 실습 가이드입니다. 실제 예제와 함께 설명합니다.',
        type: 'tutorial',
        difficulty: 'beginner',
        estimatedTime: 25,
        tags: ['실습', '가이드'],
        priority: 8
      }
    ]
  }

  // 참고 자료 생성
  private generateResources(): StudyMaterial[] {
    return [
      {
        id: 'resource_1',
        title: '추가 학습 자료',
        description: '심화 학습을 위한 자료',
        content: '더 깊이 있는 학습을 원하는 분들을 위한 추가 자료와 참고 링크를 제공합니다.',
        type: 'resource',
        difficulty: 'intermediate',
        estimatedTime: 15,
        tags: ['참고', '심화'],
        priority: 6
      }
    ]
  }
}