import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { auth, db } from '../lib/supabase'
import type { AuthState, LoginCredentials, SignUpCredentials, User, Profile } from '../types/auth'

interface AuthStore extends AuthState {
  // Actions
  initialize: () => Promise<void>
  signIn: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>
  signUp: (credentials: SignUpCredentials) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>

  // Admin functions
  isAdmin: () => boolean
  checkAdminAccess: () => boolean

  // State setters
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      profile: null,
      loading: false,
      initialized: false,

      // Initialize auth state
      initialize: async () => {
        set({ loading: true })

        try {
          // Get current user
          const user = await auth.getCurrentUser()

          if (user) {
            // Get user profile
            const { data: profile, error } = await db.getProfile(user.id)

            if (!error && profile) {
              set({
                user: user as User,
                profile: profile as Profile,
                initialized: true,
                loading: false
              })
            } else {
              // Create profile if it doesn't exist
              const newProfile: Partial<Profile> = {
                user_id: user.id,
                full_name: user.user_metadata?.full_name || '',
                learning_preferences: {
                  difficulty_level: 'beginner',
                  reminder_enabled: true,
                },
                stats: {
                  total_study_hours: 0,
                  completed_courses: 0,
                  current_streak: 0,
                  total_points: 0,
                }
              }

              await db.updateProfile(user.id, newProfile)
              const { data: createdProfile } = await db.getProfile(user.id)

              set({
                user: user as User,
                profile: createdProfile as Profile,
                initialized: true,
                loading: false
              })
            }
          } else {
            set({ initialized: true, loading: false })
          }
        } catch (error) {
          console.error('Auth initialization error:', error)
          set({ initialized: true, loading: false })
        }

        // Set up auth state change listener
        auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_OUT') {
            set({ user: null, profile: null })
          } else if (event === 'SIGNED_IN' && session?.user) {
            const { data: profile } = await db.getProfile(session.user.id)
            set({
              user: session.user as User,
              profile: profile as Profile
            })
          }
        })
      },

      // Sign in
      signIn: async (credentials: LoginCredentials) => {
        set({ loading: true })

        try {
          const { data, error } = await auth.signIn(credentials.email, credentials.password)

          if (error) {
            set({ loading: false })
            return { success: false, error: error.message }
          }

          if (data.user) {
            const { data: profile } = await db.getProfile(data.user.id)
            set({
              user: data.user as User,
              profile: profile as Profile,
              loading: false
            })
          }

          return { success: true }
        } catch (error: any) {
          set({ loading: false })
          return { success: false, error: error.message }
        }
      },

      // Sign up
      signUp: async (credentials: SignUpCredentials) => {
        set({ loading: true })

        try {
          const { data, error } = await auth.signUp(
            credentials.email,
            credentials.password,
            { full_name: credentials.full_name }
          )

          if (error) {
            set({ loading: false })
            return { success: false, error: error.message }
          }

          // Profile will be created after email confirmation
          set({ loading: false })
          return { success: true }
        } catch (error: any) {
          set({ loading: false })
          return { success: false, error: error.message }
        }
      },

      // Sign out
      signOut: async () => {
        set({ loading: true })

        try {
          await auth.signOut()
          set({ user: null, profile: null, loading: false })
        } catch (error) {
          console.error('Sign out error:', error)
          set({ loading: false })
        }
      },

      // Update profile
      updateProfile: async (updates: Partial<Profile>) => {
        const { user, profile } = get()

        if (!user || !profile) {
          return { success: false, error: 'User not authenticated' }
        }

        set({ loading: true })

        try {
          const { error } = await db.updateProfile(user.id, updates)

          if (error) {
            set({ loading: false })
            return { success: false, error: error.message }
          }

          // Update local state
          set({
            profile: { ...profile, ...updates } as Profile,
            loading: false
          })

          return { success: true }
        } catch (error: any) {
          set({ loading: false })
          return { success: false, error: error.message }
        }
      },

      // Admin functions
      isAdmin: () => {
        const { user } = get()
        return user?.email === 'admin@test.com'
      },

      checkAdminAccess: () => {
        const { user, initialized } = get()
        return initialized && user?.email === 'admin@test.com'
      },

      // Setters
      setUser: (user: User | null) => set({ user }),
      setProfile: (profile: Profile | null) => set({ profile }),
      setLoading: (loading: boolean) => set({ loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile
      }),
    }
  )
)