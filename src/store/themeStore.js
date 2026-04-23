import { create } from 'zustand'

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem('ace-theme') || 'light',
  setTheme: (theme) => {
    localStorage.setItem('ace-theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
    set({ theme })
  },
  toggleTheme: () => {
    const current = localStorage.getItem('ace-theme') || 'light'
    const next = current === 'light' ? 'dark' : 'light'
    localStorage.setItem('ace-theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    set({ theme: next })
  },
}))