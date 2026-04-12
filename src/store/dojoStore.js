import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useDojoStore = create(
  persist(
    (set, get) => ({
      sources: [],
      messages: [],
      activeTab: 'chat',
      sessionId: null,
      podcastScript: null,
      podcastAudio: null,
      generatedContent: {},

      addSource: (source) =>
        set((state) => ({
          sources: [...state.sources, source],
        })),

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
        set((state) => ({
          messages: [...state.messages, message],
        })),

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
        podcastAudio: null,
        generatedContent: {},
      }),
    }),
    {
      name: 'dojo-storage',
      partialize: (state) => ({
        sources: state.sources.map((s) => ({
          ...s,
          // Don't persist large content in localStorage
          // just keep metadata + first 500 chars as preview
          content: s.content?.slice(0, 500) || '',
          fullContent: undefined,
        })),
        messages: state.messages.slice(-20),
        activeTab: state.activeTab,
        generatedContent: state.generatedContent,
        podcastScript: state.podcastScript,
      }),
    }
  )
)