import { create } from 'zustand'

export const useDojoStore = create((set, get) => ({
  sources: [],
  messages: [],
  activeTab: 'chat',
  sessionId: null,
  podcastScript: null,
  generatedContent: {},

  addSource: (source) =>
    set((state) => ({ sources: [...state.sources, source] })),

  removeSource: (id) =>
    set((state) => ({
      sources: state.sources.filter((s) => s.id !== id),
    })),

  updateSource: (id, updates) =>
    set((state) => ({
      sources: state.sources.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),

  clearSources: () => set({ sources: [] }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setMessages: (messages) => set({ messages }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSessionId: (id) => set({ sessionId: id }),
  setPodcastScript: (script) => set({ podcastScript: script }),

  setGeneratedContent: (key, content) =>
    set((state) => ({
      generatedContent: { ...state.generatedContent, [key]: content },
    })),

  clearSession: () => set({
    sources: [],
    messages: [],
    activeTab: 'chat',
    sessionId: null,
    podcastScript: null,
    generatedContent: {},
  }),
}))