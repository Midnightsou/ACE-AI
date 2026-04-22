import { create } from 'zustand'

export const useToolStore = create((set) => ({
  activeTool: 'chat',
  setActiveTool: (toolId) => set({ activeTool: toolId }),
}))