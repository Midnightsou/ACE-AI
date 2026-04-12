import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useEmailStore = create(
  persist(
    (set) => ({
      form: {
        purpose: '',
        recipientType: 'Colleague',
        senderName: '',
        recipientName: '',
        company: '',
        tone: 'professional',
        length: 'medium',
        keyPoints: '',
        context: '',
      },
      output: '',
      liveOutput: '',

      updateForm: (field, value) =>
        set((state) => ({ form: { ...state.form, [field]: value } })),
      setOutput: (output) => set({ output }),
      setLiveOutput: (liveOutput) => set({ liveOutput }),
      reset: () => set({
        form: {
          purpose: '',
          recipientType: 'Colleague',
          senderName: '',
          recipientName: '',
          company: '',
          tone: 'professional',
          length: 'medium',
          keyPoints: '',
          context: '',
        },
        output: '',
        liveOutput: '',
      }),
    }),
    { name: 'email-composer-storage' }
  )
)