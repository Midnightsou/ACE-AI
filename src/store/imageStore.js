import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useImageStore = create(
  persist(
    (set) => ({
      messages: [],
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'image-creator-storage',
      partialize: (state) => ({ messages: state.messages.slice(-10) }),
    }
  )
)