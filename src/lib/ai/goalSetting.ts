import type { StudyRoom } from '../studyRooms'
import { aiClient } from './client'

// 목표 구체화 단계 타입
export type GoalSettingStep =
  | 'welcome'
  | 'current_level'
  | 'specific_goals'
  | 'timeline'
  | 'obstacles'
  | 'success_criteria'
  | 'final_confirmation'
  | 'completed'

// 목표 구체화 세션 상태
export interface GoalSettingSession {
  step: GoalSettingStep
  responses: Record<string, string>
  analysis: {
    currentLevel: string
    specificGoals: string[]
    timeframe: string
    challenges: string[]
    successMetrics: string[]
  }
}

// 구체화된 학습 목표 데이터
export interface ConcreteGoal {
  title: string
  description: string
  targetDate: Date | null
  milestones: Array<{
    title: string
    description: string
    targetDate: Date | null
    order: number
  }>
  successCriteria: string[]
  estimatedHours: number
}

// 목표 구체화 워크플로우 클래스
export class GoalSettingWorkflow {
  private room: StudyRoom
  private session: GoalSettingSession

  constructor(room: StudyRoom) {
    this.room = room
    this.session = {
      step: 'welcome',
      responses: {},
      analysis: {
        currentLevel: '',
        specificGoals: [],
        timeframe: '',
        challenges: [],
        successMetrics: []
      }
    }
  }

  // 현재 단계의 질문 생성
  async generateStepQuestion(): Promise<string> {
    const stepPrompts = {
      welcome: this.generateWelcomePrompt(),
      current_level: this.generateCurrentLevelPrompt(),
      specific_goals: this.generateSpecificGoalsPrompt(),
      timeline: this.generateTimelinePrompt(),
      obstacles: this.generateObstaclesPrompt(),
      success_criteria: this.generateSuccessCriteriaPrompt(),
      final_confirmation: this.generateFinalConfirmationPrompt(),
      completed: '목표 설정이 완료되었습니다!'
    }

    return stepPrompts[this.session.step]
  }

  // 사용자 응답 처리 및 다음 단계로 진행
  async processResponse(userResponse: string): Promise<{
    nextQuestion: string
    isCompleted: boolean
    analysis?: any
  }> {
    console.log(`목표 설정 단계: ${this.session.step}, 사용자 응답: "${userResponse}"`)

    // 현재 단계의 응답 저장
    this.session.responses[this.session.step] = userResponse

    // AI를 통한 응답 분석 및 다음 단계 결정
    await this.analyzeResponse(userResponse)

    console.log('현재 분석 상태:', this.session.analysis)

    // 다음 단계로 진행
    this.moveToNextStep()

    // 완료 여부 확인
    const isCompleted = this.session.step === 'completed'
    console.log(`완료 여부 확인: ${this.session.step} === 'completed' ? ${isCompleted}`)

    // final_confirmation 단계에서는 바로 completed로 전환
    if (this.session.step === 'final_confirmation') {
      console.log('final_confirmation 단계 감지 - 바로 완료 처리')
      this.session.step = 'completed'

      // 최종 목표 생성
      console.log('목표 설정 워크플로우 완료! 최종 목표 생성 중...')
      const concreteGoal = await this.generateConcreteGoal()
      console.log('생성된 구체적 목표:', concreteGoal)

      return {
        nextQuestion: '🎊 축하합니다! 체계적인 학습 목표와 계획이 완성되었습니다!\n\n이제부터는 이 맞춤형 계획에 따라 **개인 전용 AI 튜터**로서 도움을 드리겠습니다.\n\n📚 **다음 단계**:\n1. **학습 진도** 탭에서 실시간 진행 상황 확인\n2. **학습 자료** 탭에서 맞춤 자료 추천 받기\n3. **AI 튜터**와 언제든지 자유로운 질문과 대화\n\n첫 번째 질문이나 궁금한 점을 자유롭게 말씀해 보세요! 🚀',
        isCompleted: true,
        analysis: concreteGoal
      }
    }

    if (isCompleted) {
      // 최종 목표 생성
      console.log('목표 설정 워크플로우 완료! 최종 목표 생성 중...')
      const concreteGoal = await this.generateConcreteGoal()
      console.log('생성된 구체적 목표:', concreteGoal)

      return {
        nextQuestion: '🎉 목표 설정이 완료되었습니다! 이제 맞춤형 학습을 시작해보세요.',
        isCompleted: true,
        analysis: concreteGoal
      }
    }

    const nextQuestion = await this.generateStepQuestion()
    return {
      nextQuestion,
      isCompleted: false
    }
  }

  // 현재 세션 상태 가져오기
  getSession(): GoalSettingSession {
    return this.session
  }

  // 웰컴 프롬프트 생성
  private generateWelcomePrompt(): string {
    return `안녕하세요! ${this.room.subject} 전문 AI 튜터입니다. 🎯

**${this.room.name}** 학습 공간에서 효과적인 학습을 위해 먼저 구체적인 목표를 함께 설정해보겠습니다.

📋 **현재 입력된 목표**: "${this.room.goal}"

이 목표를 더 구체적이고 달성 가능한 형태로 발전시켜서, 체계적인 학습 계획을 세워드리겠습니다.

**첫 번째 질문**: 현재 ${this.room.subject} 분야에서 본인의 수준을 어떻게 평가하시나요?

${this.room.goal_type === 'certification' ?
`예시: "완전 초보자입니다", "기초는 알지만 실무는 부족해요", "어느 정도 경험이 있어요" 등` :
`예시: "전혀 경험이 없어요", "조금 해봤지만 체계적으로 배우고 싶어요", "기본은 알지만 실력을 늘리고 싶어요" 등`
}`
  }

  // 현재 수준 파악 프롬프트 생성
  private generateCurrentLevelPrompt(): string {
    const currentLevel = this.session.responses.current_level || this.session.responses.welcome

    return `좋습니다! "${currentLevel}"라고 하셨군요. 👍

**두 번째 질문**: ${this.room.goal} 목표를 더 구체적으로 나눠서 설명해주세요.

${this.room.goal_type === 'certification' ?
`예를 들어:
- 어떤 시험을 언제까지 합격하고 싶으신가요?
- 특히 집중하고 싶은 영역이나 과목이 있나요?
- 목표 점수나 등급이 있나요?` :
`예를 들어:
- 구체적으로 어떤 실력을 기르고 싶으신가요?
- 어느 정도 수준까지 도달하고 싶으신가요?
- 실제로 활용하고 싶은 상황이나 목적이 있나요?`
}

자세히 말씀해 주실수록 더 정확한 학습 계획을 세울 수 있습니다! 😊`
  }

  // 구체적 목표 프롬프트 생성
  private generateSpecificGoalsPrompt(): string {
    return `훌륭한 답변이네요! 🌟

**세 번째 질문**: 이 목표를 언제까지 달성하고 싶으신가요?

${this.room.goal_type === 'certification' ?
`- 구체적인 시험 날짜가 정해져 있나요?
- 만약 정해지지 않았다면, 언제쯤 시험을 보고 싶으신가요?
- 하루에 몇 시간 정도 학습할 수 있나요?` :
`- 목표 달성 희망 시기는 언제인가요?
- 주/일 기준으로 얼마나 자주 학습할 계획인가요?
- 하루에 보통 몇 시간 정도 투자할 수 있나요?`
}

현실적인 시간 계획을 세워야 무리하지 않고 꾸준히 할 수 있어요! ⏰`
  }

  // 타임라인 프롬프트 생성
  private generateTimelinePrompt(): string {
    return `시간 계획도 잘 세우셨네요! ⏰

**네 번째 질문**: 학습 과정에서 예상되는 어려움이나 걱정되는 부분이 있나요?

예를 들어:
${this.room.goal_type === 'certification' ?
`- 특히 어려워 보이는 과목이나 영역
- 시간 부족이나 집중력 문제
- 기초 지식 부족이나 실무 경험 부족
- 시험 전략이나 문제 풀이 방법` :
`- 기초 실력 부족이나 이론 이해
- 꾸준한 연습이나 동기 유지
- 실제 적용이나 응용의 어려움
- 올바른 방법과 순서`}

어려움을 미리 파악해야 해결 방법도 함께 준비할 수 있어요! 💪`
  }

  // 장애물 파악 프롬프트 생성
  private generateObstaclesPrompt(): string {
    return `걱정되는 부분들을 솔직하게 말씀해 주셔서 고맙습니다! 💡

**마지막 질문**: 목표를 달성했다고 판단할 구체적인 기준이 무엇인가요?

${this.room.goal_type === 'certification' ?
`예를 들어:
- 시험 합격 (몇 점 이상)
- 모의고사에서 안정적으로 합격선 유지
- 전체 범위 문제를 70% 이상 정확하게 풀기
- 실무에 바로 적용할 수 있는 수준` :
`예를 들어:
- 기본적인 동작이나 기술을 자유롭게 구사
- 혼자서도 응용하고 창작할 수 있는 수준
- 다른 사람에게 가르쳐줄 수 있을 정도
- 실제 상황에서 자신감 있게 활용`}

명확한 성공 기준이 있으면 학습 방향을 정확히 잡을 수 있어요! 🎯`
  }

  // 성공 기준 프롬프트 생성
  private generateSuccessCriteriaPrompt(): string {
    return `완벽합니다! 이제 모든 정보가 준비되었습니다. 🎉

말씀해 주신 내용을 바탕으로 **맞춤형 학습 계획**을 생성하겠습니다:

${this.generateSummary()}

이 내용이 정확한가요? 수정하고 싶은 부분이 있으시면 말씀해 주세요.
괜찮으시다면 **"좋습니다"** 또는 **"확정"**이라고 말씀해 주세요! ✨`
  }

  // 최종 확인 프롬프트 생성
  private generateFinalConfirmationPrompt(): string {
    return `🎊 축하합니다! 체계적인 학습 목표와 계획이 완성되었습니다!

이제부터는 이 맞춤형 계획에 따라 **개인 전용 AI 튜터**로서 도움을 드리겠습니다.

📚 **다음 단계**:
1. **학습 진도** 탭에서 실시간 진행 상황 확인
2. **학습 자료** 탭에서 맞춤 자료 추천 받기
3. **AI 튜터**와 언제든지 자유로운 질문과 대화

첫 번째 질문이나 궁금한 점을 자유롭게 말씀해 보세요! 🚀`
  }

  // 응답 분석
  private async analyzeResponse(response: string): Promise<void> {
    // 분석 결과를 세션에 저장 (사용자 응답을 직접 저장)
    switch (this.session.step) {
      case 'welcome':
        // 첫 번째 질문: 현재 수준
        this.session.analysis.currentLevel = response
        break
      case 'current_level':
        // 두 번째 질문: 구체적 목표
        this.session.analysis.specificGoals = [response]
        break
      case 'specific_goals':
        // 세 번째 질문: 시간 계획
        this.session.analysis.timeframe = response
        break
      case 'timeline':
        // 네 번째 질문: 예상 어려움
        this.session.analysis.challenges = [response]
        break
      case 'obstacles':
        // 다섯 번째 질문: 성공 기준
        this.session.analysis.successMetrics = [response]
        break
      case 'success_criteria':
        // 여섯 번째는 확인 단계이므로 분석하지 않음
        break
      case 'final_confirmation':
        // 최종 확인 단계에서도 분석하지 않음
        break
    }
    console.log(`${this.session.step} 단계에서 "${response}" → 분석 결과:`, this.session.analysis)
  }

  // 다음 단계로 이동
  private moveToNextStep(): void {
    const currentStep = this.session.step
    const stepFlow: Record<GoalSettingStep, GoalSettingStep> = {
      welcome: 'current_level',
      current_level: 'specific_goals',
      specific_goals: 'timeline',
      timeline: 'obstacles',
      obstacles: 'success_criteria',
      success_criteria: 'final_confirmation',
      final_confirmation: 'completed',
      completed: 'completed'
    }

    const nextStep = stepFlow[this.session.step]
    console.log(`단계 전환: ${currentStep} → ${nextStep}`)
    this.session.step = nextStep
  }

  // 요약 생성
  private generateSummary(): string {
    const { currentLevel, specificGoals, timeframe, challenges, successMetrics } = this.session.analysis

    return `
📊 **현재 수준**: ${currentLevel}
🎯 **구체적 목표**: ${specificGoals.join(', ')}
⏰ **시간 계획**: ${timeframe}
⚠️ **예상 어려움**: ${challenges.join(', ')}
✅ **성공 기준**: ${successMetrics.join(', ')}
    `.trim()
  }

  // 최종 구체적 목표 생성
  private async generateConcreteGoal(): Promise<ConcreteGoal> {
    const { analysis } = this.session

    // 타겟 날짜 계산 (시간 계획에서 추출)
    const targetDate = this.extractTargetDate(analysis.timeframe)

    // 예상 학습 시간 계산
    const estimatedHours = this.calculateEstimatedHours(analysis.timeframe)

    // 마일스톤 생성
    const milestones = this.generateMilestones(analysis.specificGoals, targetDate)

    return {
      title: `${this.room.subject} ${this.room.goal_type === 'certification' ? '자격증 취득' : '스킬 마스터'}`,
      description: analysis.specificGoals.join('. '),
      targetDate,
      milestones,
      successCriteria: analysis.successMetrics,
      estimatedHours
    }
  }

  // 타겟 날짜 추출 (간단한 파싱)
  private extractTargetDate(timeframe: string): Date | null {
    // 간단한 날짜 추출 로직 (실제로는 더 정교한 NLP 필요)
    const now = new Date()

    if (timeframe.includes('1개월') || timeframe.includes('한 달')) {
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    } else if (timeframe.includes('3개월')) {
      return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
    } else if (timeframe.includes('6개월')) {
      return new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000)
    } else if (timeframe.includes('2025년')) {
      // 2025년 12월 31일로 설정
      return new Date(2025, 11, 31)
    } else if (timeframe.includes('년')) {
      // 1년 후로 설정
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
    }

    return null
  }

  // 예상 학습 시간 계산
  private calculateEstimatedHours(timeframe: string): number {
    // 간단한 시간 계산 로직
    if (timeframe.includes('1시간')) return 30
    if (timeframe.includes('2시간')) return 60
    if (timeframe.includes('3시간')) return 90
    return 40 // 기본값
  }

  // 마일스톤 생성
  private generateMilestones(goals: string[], targetDate: Date | null): ConcreteGoal['milestones'] {
    if (!targetDate) return []

    const milestones: ConcreteGoal['milestones'] = []
    const daysBetween = targetDate.getTime() - Date.now()
    const quarterInterval = daysBetween / 4

    for (let i = 1; i <= 3; i++) {
      const milestoneDate = new Date(Date.now() + quarterInterval * i)
      milestones.push({
        title: `${i === 1 ? '기초' : i === 2 ? '중급' : '고급'} 단계 완료`,
        description: `${i * 25}% 목표 달성`,
        targetDate: milestoneDate,
        order: i
      })
    }

    return milestones
  }
}