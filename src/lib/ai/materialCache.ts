import type { MaterialCategory } from './materialRecommendations'

// 캐시 키 구성 요소
export interface CacheKey {
  roomId: string
  subject: string
  goalType: 'certification' | 'skill_improvement'
  currentStep: number
  userLevel: 'beginner' | 'intermediate' | 'advanced'
  version: number // 진도나 수준 변경 시 증가
}

// 캐시 엔트리
export interface CacheEntry {
  key: CacheKey
  materials: MaterialCategory[]
  createdAt: number
  expiresAt: number
}

class MaterialCacheManager {
  private static instance: MaterialCacheManager
  private cache: Map<string, CacheEntry> = new Map()
  private readonly CACHE_DURATION = 30 * 60 * 1000 // 30분
  private readonly MAX_CACHE_SIZE = 50 // 최대 50개 캐시 유지

  static getInstance(): MaterialCacheManager {
    if (!MaterialCacheManager.instance) {
      MaterialCacheManager.instance = new MaterialCacheManager()
    }
    return MaterialCacheManager.instance
  }

  // 캐시 키 생성
  private generateCacheKey(key: CacheKey): string {
    return `${key.roomId}_${key.subject}_${key.goalType}_${key.currentStep}_${key.userLevel}_${key.version}`
  }

  // 버전 계산 (진도와 수준에 따라)
  private calculateVersion(currentStep: number, userLevel: string, totalProgress: number): number {
    // 진도 25% 단위로 버전 증가 + 수준별 가중치
    const stepVersion = Math.floor(totalProgress / 25)
    const levelWeight = userLevel === 'beginner' ? 0 :
                      userLevel === 'intermediate' ? 100 : 200
    return stepVersion + levelWeight
  }

  // 캐시 조회
  get(roomId: string, subject: string, goalType: 'certification' | 'skill_improvement',
      currentStep: number, userLevel: 'beginner' | 'intermediate' | 'advanced',
      totalProgress: number): MaterialCategory[] | null {

    const version = this.calculateVersion(currentStep, userLevel, totalProgress)
    const key: CacheKey = { roomId, subject, goalType, currentStep, userLevel, version }
    const cacheKeyStr = this.generateCacheKey(key)

    console.log('캐시 조회 시도:', {
      cacheKey: cacheKeyStr,
      version,
      totalProgress,
      userLevel
    })

    const entry = this.cache.get(cacheKeyStr)

    if (!entry) {
      console.log('캐시 미스: 엔트리 없음')
      return null
    }

    // 만료 시간 확인
    if (Date.now() > entry.expiresAt) {
      console.log('캐시 만료됨, 삭제')
      this.cache.delete(cacheKeyStr)
      return null
    }

    console.log('캐시 히트! 캐시된 자료 반환')
    return entry.materials
  }

  // 캐시 저장
  set(roomId: string, subject: string, goalType: 'certification' | 'skill_improvement',
      currentStep: number, userLevel: 'beginner' | 'intermediate' | 'advanced',
      totalProgress: number, materials: MaterialCategory[]): void {

    const version = this.calculateVersion(currentStep, userLevel, totalProgress)
    const key: CacheKey = { roomId, subject, goalType, currentStep, userLevel, version }
    const cacheKeyStr = this.generateCacheKey(key)

    const entry: CacheEntry = {
      key,
      materials: JSON.parse(JSON.stringify(materials)), // 딥 카피
      createdAt: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION
    }

    // 캐시 크기 제한
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest()
    }

    this.cache.set(cacheKeyStr, entry)

    console.log('캐시 저장 완료:', {
      cacheKey: cacheKeyStr,
      version,
      materialsCount: materials.length,
      expiresIn: Math.round(this.CACHE_DURATION / 1000 / 60) + '분'
    })
  }

  // 가장 오래된 캐시 제거
  private evictOldest(): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      console.log('오래된 캐시 제거:', oldestKey)
    }
  }

  // 특정 룸의 캐시 무효화 (목표 변경 시 등)
  invalidateRoom(roomId: string): void {
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (entry.key.roomId === roomId) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key)
    })

    console.log(`룸 ${roomId} 캐시 무효화 완료: ${keysToDelete.length}개 삭제`)
  }

  // 진도 변경 감지하여 해당 수준 캐시만 무효화
  invalidateProgressLevel(roomId: string, oldProgress: number, newProgress: number): void {
    const oldVersion = Math.floor(oldProgress / 25)
    const newVersion = Math.floor(newProgress / 25)

    // 진도 수준이 변경된 경우만 무효화
    if (oldVersion !== newVersion) {
      console.log('진도 수준 변경 감지:', {
        oldProgress,
        newProgress,
        oldVersion,
        newVersion
      })

      // 해당 룸의 모든 캐시 무효화 (더 정밀한 제어 가능)
      this.invalidateRoom(roomId)
    }
  }

  // 캐시 통계
  getStats(): { size: number, hitRate: number, entries: Array<{ key: string, createdAt: string, expiresAt: string }> } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      createdAt: new Date(entry.createdAt).toLocaleString(),
      expiresAt: new Date(entry.expiresAt).toLocaleString()
    }))

    return {
      size: this.cache.size,
      hitRate: 0, // TODO: 히트율 추적 구현
      entries
    }
  }

  // 캐시 클리어
  clear(): void {
    this.cache.clear()
    console.log('모든 캐시 클리어됨')
  }

  // 만료된 캐시 정리
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key)
    })

    if (keysToDelete.length > 0) {
      console.log(`만료된 캐시 ${keysToDelete.length}개 정리 완료`)
    }
  }
}

export const materialCache = MaterialCacheManager.getInstance()

// 정기적으로 만료된 캐시 정리 (5분마다)
if (typeof window !== 'undefined') {
  setInterval(() => {
    materialCache.cleanup()
  }, 5 * 60 * 1000)
}