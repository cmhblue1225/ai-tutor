import { supabase } from './supabase'

export interface ExamSchedule {
  id: string
  exam_date: string
  exam_type: '기사' | '산업기사'
  session: '1회' | '2회' | '3회'
  registration_start: string
  registration_end: string
  result_date: string
  created_at: string
  updated_at: string
}

export interface ExamScheduleInput {
  exam_date: string
  exam_type: '기사' | '산업기사'
  session: '1회' | '2회' | '3회'
  registration_start: string
  registration_end: string
  result_date: string
}

// 시험 일정 생성
export const createExamSchedule = async (scheduleData: ExamScheduleInput): Promise<ExamSchedule> => {
  try {
    const { data, error } = await supabase
      .from('exam_schedules')
      .insert([{
        ...scheduleData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      throw new Error(`시험 일정 생성 실패: ${error.message}`)
    }

    return data as ExamSchedule
  } catch (error) {
    console.error('시험 일정 생성 오류:', error)
    throw error
  }
}

// 시험 일정 목록 조회
export const getExamSchedules = async (): Promise<ExamSchedule[]> => {
  try {
    const { data, error } = await supabase
      .from('exam_schedules')
      .select('*')
      .order('exam_date', { ascending: true })

    if (error) {
      throw new Error(`시험 일정 조회 실패: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('시험 일정 조회 오류:', error)
    throw error
  }
}

// 특정 연도의 시험 일정 조회
export const getExamSchedulesByYear = async (year: number): Promise<ExamSchedule[]> => {
  try {
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const { data, error } = await supabase
      .from('exam_schedules')
      .select('*')
      .gte('exam_date', startDate)
      .lte('exam_date', endDate)
      .order('exam_date', { ascending: true })

    if (error) {
      throw new Error(`${year}년 시험 일정 조회 실패: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error(`${year}년 시험 일정 조회 오류:`, error)
    throw error
  }
}

// 다가오는 시험 일정 조회
export const getUpcomingExamSchedules = async (): Promise<ExamSchedule[]> => {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('exam_schedules')
      .select('*')
      .gte('exam_date', today)
      .order('exam_date', { ascending: true })
      .limit(5)

    if (error) {
      throw new Error(`다가오는 시험 일정 조회 실패: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('다가오는 시험 일정 조회 오류:', error)
    throw error
  }
}

// 시험 일정 수정
export const updateExamSchedule = async (id: string, scheduleData: Partial<ExamScheduleInput>): Promise<ExamSchedule> => {
  try {
    const { data, error } = await supabase
      .from('exam_schedules')
      .update({
        ...scheduleData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`시험 일정 수정 실패: ${error.message}`)
    }

    return data as ExamSchedule
  } catch (error) {
    console.error('시험 일정 수정 오류:', error)
    throw error
  }
}

// 시험 일정 삭제
export const deleteExamSchedule = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('exam_schedules')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`시험 일정 삭제 실패: ${error.message}`)
    }
  } catch (error) {
    console.error('시험 일정 삭제 오류:', error)
    throw error
  }
}

// 시험 일정 통계
export const getExamScheduleStats = async (): Promise<{
  totalSchedules: number
  upcomingSchedules: number
  thisYearSchedules: number
  registrationOpen: number
}> => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const currentYear = new Date().getFullYear()
    const yearStart = `${currentYear}-01-01`
    const yearEnd = `${currentYear}-12-31`

    const [totalResult, upcomingResult, thisYearResult, registrationResult] = await Promise.all([
      // 전체 일정 수
      supabase
        .from('exam_schedules')
        .select('id', { count: 'exact', head: true }),

      // 다가오는 일정 수
      supabase
        .from('exam_schedules')
        .select('id', { count: 'exact', head: true })
        .gte('exam_date', today),

      // 올해 일정 수
      supabase
        .from('exam_schedules')
        .select('id', { count: 'exact', head: true })
        .gte('exam_date', yearStart)
        .lte('exam_date', yearEnd),

      // 접수 중인 일정 수
      supabase
        .from('exam_schedules')
        .select('id', { count: 'exact', head: true })
        .lte('registration_start', today)
        .gte('registration_end', today)
    ])

    return {
      totalSchedules: totalResult.count || 0,
      upcomingSchedules: upcomingResult.count || 0,
      thisYearSchedules: thisYearResult.count || 0,
      registrationOpen: registrationResult.count || 0
    }
  } catch (error) {
    console.error('시험 일정 통계 조회 오류:', error)
    throw error
  }
}

// 날짜 포맷팅 유틸리티
export const formatExamDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  })
}

// D-Day 계산 유틸리티
export const calculateDDay = (examDate: string): string => {
  const today = new Date()
  const exam = new Date(examDate)
  const diffTime = exam.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays > 0) {
    return `D-${diffDays}`
  } else if (diffDays === 0) {
    return 'D-Day'
  } else {
    return `D+${Math.abs(diffDays)}`
  }
}

// 접수 기간 상태 확인
export const getRegistrationStatus = (registrationStart: string, registrationEnd: string): {
  status: 'upcoming' | 'open' | 'closed'
  text: string
  color: string
} => {
  const today = new Date().toISOString().split('T')[0]

  if (today < registrationStart) {
    return {
      status: 'upcoming',
      text: '접수 예정',
      color: 'text-blue-600 bg-blue-100'
    }
  } else if (today >= registrationStart && today <= registrationEnd) {
    return {
      status: 'open',
      text: '접수 중',
      color: 'text-green-600 bg-green-100'
    }
  } else {
    return {
      status: 'closed',
      text: '접수 마감',
      color: 'text-red-600 bg-red-100'
    }
  }
}