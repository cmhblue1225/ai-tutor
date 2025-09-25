import { useState, useEffect, useCallback } from 'react'
import { useProgressData } from './useProgressData'

export type TabNotification = {
  id: string
  type: 'success' | 'info' | 'update' | 'achievement'
  title: string
  message: string
  targetTab?: 'chat' | 'progress' | 'materials'
  timestamp: number
}

export type TabBadge = {
  tabId: 'chat' | 'progress' | 'materials'
  count: number
  type: 'new' | 'update' | 'achievement'
  message: string
}

// 탭 간 실시간 인터랙션과 알림을 관리하는 훅
export const useTabNotifications = (roomId: string) => {
  const [notifications, setNotifications] = useState<TabNotification[]>([])
  const [badges, setBadges] = useState<TabBadge[]>([])
  const [hasNewGoal, setHasNewGoal] = useState(false)
  const [hasNewMaterials, setHasNewMaterials] = useState(false)
  const [lastProgressUpdate, setLastProgressUpdate] = useState<number>(0)

  const { stats, goal, roadmap } = useProgressData(roomId)

  // 새 알림 추가
  const addNotification = useCallback((notification: Omit<TabNotification, 'id' | 'timestamp'>) => {
    const newNotification: TabNotification = {
      ...notification,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now()
    }

    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]) // 최대 5개 유지

    // 알림이 특정 탭과 연관되면 배지 업데이트
    if (notification.targetTab) {
      updateTabBadge(notification.targetTab, 'update', notification.title)
    }
  }, [])

  // 탭 배지 업데이트
  const updateTabBadge = useCallback((tabId: 'chat' | 'progress' | 'materials', type: TabBadge['type'], message: string) => {
    setBadges(prev => {
      const existing = prev.find(badge => badge.tabId === tabId)
      if (existing) {
        return prev.map(badge =>
          badge.tabId === tabId
            ? { ...badge, count: badge.count + 1, type, message }
            : badge
        )
      } else {
        return [...prev, { tabId, count: 1, type, message }]
      }
    })
  }, [])

  // 탭 배지 클리어
  const clearTabBadge = useCallback((tabId: 'chat' | 'progress' | 'materials') => {
    setBadges(prev => prev.filter(badge => badge.tabId !== tabId))
  }, [])

  // 알림 제거
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }, [])

  // 모든 알림 클리어
  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // 진도 변화 감지
  useEffect(() => {
    if (stats.totalProgress > lastProgressUpdate) {
      if (lastProgressUpdate > 0) { // 초기 로드가 아닌 경우만
        addNotification({
          type: 'achievement',
          title: '학습 진도 업데이트',
          message: `진도율이 ${stats.totalProgress}%로 향상되었습니다!`,
          targetTab: 'progress'
        })

        // 새 자료 생성 알림 (진도가 올라가면 새로운 자료가 생성될 수 있음)
        if (stats.totalProgress % 25 === 0) { // 25%씩 증가할 때마다
          setHasNewMaterials(true)
          addNotification({
            type: 'info',
            title: '새로운 학습 자료',
            message: '진도에 맞는 새로운 학습 자료가 준비되었습니다.',
            targetTab: 'materials'
          })
        }
      }
      setLastProgressUpdate(stats.totalProgress)
    }
  }, [stats.totalProgress, lastProgressUpdate, addNotification])

  // 목표 설정 완료 감지
  useEffect(() => {
    if (goal && !hasNewGoal) {
      setHasNewGoal(true)
      addNotification({
        type: 'success',
        title: '목표 설정 완료',
        message: `${goal.title} 목표가 설정되었습니다. 로드맵을 확인해보세요!`,
        targetTab: 'progress'
      })
      updateTabBadge('progress', 'new', '새로운 로드맵')
    }
  }, [goal, hasNewGoal, addNotification, updateTabBadge])

  // 로드맵 완료 단계 감지
  useEffect(() => {
    if (roadmap && roadmap.completed_steps > 0) {
      const completionPercentage = Math.round((roadmap.completed_steps / roadmap.total_steps) * 100)

      if (completionPercentage === 100) {
        addNotification({
          type: 'achievement',
          title: '로드맵 완주! 🎉',
          message: '모든 학습 단계를 완료했습니다. 축하합니다!',
          targetTab: 'progress'
        })
      } else if (roadmap.completed_steps % Math.ceil(roadmap.total_steps / 4) === 0) {
        // 25%, 50%, 75% 지점에서 알림
        addNotification({
          type: 'achievement',
          title: '중요 이정표 달성',
          message: `로드맵 ${completionPercentage}% 완료! 계속 화이팅하세요!`,
          targetTab: 'progress'
        })
      }
    }
  }, [roadmap?.completed_steps, roadmap?.total_steps, addNotification])

  // 탭별 배지 가져오기
  const getTabBadge = useCallback((tabId: 'chat' | 'progress' | 'materials') => {
    return badges.find(badge => badge.tabId === tabId)
  }, [badges])

  // 탭 전환 권장 확인
  const getSuggestedTab = useCallback((): { tab: 'chat' | 'progress' | 'materials', reason: string } | null => {
    // 목표가 설정되었고 아직 진도 탭을 확인하지 않은 경우
    if (goal && getTabBadge('progress')?.type === 'new') {
      return { tab: 'progress', reason: '새로운 로드맵이 생성되었습니다' }
    }

    // 새로운 학습 자료가 있는 경우
    if (hasNewMaterials && getTabBadge('materials')) {
      return { tab: 'materials', reason: '새로운 학습 자료가 추천되었습니다' }
    }

    // 진도가 낮고 목표가 있는 경우 자료 탭 권장
    if (goal && stats.totalProgress < 30 && !getTabBadge('materials')) {
      return { tab: 'materials', reason: '학습 자료로 기초를 다져보세요' }
    }

    return null
  }, [goal, hasNewMaterials, stats.totalProgress, getTabBadge])

  return {
    notifications,
    badges,
    hasNewGoal,
    hasNewMaterials,
    addNotification,
    updateTabBadge,
    clearTabBadge,
    removeNotification,
    clearAllNotifications,
    getTabBadge,
    getSuggestedTab,
    setHasNewMaterials
  }
}