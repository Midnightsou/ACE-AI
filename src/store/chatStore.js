import { create } from 'zustand'

export const useChatStore = create((set) => ({
  messages: [],
  loading: false,
  streamingContent: '',
  restoredConvId: null, // tracks which conversation is loaded

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
  setLoading: (loading) => set({ loading }),
  setStreamingContent: (content) => set({ streamingContent: content }),
  setRestoredConvId: (id) => set({ restoredConvId: id }),

  editMessage: (index, newContent) =>
    set((state) => {
      const messages = [...state.messages]
      messages[index] = { ...messages[index], content: newContent }
      return { messages }
    }),

  truncateFrom: (index) =>
    set((state) => ({ messages: state.messages.slice(0, index) })),

  clearMessages: () => set({ messages: [], streamingContent: '', restoredConvId: null }),
}))