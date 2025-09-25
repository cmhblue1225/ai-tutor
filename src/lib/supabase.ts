import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// 인증 관련 헬퍼 함수들
export const auth = {
  signUp: async (email: string, password: string, userData?: Record<string, any>) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    })
  },

  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    })
  },

  signOut: async () => {
    return await supabase.auth.signOut()
  },

  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  },
}

// 데이터베이스 헬퍼 함수들
export const db = {
  // 프로필 관련
  getProfile: async (userId: string) => {
    return await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
  },

  updateProfile: async (userId: string, updates: Record<string, any>) => {
    return await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
  },

  // 스터디 룸 관련
  getStudyRooms: async (userId: string) => {
    return await supabase
      .from('study_rooms')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  },

  createStudyRoom: async (roomData: Record<string, any>) => {
    return await supabase
      .from('study_rooms')
      .insert(roomData)
      .select()
      .single()
  },

  // 대화 관련
  getConversations: async (roomId: string) => {
    return await supabase
      .from('conversations')
      .select('*')
      .eq('study_room_id', roomId)
      .order('created_at', { ascending: true })
  },

  addMessage: async (messageData: Record<string, any>) => {
    return await supabase
      .from('conversations')
      .insert(messageData)
      .select()
      .single()
  },
}

// 실시간 구독 헬퍼 함수들
export const realtime = {
  subscribeToStudyRoom: (roomId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`study_room_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `study_room_id=eq.${roomId}`,
        },
        callback
      )
      .subscribe()
  },

  subscribeToUserProgress: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`user_progress_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'progress_tracking',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe()
  },
}

export default supabase