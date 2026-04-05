import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCoverLetterStore = create(
  persist(
    (set) => ({
      step: 0,
      form: {
        fullName: '',
        email: '',
        phone: '',
        company: '',
        role: '',
        jobDescription: '',
        background: '',
        highlights: '',
        tone: 'Professional',
      },
      output: '',
      liveOutput: '',

      setStep: (step) => set({ step }),
      setForm: (form) => set({ form }),
      updateForm: (field, value) =>
        set((state) => ({ form: { ...state.form, [field]: value } })),
      setOutput: (output) => set({ output }),
      setLiveOutput: (liveOutput) => set({ liveOutput }),
      reset: () => set({
        step: 0,
        form: {
          fullName: '',
          email: '',
          phone: '',
          company: '',
          role: '',
          jobDescription: '',
          background: '',
          highlights: '',
          tone: 'Professional',
        },
        output: '',
        liveOutput: '',
      }),
    }),
    { name: 'cover-letter-storage' }
  )
)