import { create } from 'zustand'
import { defaultStyle } from '../tools/cvStyles'

export const useCVMakerStore = create((set) => ({
  step: 0,
  form: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    targetRole: '',
    summary: '',
    experience: '',
    education: '',
    skills: '',
    certifications: '',
    additional: '',
  },
  style: defaultStyle,
  output: '',
  liveCV: '',

  setStep: (step) => set({ step }),
  setForm: (form) => set({ form }),
  updateForm: (field, value) =>
    set((state) => ({ form: { ...state.form, [field]: value } })),
  setStyle: (style) => set({ style }),
  setOutput: (output) => set({ output }),
  setLiveCV: (liveCV) => set({ liveCV }),
  reset: () => set({
    step: 0,
    form: {
      fullName: '', email: '', phone: '', location: '',
      linkedin: '', targetRole: '', summary: '', experience: '',
      education: '', skills: '', certifications: '', additional: '',
    },
    style: defaultStyle,
    output: '',
    liveCV: '',
  }),
}))

export const useCVAnalyserStore = create((set) => ({
  step: 0,
  form: {
    cvText: '',
    jobDescription: '',
    targetRole: '',
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
  },
  style: defaultStyle,
  output: '',
  analysisOutput: '',
  liveCV: '',
  mode: null,
  fileName: '',

  setStep: (step) => set({ step }),
  setForm: (form) => set({ form }),
  updateForm: (field, value) =>
    set((state) => ({ form: { ...state.form, [field]: value } })),
  setStyle: (style) => set({ style }),
  setOutput: (output) => set({ output }),
  setAnalysisOutput: (analysisOutput) => set({ analysisOutput }),
  setLiveCV: (liveCV) => set({ liveCV }),
  setMode: (mode) => set({ mode }),
  setFileName: (fileName) => set({ fileName }),
  reset: () => set({
    step: 0,
    form: {
      cvText: '', jobDescription: '', targetRole: '',
      fullName: '', email: '', phone: '', location: '', linkedin: '',
    },
    style: defaultStyle,
    output: '',
    analysisOutput: '',
    liveCV: '',
    mode: null,
    fileName: '',
  }),
}))