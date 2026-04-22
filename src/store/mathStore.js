import { create } from 'zustand'

export const useMathStore = create((set) => ({
  messages: [],
  streamingContent: '',
  sessionId: null,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
  setStreamingContent: (content) => set({ streamingContent: content }),
  setSessionId: (id) => set({ sessionId: id }),

  truncateFrom: (index) =>
    set((state) => ({ messages: state.messages.slice(0, index) })),

  clearMessages: () => set({ messages: [], streamingContent: '', sessionId: null }),
}))