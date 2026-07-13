import { useState, useEffect } from 'react'

export function useNetwork() {
  const [online, setOnline] = useState(navigator.onLine)
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    function handleOnline() { setOnline(true) }
    function handleOffline() { setOnline(false) }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Detect slow connection
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    if (connection) {
      const checkSpeed = () => {
        setSlow(
          connection.effectiveType === '2g' ||
          connection.effectiveType === 'slow-2g' ||
          connection.downlink < 0.5
        )
      }
      checkSpeed()
      connection.addEventListener('change', checkSpeed)
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
        connection.removeEventListener('change', checkSpeed)
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { online, slow }
}