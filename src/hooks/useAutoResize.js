import { useEffect } from 'react'

export function useAutoResize(ref, value) {
  useEffect(() => {
    if (!ref.current) return
    ref.current.style.height = 'auto'
    ref.current.style.height = `${ref.current.scrollHeight}px`
  }, [ref, value])
}
