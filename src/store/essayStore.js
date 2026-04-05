import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useEssayStore = create(
  persist(
    (set) => ({
      form: {
        topic: '',
        essayType: 'Argumentative',
        academicLevel: 'Undergraduate',
        wordCount: '1000',
        citationStyle: 'APA',
        instructions: '',
      },
      outline: '',
      essay: '',
      liveEssay: '',
      stage: 'input', // 'input' | 'outline' | 'essay'

      setForm: (form) => set({ form }),
      updateForm: (field, value) =>
        set((state) => ({ form: { ...state.form, [field]: value } })),
      setOutline: (outline) => set({ outline }),
      setEssay: (essay) => set({ essay }),
      setLiveEssay: (liveEssay) => set({ liveEssay }),
      setStage: (stage) => set({ stage }),
      reset: () => set({
        form: {
          topic: '',
          essayType: 'Argumentative',
          academicLevel: 'Undergraduate',
          wordCount: '1000',
          citationStyle: 'APA',
          instructions: '',
        },
        outline: '',
        essay: '',
        liveEssay: '',
        stage: 'input',
      }),
    }),
    { name: 'essay-writer-storage' }
  )
)