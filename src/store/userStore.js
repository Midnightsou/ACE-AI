import { create } from 'zustand'

export const useUserStore = create((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({
    user,
  }),

  setLoading: (loading) => set({
    loading,
  }),

  clearUser: () => set({
    user: null,
    loading: false,
  }),

  updateProfile: (profile) =>
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            profile: {
              ...state.user.profile,
              ...profile,
            },
          }
        : null,
    })),
}))