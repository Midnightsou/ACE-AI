import { useEffect } from 'react'

export function useAutoResize(ref, value) {
  useEffect(() => {
    if (!ref.current) return
    const maxHeight = 192
    ref.current.style.height = 'auto'
    ref.current.style.height = `${Math.min(ref.current.scrollHeight, maxHeight)}px`
    ref.current.style.overflowY = ref.current.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [ref, value])
}
