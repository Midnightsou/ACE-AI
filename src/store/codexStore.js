import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCodexStore = create(
  persist(
    (set) => ({
      messages: [],
      sessionId: null,

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      setMessages: (messages) => set({ messages }),
      setSessionId: (sessionId) => set({ sessionId }),

      clearMessages: () => set({ messages: [], sessionId: null }),
    }),
    { name: 'codex-storage' }
  )
)