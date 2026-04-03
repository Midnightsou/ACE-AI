import { create } from 'zustand'

export const useConversationStore = create((set) => ({
  conversations: [],
  activeConversationId: null,

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  setActiveConversationId: (id) => set({ activeConversationId: id }),

  updateConversationTitle: (id, title) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, title } : c
      ),
    })),

  bringToTop: (id) =>
    set((state) => {
      const convo = state.conversations.find((c) => c.id === id)
      if (!convo) return state
      return {
        conversations: [
          convo,
          ...state.conversations.filter((c) => c.id !== id),
        ],
      }
    }),

  clearConversations: () =>
    set({ conversations: [], activeConversationId: null }),
}))