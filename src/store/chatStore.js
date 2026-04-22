import { create } from 'zustand'

export const useChatStore = create((set) => ({
  messages: [],
  loading: false,
  streamingContent: '',

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setMessages: (messages) => set({ messages }),
  setLoading: (loading) => set({ loading }),
  setStreamingContent: (content) => set({ streamingContent: content }),
  clearStreaming: () => set({ streamingContent: '' }),

  finalizeStreamingMessage: () =>
    set((state) => {
      if (!state.streamingContent) return state
      return {
        messages: [
          ...state.messages,
          { role: 'assistant', content: state.streamingContent },
        ],
        streamingContent: '',
      }
    }),

  editMessage: (index, newContent) =>
    set((state) => {
      const messages = [...state.messages]
      messages[index] = { ...messages[index], content: newContent }
      return { messages }
    }),

  truncateFrom: (index) =>
    set((state) => ({
      messages: state.messages.slice(0, index),
    })),

  clearMessages: () => set({ messages: [], streamingContent: '' }),
}))