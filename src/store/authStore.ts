import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session } from '@supabase/supabase-js'
import type { User, Organization } from '../types'
import supabase from '../api/supabase'

interface AuthState {
  session: Session | null
  user: User | null
  organization: Organization | null
  loading: boolean
  setSession: (session: Session | null) => void
  loadProfile: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      user: null,
      organization: null,
      loading: false,

      setSession: (session) => set({ session }),

      loadProfile: async () => {
        const { session } = get()
        if (!session?.user?.id) return
        set({ loading: true })
        try {
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('*, org:organizations(*)')
            .eq('id', session.user.id)
            .single()

          if (userError) throw userError

          set({ 
            user: user as unknown as User, 
            organization: (user.org as unknown as Organization) ?? null 
          })
        } catch (e) {
          console.error('Failed to load user profile', e)
        } finally {
          set({ loading: false })
        }
      },

      signOut: async () => {
        await supabase.auth.signOut()
        set({ session: null, user: null, organization: null })
      },
    }),
    {
      name: 'auth-store-v2',
      partialize: (state) => ({ session: state.session, user: state.user, organization: state.organization }),
    }
  )
)
