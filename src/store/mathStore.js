import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useMathStore = create(
  persist(
    (set) => ({
      messages: [],
      streamingContent: '',

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      setMessages: (messages) => set({ messages }),
      setStreamingContent: (content) => set({ streamingContent: content }),
      clearMessages: () => set({ messages: [], streamingContent: '' }),
    }),
    { name: 'math-mode-storage' }
  )
)