import type { StudyRoom } from '../studyRooms'
import type { ConcreteGoal } from './goalSetting'
import { aiClient } from './client'

// 로드맵 단계 인터페이스
export interface RoadmapStep {
  id: string
  title: string
  description: string
  order: number
  status: 'pending' | 'in_progress' | 'completed'
  estimatedHours: number
  resources: string[]
  detailedContent: string[]
  prerequisites: string[]
  learningOutcomes: string[]
}

// AI 로드맵 생성기 클래스
export class AIRoadmapGenerator {
  private room: StudyRoom
  private concreteGoal: ConcreteGoal

  constructor(room: StudyRoom, concreteGoal: ConcreteGoal) {
    this.room = room
    this.concreteGoal = concreteGoal
  }

  // 지능적 로드맵 생성
  async generateIntelligentRoadmap(): Promise<RoadmapStep[]> {
    console.log('AI 로드맵 생성 시작:', {
      subject: this.room.subject,
      goalType: this.room.goal_type,
      targetDate: this.concreteGoal.targetDate,
      estimatedHours: this.concreteGoal.estimatedHours
    })

    const roadmapPrompt = this.buildRoadmapPrompt()

    try {
      const aiResponse = await aiClient.getChatResponse([
        { role: 'system', content: roadmapPrompt }
      ], {
        model: 'gpt-4o-mini',
        temperature: 0.3, // 창의성보다는 정확성 중시
        max_tokens: 2000
      })

      console.log('AI 로드맵 생성 응답:', aiResponse.content)

      // AI 응답 파싱하여 구조화된 로드맵 생성
      const parsedSteps = this.parseAIResponse(aiResponse.content)

      console.log('파싱된 로드맵 단계:', parsedSteps)
      return parsedSteps
    } catch (error) {
      console.error('AI 로드맵 생성 실패:', error)
      // 실패 시 기본 로드맵 반환
      return this.generateFallbackRoadmap()
    }
  }

  // 로드맵 생성 프롬프트 구성
  private buildRoadmapPrompt(): string {
    const { title, description, successCriteria, milestones } = this.concreteGoal
    const timeframe = this.concreteGoal.targetDate
      ? `${this.concreteGoal.targetDate.toLocaleDateString('ko-KR')}까지`
      : '설정된 기간 내'

    return `당신은 ${this.room.subject} 분야의 전문 교육 컨설턴트입니다.
다음 정보를 바탕으로 학습자를 위한 상세하고 체계적인 학습 로드맵을 생성해주세요.

📋 **학습자 정보**:
- **학습 분야**: ${this.room.subject}
- **목표 유형**: ${this.room.goal_type === 'certification' ? '자격증 취득' : '스킬 향상'}
- **구체적 목표**: ${description}
- **목표 달성 기한**: ${timeframe}
- **예상 학습 시간**: ${this.concreteGoal.estimatedHours}시간
- **성공 기준**: ${successCriteria.join(', ')}

📚 **요구사항**:
1. 6-8개의 단계별 학습 로드맵을 생성하세요
2. 각 단계는 논리적 순서로 구성되어야 합니다
3. 각 단계별로 상세한 학습 내용과 리소스를 포함하세요
4. 실무 적용 가능한 실습 과제를 포함하세요
5. ${this.room.goal_type === 'certification' ? '시험 출제 경향과 문제 유형을 반영하세요' : '실제 업무나 프로젝트에 적용 가능한 내용을 포함하세요'}

📝 **응답 형식** (다음 JSON 형식으로 정확히 응답해주세요):
\`\`\`json
{
  "steps": [
    {
      "title": "단계 제목",
      "description": "단계 설명 (50자 내외)",
      "estimatedHours": 숫자,
      "detailedContent": ["상세 학습 내용 1", "상세 학습 내용 2", "상세 학습 내용 3"],
      "resources": ["추천 자료 1", "추천 자료 2", "실습 과제"],
      "prerequisites": ["선수 조건 1", "선수 조건 2"],
      "learningOutcomes": ["학습 성과 1", "학습 성과 2", "학습 성과 3"]
    }
  ]
}
\`\`\`

중요: 응답은 반드시 유효한 JSON 형식이어야 하며, 한국어로 작성해주세요.`
  }

  // AI 응답 파싱
  private parseAIResponse(response: string): RoadmapStep[] {
    try {
      // JSON 블록 추출
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
      const jsonStr = jsonMatch ? jsonMatch[1] : response

      const parsedData = JSON.parse(jsonStr)

      if (!parsedData.steps || !Array.isArray(parsedData.steps)) {
        throw new Error('Invalid JSON structure')
      }

      return parsedData.steps.map((step: any, index: number) => ({
        id: `ai_step_${index + 1}`,
        title: step.title || `단계 ${index + 1}`,
        description: step.description || '',
        order: index + 1,
        status: 'pending' as const,
        estimatedHours: step.estimatedHours || Math.floor(this.concreteGoal.estimatedHours / parsedData.steps.length),
        resources: Array.isArray(step.resources) ? step.resources : [],
        detailedContent: Array.isArray(step.detailedContent) ? step.detailedContent : [],
        prerequisites: Array.isArray(step.prerequisites) ? step.prerequisites : [],
        learningOutcomes: Array.isArray(step.learningOutcomes) ? step.learningOutcomes : []
      }))
    } catch (error) {
      console.error('AI 응답 파싱 실패:', error)
      throw error
    }
  }

  // 폴백 로드맵 (AI 실패시 사용)
  private generateFallbackRoadmap(): RoadmapStep[] {
    const totalHours = this.concreteGoal.estimatedHours
    const isExam = this.room.goal_type === 'certification'

    const baseSteps = [
      {
        title: isExam ? '출제 범위 및 시험 정보 파악' : '기초 개념 및 전체 구조 파악',
        description: isExam ? '시험 출제 범위와 문제 유형을 정확히 파악' : '학습 분야의 전체적인 구조와 핵심 개념 이해',
        estimatedHours: Math.floor(totalHours * 0.1),
        detailedContent: [
          isExam ? '시험 공고 및 출제 기준 확인' : '분야별 핵심 개념 정리',
          isExam ? '기출문제 경향 분석' : '전체 학습 로드맵 수립',
          isExam ? '합격선 및 배점 구조 파악' : '기본 용어 및 개념 정리'
        ]
      },
      {
        title: '기초 이론 학습',
        description: '핵심 이론과 기본 개념을 체계적으로 학습',
        estimatedHours: Math.floor(totalHours * 0.3),
        detailedContent: [
          '기본 이론 및 개념 학습',
          '용어 정리 및 암기',
          '기초 문제 풀이 연습'
        ]
      },
      {
        title: '심화 학습 및 응용',
        description: '고급 개념과 실무 응용 사례를 학습',
        estimatedHours: Math.floor(totalHours * 0.3),
        detailedContent: [
          '심화 개념 및 이론 학습',
          '실무 사례 및 응용 문제',
          '종합적 사고력 향상 훈련'
        ]
      },
      {
        title: isExam ? '문제 풀이 및 모의고사' : '실습 프로젝트 수행',
        description: isExam ? '다양한 문제 유형을 풀고 실전 감각 향상' : '실제 프로젝트를 통한 실무 경험 축적',
        estimatedHours: Math.floor(totalHours * 0.2),
        detailedContent: [
          isExam ? '기출문제 및 예상 문제 풀이' : '개인 프로젝트 기획 및 설계',
          isExam ? '모의고사 및 시간 관리 연습' : '프로젝트 구현 및 개발',
          isExam ? '취약점 분석 및 보완' : '결과물 정리 및 발표'
        ]
      },
      {
        title: isExam ? '최종 점검 및 시험 대비' : '포트폴리오 완성 및 피드백',
        description: isExam ? '마지막 정리 및 실전 시험 준비' : '학습 결과물 정리 및 개선사항 도출',
        estimatedHours: Math.floor(totalHours * 0.1),
        detailedContent: [
          isExam ? '전체 범위 최종 점검' : '포트폴리오 정리 및 문서화',
          isExam ? '시험 당일 준비사항 점검' : '피드백 수집 및 개선사항 도출',
          isExam ? '마인드 컨트롤 및 컨디션 관리' : '향후 학습 계획 수립'
        ]
      }
    ]

    return baseSteps.map((step, index) => ({
      id: `fallback_step_${index + 1}`,
      title: step.title,
      description: step.description,
      order: index + 1,
      status: 'pending' as const,
      estimatedHours: step.estimatedHours,
      resources: [
        isExam ? '기본 교재' : '온라인 강의',
        isExam ? '문제집' : '실습 자료',
        isExam ? '요약 노트' : '프로젝트 템플릿'
      ],
      detailedContent: step.detailedContent,
      prerequisites: index === 0 ? [] : [`${index}단계 완료`],
      learningOutcomes: [
        `${step.title} 완료`,
        '다음 단계 진행 준비 완료',
        '실무 적용 능력 향상'
      ]
    }))
  }
}