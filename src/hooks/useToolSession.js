import { useState } from 'react'
import LZString from 'lz-string'
import { useUserStore } from '../store/userStore'
import {
  createFormToolSession,
  updateFormToolSession,
  loadFormToolSession,
} from '../services/memory'

const LARGE_TEXT_FIELDS = ['output', 'essay', 'analysisOutput', 'liveCV', 'outline', 'liveOutput']
const DOC_FIELDS = ['cvText', 'jobDescription', 'fileContent', 'pdfText', 'extractedText']

function compress(state) {
  const result = { ...state }

  // Compress large AI output fields
  LARGE_TEXT_FIELDS.forEach((field) => {
    if (result[field] && result[field].length > 500) {
      result[field] = '__lz__' + LZString.compressToBase64(result[field])
    }
  })

  // Strip document inputs — user can re-upload, no need to store
  if (result.form) {
    result.form = { ...result.form }
    DOC_FIELDS.forEach((f) => {
      if (result.form[f] && result.form[f].length > 200) {
        result.form[f] = ''
      }
    })
  }

  return result
}

function decompress(state) {
  if (!state) return state
  const result = { ...state }

  LARGE_TEXT_FIELDS.forEach((field) => {
    if (typeof result[field] === 'string' && result[field].startsWith('__lz__')) {
      try {
        result[field] = LZString.decompressFromBase64(result[field].slice(6))
      } catch {
        result[field] = null
      }
    }
  })

  return result
}

export function useToolSession(toolId, toolName, icon) {
  const user = useUserStore((s) => s.user)
  const [sessionId, setSessionId] = useState(null)
  const [restoring, setRestoring] = useState(false)

  async function saveSession(state, title) {
    if (!user?.uid) return null
    try {
      const compressed = compress(state)
      if (!sessionId) {
        const newId = await createFormToolSession(user.uid, toolId, toolName, icon, title)
        setSessionId(newId)
        await updateFormToolSession(user.uid, newId, title, compressed)
        return newId
      }
      await updateFormToolSession(user.uid, sessionId, title, compressed)
      return sessionId
    } catch (err) {
      console.error('saveSession error:', err)
      return null
    }
  }

  async function loadSession(sid) {
    if (!user?.uid || !sid) return null
    setRestoring(true)
    try {
      const raw = await loadFormToolSession(user.uid, sid)
      const state = decompress(raw)
      if (state) setSessionId(sid)
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
  }

  return { sessionId, restoring, saveSession, loadSession, resetSession }
}