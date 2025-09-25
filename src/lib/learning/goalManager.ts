import { supabase } from '../supabase'
import type { ConcreteGoal } from '../ai/goalSetting'
import type { StudyRoom } from '../studyRooms'
import { AIRoadmapGenerator } from '../ai/roadmapGenerator'

// 데이터베이스 타입 정의
export interface LearningGoal {
  id: string
  room_id: string
  title: string
  description: string | null
  target_date: string | null
  status: 'pending' | 'in_progress' | 'completed'
  progress: number
  milestones: any[]
  created_at: string
  updated_at: string
}

export interface Roadmap {
  id: string
  room_id: string
  title: string
  description: string | null
  total_steps: number
  completed_steps: number
  steps: RoadmapStep[]
  estimated_hours: number | null
  created_at: string
  updated_at: string
}

export interface RoadmapStep {
  id: string
  title: string
  description: string
  order: number
  status: 'pending' | 'in_progress' | 'completed'
  estimatedHours: number
  resources?: string[]
}

// 학습 목표 관리 클래스
export class GoalManager {
  // 학습 목표 저장
  static async saveLearningGoal(
    roomId: string,
    concreteGoal: ConcreteGoal,
    room: StudyRoom
  ): Promise<LearningGoal> {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('인증되지 않은 사용자입니다.')
    }

    // 기존 목표가 있는지 확인
    const { data: existingGoal } = await supabase
      .from('learning_goals')
      .select('*')
      .eq('room_id', roomId)
      .maybeSingle()

    const goalData = {
      room_id: roomId,
      title: concreteGoal.title,
      description: concreteGoal.description,
      target_date: concreteGoal.targetDate?.toISOString() || null,
      status: 'in_progress' as const,
      progress: 0,
      milestones: concreteGoal.milestones
    }

    let savedGoal: LearningGoal

    if (existingGoal) {
      // 기존 목표 업데이트
      const { data, error } = await supabase
        .from('learning_goals')
        .update(goalData)
        .eq('id', existingGoal.id)
        .select('*')
        .single()

      if (error) {
        console.error('학습 목표 업데이트 실패:', error)
        throw new Error('학습 목표를 업데이트하는데 실패했습니다.')
      }

      savedGoal = data
    } else {
      // 새 목표 생성
      const { data, error } = await supabase
        .from('learning_goals')
        .insert(goalData)
        .select('*')
        .single()

      if (error) {
        console.error('학습 목표 저장 실패:', error)
        throw new Error('학습 목표를 저장하는데 실패했습니다.')
      }

      savedGoal = data
    }

    // AI 로드맵도 함께 생성
    await this.generateAndSaveRoadmap(roomId, concreteGoal, room)

    return savedGoal
  }

  // AI 로드맵 생성 및 저장
  static async generateAndSaveRoadmap(
    roomId: string,
    concreteGoal: ConcreteGoal,
    room: StudyRoom
  ): Promise<Roadmap> {
    console.log('AI 로드맵 생성 시작...', { roomId, subject: room.subject })

    // AI 로드맵 생성기 인스턴스 생성
    const aiGenerator = new AIRoadmapGenerator(room, concreteGoal)

    let steps
    try {
      // AI를 통한 지능적 로드맵 생성
      const aiSteps = await aiGenerator.generateIntelligentRoadmap()
      steps = aiSteps.map(step => ({
        id: step.id,
        title: step.title,
        description: step.description,
        order: step.order,
        status: step.status,
        estimatedHours: step.estimatedHours,
        resources: step.resources,
        // 추가 AI 생성 데이터는 메타데이터로 저장
        metadata: {
          detailedContent: step.detailedContent,
          prerequisites: step.prerequisites,
          learningOutcomes: step.learningOutcomes
        }
      }))
      console.log('AI 로드맵 생성 성공:', steps.length, '단계')
    } catch (error) {
      console.error('AI 로드맵 생성 실패, 기본 로드맵 사용:', error)
      // AI 실패시 기본 로드맵 사용
      steps = this.generateDefaultSteps(concreteGoal)
    }

    const roadmapData = {
      room_id: roomId,
      title: `${concreteGoal.title} 학습 계획`,
      description: `${concreteGoal.description}을 위한 단계별 학습 로드맵`,
      total_steps: steps.length,
      completed_steps: 0,
      steps,
      estimated_hours: concreteGoal.estimatedHours
    }

    // 기존 로드맵 확인
    const { data: existingRoadmap } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('room_id', roomId)
      .maybeSingle()

    if (existingRoadmap) {
      // 기존 로드맵 업데이트
      const { data, error } = await supabase
        .from('roadmaps')
        .update(roadmapData)
        .eq('id', existingRoadmap.id)
        .select('*')
        .single()

      if (error) {
        console.error('로드맵 업데이트 실패:', error)
        throw new Error('로드맵을 업데이트하는데 실패했습니다.')
      }

      return data
    } else {
      // 새 로드맵 생성
      const { data, error } = await supabase
        .from('roadmaps')
        .insert(roadmapData)
        .select('*')
        .single()

      if (error) {
        console.error('로드맵 저장 실패:', error)
        throw new Error('로드맵을 저장하는데 실패했습니다.')
      }

      return data
    }
  }

  // 학습 목표 조회
  static async getLearningGoal(roomId: string): Promise<LearningGoal | null> {
    try {
      const { data, error } = await supabase
        .from('learning_goals')
        .select('*')
        .eq('room_id', roomId)
        .maybeSingle()

      if (error) {
        if (error.code === 'PGRST116') {
          // 데이터가 없는 경우
          return null
        }
        console.error('학습 목표 조회 실패:', error)
        throw new Error('학습 목표를 불러오는데 실패했습니다.')
      }

      return data
    } catch (error) {
      console.error('학습 목표 조회 중 예외 발생:', error)
      // 406 에러 등이 발생하면 null을 반환하여 목표 설정을 시작하도록 함
      return null
    }
  }

  // 로드맵 조회
  static async getRoadmap(roomId: string): Promise<Roadmap | null> {
    const { data, error } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('room_id', roomId)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') {
        // 데이터가 없는 경우
        return null
      }
      console.error('로드맵 조회 실패:', error)
      throw new Error('로드맵을 불러오는데 실패했습니다.')
    }

    return data
  }

  // 학습 진도 업데이트
  static async updateProgress(
    roomId: string,
    progressData: {
      progress: number
      completedSteps: number
      currentStep?: string
    }
  ): Promise<void> {
    // 학습 목표 진도 업데이트
    const { error: goalError } = await supabase
      .from('learning_goals')
      .update({
        progress: progressData.progress,
        status: progressData.progress >= 100 ? 'completed' : 'in_progress'
      })
      .eq('room_id', roomId)

    if (goalError) {
      console.error('학습 목표 진도 업데이트 실패:', goalError)
    }

    // 로드맵 진도 업데이트
    const { error: roadmapError } = await supabase
      .from('roadmaps')
      .update({
        completed_steps: progressData.completedSteps
      })
      .eq('room_id', roomId)

    if (roadmapError) {
      console.error('로드맵 진도 업데이트 실패:', roadmapError)
    }
  }

  // 마일스톤 달성 체크
  static async checkMilestoneAchievement(
    roomId: string,
    progress: number
  ): Promise<{ achieved: boolean; milestone?: any }> {
    const goal = await this.getLearningGoal(roomId)

    if (!goal || !goal.milestones) {
      return { achieved: false }
    }

    // 현재 진도에 해당하는 마일스톤 찾기
    const milestones = goal.milestones as any[]
    const currentMilestone = milestones.find(m =>
      progress >= (m.order * 25) && progress < ((m.order + 1) * 25)
    )

    if (currentMilestone) {
      return {
        achieved: true,
        milestone: currentMilestone
      }
    }

    return { achieved: false }
  }

  // 기본 로드맵 스텝 생성
  private static generateDefaultSteps(concreteGoal: ConcreteGoal): RoadmapStep[] {
    const baseSteps: Omit<RoadmapStep, 'id'>[] = [
      {
        title: '기초 개념 학습',
        description: '기본 이론과 핵심 개념 이해',
        order: 1,
        status: 'pending',
        estimatedHours: Math.floor(concreteGoal.estimatedHours * 0.3),
        resources: ['핵심 개념 자료', '기초 이론 문서']
      },
      {
        title: '실습 및 연습',
        description: '학습한 내용을 실습을 통해 적용',
        order: 2,
        status: 'pending',
        estimatedHours: Math.floor(concreteGoal.estimatedHours * 0.4),
        resources: ['연습 문제', '실습 가이드']
      },
      {
        title: '심화 학습',
        description: '고급 내용과 응용 기술 학습',
        order: 3,
        status: 'pending',
        estimatedHours: Math.floor(concreteGoal.estimatedHours * 0.2),
        resources: ['심화 자료', '응용 예제']
      },
      {
        title: '최종 점검 및 완성',
        description: '전체 복습과 최종 목표 달성 확인',
        order: 4,
        status: 'pending',
        estimatedHours: Math.floor(concreteGoal.estimatedHours * 0.1),
        resources: ['종합 평가', '최종 프로젝트']
      }
    ]

    return baseSteps.map((step, index) => ({
      ...step,
      id: `step_${index + 1}`
    }))
  }

  // 목표 설정 완료 여부 확인
  static async hasCompletedGoalSetting(roomId: string): Promise<boolean> {
    try {
      const goal = await this.getLearningGoal(roomId)
      return goal !== null
    } catch (error) {
      console.error('목표 설정 완료 여부 확인 실패:', error)
      // 에러 발생 시 false 반환하여 목표 설정을 시작하도록 함
      return false
    }
  }
}