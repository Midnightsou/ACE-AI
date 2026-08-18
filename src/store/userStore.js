import { create } from 'zustand'

export const useUserStore = create((set) => ({
  user: null,
  loading: true,
  initialized: false,

  setUser: (user) =>
    set({
      user,
      loading: false,
      initialized: true,
    }),

  setLoading: (loading) =>
    set({ loading }),

  clearUser: () =>
    set({
      user: null,
      loading: false,
      initialized: true,
    }),

  updateProfile: (profileUpdates) =>
    set((state) => {
      if (!state.user) return state

      return {
        user: {
          ...state.user,
          profile: {
            ...(state.user.profile || {}),
            ...profileUpdates,
          },
        },
      }
    }),
}))