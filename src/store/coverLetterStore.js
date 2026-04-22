import { create } from 'zustand'

export const useCoverLetterStore = create((set) => ({
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
}))