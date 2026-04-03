import { create } from 'zustand'

export const useChatStore = create((set, get) => ({
  messages: [],
  loading: false,
  activeSubject: 'General',

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setLoading: (loading) => set({ loading }),

  setActiveSubject: (subject) =>
    set({ subject, messages: [] }),

  clearMessages: () => set({ messages: [] }),
}))