import { useState } from 'react'
import { useUserStore } from '../store/userStore'
import {
  createFormToolSession,
  updateFormToolSession,
  loadFormToolSession,
} from '../services/memory'
import { saveLargeContent, loadLargeContent } from '../services/storageServices'

// Fields that might contain large content — store in Firebase Storage, not Firestore
const LARGE_FIELDS = ['output', 'essay', 'analysisOutput', 'liveCV', 'outline']

// Document fields in form — always strip from Firestore
const DOC_FIELDS = ['cvText', 'jobDescription', 'fileContent']

export function useToolSession(toolId, toolName, icon) {
  const user = useUserStore((s) => s.user)
  const [sessionId, setSessionId] = useState(null)
  const [restoring, setRestoring] = useState(false)
  const [documentStripped, setDocumentStripped] = useState(false)

  async function saveSession(state, title) {
    if (!user?.uid) return null

    try {
      let currentId = sessionId
      if (!currentId) {
        currentId = await createFormToolSession(user.uid, toolId, toolName, icon, title)
        setSessionId(currentId)
      }

      // Separate large content from metadata
      const largeFields = {}
      const safeState = { ...state }

      for (const field of LARGE_FIELDS) {
        if (safeState[field] && safeState[field].length > 2000) {
          // Save to Firebase Storage
          const url = await saveLargeContent(user.uid, currentId, field, safeState[field])
          largeFields[`${field}_url`] = url
          // Keep a preview in Firestore
          safeState[field] = safeState[field].slice(0, 200) + '...[stored]'
        }
      }

      // Strip document content from form
      if (safeState.form) {
        safeState.form = { ...safeState.form }
        DOC_FIELDS.forEach((f) => {
          if (safeState.form[f] && safeState.form[f].length > 500) {
            safeState.form[f] = '[document_stripped]'
          }
        })
      }

      await updateFormToolSession(user.uid, currentId, title, {
        ...safeState,
        ...largeFields, // Store URLs in Firestore
      })

      return currentId
    } catch (err) {
      console.error('saveSession error:', err)
      return null
    }
  }

  async function loadSession(sid) {
    if (!user?.uid || !sid) return null
    setRestoring(true)

    try {
      const state = await loadFormToolSession(user.uid, sid)
      if (!state) return null

      setSessionId(sid)

      // Check if any content was stored in Storage
      let hasStripped = false

      // Load large content from Storage URLs
      for (const field of LARGE_FIELDS) {
        const urlKey = `${field}_url`
        if (state[urlKey]) {
          try {
            state[field] = await loadLargeContent(state[urlKey])
            hasStripped = true
          } catch {
            state[field] = null
          }
        }
      }

      // Also check for stripped document fields
      const stateStr = JSON.stringify(state)
      if (stateStr.includes('[document_stripped]')) hasStripped = true

      if (hasStripped) setDocumentStripped(true)

      return state
    } catch (err) {
      console.error('loadSession error:', err)
      return null
    } finally {
      setRestoring(false)
    }
  }

  function resetSession() {
    setSessionId(null)
    setDocumentStripped(false)
  }

  return {
    sessionId, restoring, documentStripped,
    saveSession, loadSession, resetSession,
  }
}