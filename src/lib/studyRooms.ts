import { supabase } from './supabase'

export interface StudyRoom {
  id: string
  user_id: string
  name: string
  description?: string
  goal: string
  subject: string
  category: string
  goal_type: 'certification' | 'skill_improvement'
  status: 'active' | 'completed' | 'archived'
  ai_context: any
  settings: {
    difficulty_level: string
    learning_style: string
  }
  created_at: string
  updated_at: string
}

export interface CreateStudyRoomData {
  name: string
  description?: string
  goal: string
  subject: string
  category?: string
  goal_type?: 'certification' | 'skill_improvement'
}

// 사용자의 스터디 룸 목록 조회
export const getStudyRooms = async (userId: string) => {
  const { data, error } = await supabase
    .from('study_rooms')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching study rooms:', error)
    throw error
  }

  return data as StudyRoom[]
}

// 새 스터디 룸 생성
export const createStudyRoom = async (userId: string, roomData: CreateStudyRoomData) => {
  const { data, error } = await supabase
    .from('study_rooms')
    .insert({
      user_id: userId,
      name: roomData.name,
      description: roomData.description,
      goal: roomData.goal,
      subject: roomData.subject,
      category: roomData.category || '',
      goal_type: roomData.goal_type || 'certification',
      status: 'active',
      ai_context: {},
      settings: {
        difficulty_level: 'intermediate',
        learning_style: 'balanced'
      }
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating study room:', error)
    throw error
  }

  return data as StudyRoom
}

// 스터디 룸 정보 조회
export const getStudyRoom = async (roomId: string) => {
  const { data, error } = await supabase
    .from('study_rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (error) {
    console.error('Error fetching study room:', error)
    throw error
  }

  return data as StudyRoom
}

// 스터디 룸 정보 수정
export const updateStudyRoom = async (roomId: string, updates: Partial<StudyRoom>) => {
  const { data, error } = await supabase
    .from('study_rooms')
    .update(updates)
    .eq('id', roomId)
    .select()
    .single()

  if (error) {
    console.error('Error updating study room:', error)
    throw error
  }

  return data as StudyRoom
}

// 스터디 룸 삭제
export const deleteStudyRoom = async (roomId: string) => {
  const { error } = await supabase
    .from('study_rooms')
    .delete()
    .eq('id', roomId)

  if (error) {
    console.error('Error deleting study room:', error)
    throw error
  }

  return true
}

// 스터디 룸 상태 변경
export const updateStudyRoomStatus = async (roomId: string, status: 'active' | 'completed' | 'archived') => {
  const { data, error } = await supabase
    .from('study_rooms')
    .update({ status })
    .eq('id', roomId)
    .select()
    .single()

  if (error) {
    console.error('Error updating study room status:', error)
    throw error
  }

  return data as StudyRoom
}