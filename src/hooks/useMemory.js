import { useState, useEffect, useCallback } from 'react'
import {
  loadMessages,
  saveMessage,
  updateCognitiveProfile,
  incrementMessageCount,
  getMessageCount,
} from '../services/memory'

const FREE_LIMIT = 10

export function useMemory(uid, subject) {
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const fetchHistory = useCallback(
    async (signal) => {
      if (!uid || !subject) return
      setLoadingHistory(true)
      try {
        const msgs = await loadMessages(uid, subject)
        if (!signal?.aborted) setHistory(msgs)
      } catch (err) {
        if (!signal?.aborted) console.error('Failed to load history:', err)
      } finally {
        if (!signal?.aborted) setLoadingHistory(false)
      }
    },
    [uid, subject]
  )

  useEffect(() => {
    const controller = new AbortController()
    fetchHistory(controller.signal)
    return () => controller.abort()
  }, [fetchHistory])

  async function persistMessage(message) {
    if (!uid || !subject) return
    try {
      await saveMessage(uid, subject, message)
    } catch (err) {
      console.error('Failed to save message:', err)
    }
  }

  async function checkLimit() {
    if (!uid) return true
    const count = await getMessageCount(uid)
    return count < FREE_LIMIT
  }

  async function trackMessage() {
    if (!uid) return
    await incrementMessageCount(uid)
    await updateCognitiveProfile(uid, subject, history)
  }

  return {
    history,
    loadingHistory,
    refetch: fetchHistory,
    persistMessage,
    checkLimit,
    trackMessage,
  }
}