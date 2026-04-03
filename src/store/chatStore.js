import { create } from 'zustand'

export const useChatStore = create((set, get) => ({
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

  // Called when streaming is done — finalizes the message
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

  clearMessages: () => set({ messages: [], streamingContent: '' }),
}))