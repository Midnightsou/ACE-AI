import { create } from 'zustand'

export const useToolHistoryStore = create((set, get) => ({
  histories: {},
  loading: {},

  setHistory: (toolId, outputs) =>
    set((state) => ({
      histories: { ...state.histories, [toolId]: outputs },
    })),

  addOutput: (toolId, output) =>
    set((state) => {
      const existing = state.histories[toolId] || []
      return {
        histories: {
          ...state.histories,
          [toolId]: [output, ...existing],
        },
      }
    }),

  removeOutput: (toolId, outputId) =>
    set((state) => {
      const existing = state.histories[toolId] || []
      return {
        histories: {
          ...state.histories,
          [toolId]: existing.filter((o) => o.id !== outputId),
        },
      }
    }),

  setLoading: (toolId, value) =>
    set((state) => ({
      loading: { ...state.loading, [toolId]: value },
    })),

  getHistory: (toolId) => get().histories[toolId] || [],
  isLoading: (toolId) => get().loading[toolId] || false,
}))