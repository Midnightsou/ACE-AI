import { useState, useEffect } from 'react'
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
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    if (!uid || !subject) return
    setLoadingHistory(true)

    loadMessages(uid, subject)
      .then((msgs) => setHistory(msgs))
      .catch((err) => console.error('Failed to load history:', err))
      .finally(() => setLoadingHistory(false))
  }, [uid, subject])

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
    persistMessage,
    checkLimit,
    trackMessage,
  }
}