import { useState, useEffect } from 'react'
import { GoalManager, type LearningGoal, type Roadmap } from '../lib/learning/goalManager'
import { supabase } from '../lib/supabase'

export interface ProgressStats {
  totalProgress: number
  totalStudyHours: number
  currentStreak: number
  completedSteps: number
  totalSteps: number
  weeklyHours: number
}

export interface StudySession {
  id: string
  date: string
  duration: number
  topics: string[]
  notes: string
}

export interface ProgressData {
  goal: LearningGoal | null
  roadmap: Roadmap | null
  stats: ProgressStats
  sessions: StudySession[]
  isLoading: boolean
  error: string | null
}

// 학습 진도 데이터를 실시간으로 관리하는 훅
export const useProgressData = (roomId: string) => {
  const [progressData, setProgressData] = useState<ProgressData>({
    goal: null,
    roadmap: null,
    stats: {
      totalProgress: 0,
      totalStudyHours: 0,
      currentStreak: 0,
      completedSteps: 0,
      totalSteps: 0,
      weeklyHours: 0
    },
    sessions: [],
    isLoading: true,
    error: null
  })

  // 데이터 로드 함수
  const loadProgressData = async () => {
    try {
      setProgressData(prev => ({ ...prev, isLoading: true, error: null }))

      console.log('진도 데이터 로드 시작:', roomId)

      // 병렬로 데이터 로드
      const [goal, roadmap] = await Promise.all([
        GoalManager.getLearningGoal(roomId),
        GoalManager.getRoadmap(roomId)
      ])

      console.log('로드된 데이터:', { goal, roadmap })

      // 데이터 검증
      if (!goal) {
        console.warn('목표 데이터가 없습니다.')
      }
      if (!roadmap) {
        console.warn('로드맵 데이터가 없습니다.')
      }

      // 통계 계산
      const stats = calculateStats(goal, roadmap)

      // TODO: 세션 데이터 로드 (향후 구현)
      const sessions: StudySession[] = []

      const newProgressData = {
        goal,
        roadmap,
        stats,
        sessions,
        isLoading: false,
        error: null
      }

      setProgressData(newProgressData)

      console.log('계산된 통계:', stats)
      console.log('최종 설정된 progressData:', newProgressData)
    } catch (error) {
      console.error('진도 데이터 로드 실패:', error)
      setProgressData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '데이터를 불러오는데 실패했습니다.'
      }))
    }
  }

  // 통계 계산 함수
  const calculateStats = (goal: LearningGoal | null, roadmap: Roadmap | null): ProgressStats => {
    if (!goal || !roadmap) {
      return {
        totalProgress: 0,
        totalStudyHours: 0,
        currentStreak: 0,
        completedSteps: 0,
        totalSteps: 0,
        weeklyHours: 0
      }
    }

    const completedSteps = roadmap.completed_steps || 0
    const totalSteps = roadmap.total_steps || 0
    const totalProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

    // 마일스톤 기반 진도 계산도 고려
    const goalProgress = goal.progress || 0
    const finalProgress = Math.max(totalProgress, goalProgress)

    return {
      totalProgress: finalProgress,
      totalStudyHours: 0, // TODO: 실제 학습 시간 추적 구현
      currentStreak: 0, // TODO: 연속 학습일 추적 구현
      completedSteps,
      totalSteps,
      weeklyHours: 0 // TODO: 주간 학습 시간 계산
    }
  }

  // 진도 업데이트 함수
  const updateProgress = async (newProgress: number, completedSteps: number) => {
    try {
      await GoalManager.updateProgress(roomId, {
        progress: newProgress,
        completedSteps,
        currentStep: `단계 ${completedSteps + 1}`
      })

      // 데이터 다시 로드
      await loadProgressData()
    } catch (error) {
      console.error('진도 업데이트 실패:', error)
      setProgressData(prev => ({
        ...prev,
        error: '진도를 업데이트하는데 실패했습니다.'
      }))
    }
  }

  // 단계 완료 처리
  const completeStep = async (stepId: string) => {
    if (!progressData.roadmap) return

    const currentCompletedSteps = progressData.roadmap.completed_steps
    const newCompletedSteps = currentCompletedSteps + 1
    const newProgress = Math.round((newCompletedSteps / progressData.roadmap.total_steps) * 100)

    console.log('단계 완료 처리:', { stepId, newCompletedSteps, newProgress })

    await updateProgress(newProgress, newCompletedSteps)
  }

  // 실시간 구독 설정
  useEffect(() => {
    if (!roomId) return

    // 초기 데이터 로드
    loadProgressData()

    // learning_goals 테이블 실시간 구독
    const goalSubscription = supabase
      .channel(`learning_goals:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'learning_goals',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('학습 목표 실시간 업데이트:', payload)
          loadProgressData() // 데이터 다시 로드
        }
      )
      .subscribe()

    // roadmaps 테이블 실시간 구독
    const roadmapSubscription = supabase
      .channel(`roadmaps:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'roadmaps',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('로드맵 실시간 업데이트:', payload)
          loadProgressData() // 데이터 다시 로드
        }
      )
      .subscribe()

    // 클린업
    return () => {
      goalSubscription.unsubscribe()
      roadmapSubscription.unsubscribe()
    }
  }, [roomId])

  return {
    ...progressData,
    updateProgress,
    completeStep,
    reload: loadProgressData
  }
}