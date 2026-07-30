import { useState } from 'react'
import { useUserStore } from '../store/userStore'
import {
  createFormToolSession,
  updateFormToolSession,
  loadFormToolSession,
  invalidateConversationCache,
} from '../services/memory'

// Fields that contain large document content — never save these
const LARGE_CONTENT_FIELDS = [
  'cvText', 'jobDescription', 'fileContent', 'documentText',
  'content', 'fullContent', 'extractedText', 'pdfText',
]

function stripLargeContent(state) {
  if (!state) return state

  const stripped = { ...state }

  // Strip from top-level
  LARGE_CONTENT_FIELDS.forEach((field) => {
    if (stripped[field]) {
      stripped[field] = '[document_stripped]'
    }
  })

  // Strip from nested form object
  if (stripped.form) {
    stripped.form = { ...stripped.form }
    LARGE_CONTENT_FIELDS.forEach((field) => {
      if (stripped.form[field] && stripped.form[field].length > 500) {
        stripped.form[field] = '[document_stripped]'
      }
    })
  }

  // Truncate very long outputs to 5000 chars (enough to display)
  if (stripped.output && stripped.output.length > 5000) {
    stripped.output = stripped.output.slice(0, 5000) + '\n\n[truncated — full version was longer]'
  }
  if (stripped.liveCV && stripped.liveCV.length > 5000) {
    stripped.liveCV = stripped.liveCV.slice(0, 5000)
  }
  if (stripped.essay && stripped.essay.length > 8000) {
    stripped.essay = stripped.essay.slice(0, 8000) + '\n\n[truncated]'
  }
  if (stripped.analysisOutput && stripped.analysisOutput.length > 5000) {
    stripped.analysisOutput = stripped.analysisOutput.slice(0, 5000)
  }

  return stripped
}

export function useToolSession(toolId, toolName, icon) {
  const user = useUserStore((s) => s.user)
  const [sessionId, setSessionId] = useState(null)
  const [restoring, setRestoring] = useState(false)
  const [documentStripped, setDocumentStripped] = useState(false)

  async function saveSession(state, title) {
    if (!user?.uid) return null

    // Strip large document content before saving
    const safeState = stripLargeContent(state)

    try {
      if (!sessionId) {
        const newId = await createFormToolSession(
          user.uid, toolId, toolName, icon, title
        )
        setSessionId(newId)
        await updateFormToolSession(user.uid, newId, title, safeState)
        return newId
      } else {
        await updateFormToolSession(user.uid, sessionId, title, safeState)
        return sessionId
      }
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
      if (state) {
        setSessionId(sid)
        // Check if document content was stripped
        const hasStripped = JSON.stringify(state).includes('[document_stripped]')
        if (hasStripped) setDocumentStripped(true)
      }
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