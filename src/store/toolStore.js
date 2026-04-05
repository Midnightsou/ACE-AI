import { create } from 'zustand'

export const useToolStore = create((set) => ({
  activeTool: 'chat',
  toolOutputs: {},

  setActiveTool: (toolId) => set({ activeTool: toolId }),

  setToolOutput: (toolId, output) =>
    set((state) => ({
      toolOutputs: { ...state.toolOutputs, [toolId]: output },
    })),

  clearToolOutput: (toolId) =>
    set((state) => {
      const outputs = { ...state.toolOutputs }
      delete outputs[toolId]
      return { toolOutputs: outputs }
    }),
}))