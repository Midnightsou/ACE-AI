import { create } from 'zustand'

export const useUserStore = create((set) => ({
  user: null,

  setUser: (user) => set({ user }),

  clearUser: () => set({ user: null }),

  updateProfile: (profileUpdates) =>
    set((state) => {
      if (!state.user) return state
      return {
        user: {
          ...state.user,
          profile: {
            ...state.user.profile,
            ...profileUpdates,
          },
        },
      }
    }),
}))