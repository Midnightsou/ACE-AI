import { create } from 'zustand'

export const useUserStore = create((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),

  setLoading: (loading) => set({ loading }),

  clearUser: () =>
    set({
      user: null,
      loading: false,
    }),
}))