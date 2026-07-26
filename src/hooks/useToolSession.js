import { useState, useCallback } from 'react'
import { useUserStore } from '../store/userStore'
import {
  createToolSession,
  saveToolSessionState,
  loadToolSessionState,
  invalidateConversationCache,
} from '../services/memory'

export function useToolSession(toolId, toolName, icon) {
  const user = useUserStore((s) => s.user)
  const [sessionId, setSessionId] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(false)

  // Call this when output is first generated — creates session if needed
  async function saveSession(state, title) {
    if (!user?.uid) return null

    try {
      let currentId = sessionId

      if (!currentId) {
        currentId = await createToolSession(
          user.uid, toolId, toolName, icon, title
        )
        setSessionId(currentId)
        invalidateConversationCache(user.uid)
      }

      await saveToolSessionState(user.uid, currentId, state)
      return currentId
    } catch (err) {
      console.error('Failed to save tool session:', err)
      return null
    }
  }

  // Call this to update an existing session (after chat refinement etc)
  async function updateSession(state) {
    if (!user?.uid || !sessionId) return
    try {
      await saveToolSessionState(user.uid, sessionId, state)
    } catch (err) {
      console.error('Failed to update tool session:', err)
    }
  }

  // Call this when user clicks a recent session
  async function loadSession(sid) {
    if (!user?.uid || !sid) return null
    setSessionLoading(true)
    try {
      const state = await loadToolSessionState(user.uid, sid)
      setSessionId(sid)
      return state
    } catch (err) {
      console.error('Failed to load tool session:', err)
      return null
    } finally {
      setSessionLoading(false)
    }
  }

  function resetSession() {
    setSessionId(null)
  }

  return {
    sessionId,
    sessionLoading,
    saveSession,
    updateSession,
    loadSession,
    resetSession,
  }
}