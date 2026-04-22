import { create } from 'zustand'

export const useCodexStore = create((set) => ({
  messages: [],
  sessionId: null,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
  setSessionId: (sessionId) => set({ sessionId }),

  truncateFrom: (index) =>
    set((state) => ({ messages: state.messages.slice(0, index) })),

  clearMessages: () => set({ messages: [], sessionId: null }),
}))