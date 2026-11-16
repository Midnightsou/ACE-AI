import { create } from 'zustand'

function getStoredTheme() {
  return localStorage.getItem('ace-theme') || 'system'
}

function resolveTheme(theme) {
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme) {
  const resolvedTheme = resolveTheme(theme)
  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  return resolvedTheme
}

const initialTheme = getStoredTheme()
const initialResolvedTheme = applyTheme(initialTheme)

export const useThemeStore = create((set, get) => ({
  theme: initialTheme,
  resolvedTheme: initialResolvedTheme,
  setTheme: (theme) => {
    localStorage.setItem('ace-theme', theme)
    set({ theme, resolvedTheme: applyTheme(theme) })
  },
  toggleTheme: () => {
    const next = get().resolvedTheme === 'dark' ? 'light' : 'dark'
    get().setTheme(next)
  },
}))

if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { theme } = useThemeStore.getState()
    if (theme === 'system') {
      useThemeStore.setState({ resolvedTheme: applyTheme('system') })
    }
  })
}
