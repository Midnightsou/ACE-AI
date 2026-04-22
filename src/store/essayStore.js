import { create } from 'zustand'

export const useEssayStore = create((set) => ({
  step: 0,
  form: {
    topic: '',
    essayType: 'Argumentative',
    academicLevel: 'Undergraduate',
    wordCount: '1000',
    citationStyle: 'APA',
    writingStyle: 'Academic',
    instructions: '',
  },
  outline: '',
  essay: '',
  liveEssay: '',
  generatingSection: '',
  stage: 'input',

  setStep: (step) => set({ step }),
  setForm: (form) => set({ form }),
  updateForm: (field, value) =>
    set((state) => ({ form: { ...state.form, [field]: value } })),
  setOutline: (outline) => set({ outline }),
  setEssay: (essay) => set({ essay }),
  setLiveEssay: (liveEssay) => set({ liveEssay }),
  setGeneratingSection: (s) => set({ generatingSection: s }),
  setStage: (stage) => set({ stage }),
  reset: () => set({
    step: 0,
    form: {
      topic: '',
      essayType: 'Argumentative',
      academicLevel: 'Undergraduate',
      wordCount: '1000',
      citationStyle: 'APA',
      writingStyle: 'Academic',
      instructions: '',
    },
    outline: '',
    essay: '',
    liveEssay: '',
    generatingSection: '',
    stage: 'input',
  }),
}))