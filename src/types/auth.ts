export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  user_id: string
  full_name: string
  avatar_url?: string
  bio?: string
  learning_preferences?: {
    difficulty_level: 'beginner' | 'intermediate' | 'advanced'
    study_hours_per_day?: number
    preferred_study_time?: 'morning' | 'afternoon' | 'evening' | 'night'
    reminder_enabled: boolean
  }
  stats: {
    total_study_hours: number
    completed_courses: number
    current_streak: number
    total_points: number
  }
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignUpCredentials {
  email: string
  password: string
  full_name: string
}

export interface AuthError {
  message: string
  status?: number
}