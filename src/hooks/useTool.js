import { useCallback, useState } from 'react'
import { useUserStore } from '../store/userStore'
import { useToolHistoryStore } from '../store/toolHistoryStore'
import {
  saveToolOutput,
  loadToolHistory,
  deleteToolOutput,
  saveToolSession,
} from '../services/toolHistory'
import { getToolById } from '../tools/registry'
import { streamCompletion, MODELS } from '../services/deepseekClient'

export function useTool(toolId) {
  const user = useUserStore((s) => s.user)

  const {
    addOutput,
    setHistory,
    setLoading,
    getHistory,
    removeOutput,
  } = useToolHistoryStore()

  const [output, setOutput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [loading, setLoadingLocal] = useState(false)
  const [error, setError] = useState(null)
  const [historyLoaded, setHistoryLoaded] = useState(false)

  const loadHistory = useCallback(async () => {
    if (!user?.uid || !toolId || historyLoaded) return

    setLoading(toolId, true)

    try {
      const history = await loadToolHistory(user.uid, toolId)

      setHistory(toolId, history)
      setHistoryLoaded(true)
    } catch (err) {
      console.error('Failed to load tool history:', err)
    } finally {
      setLoading(toolId, false)
    }
  }, [user?.uid, toolId, historyLoaded, setLoading, setHistory])

  async function generate(systemPrompt, userPrompt, metadata = {}) {
    setLoadingLocal(true)
    setStreaming(true)
    setOutput('')
    setError(null)

    try {
      const fullContent = await streamCompletion({
        model: MODELS.chat,

        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],

        temperature: 0.8,
        maxTokens: 4096,

        onChunk: (content) => {
          setOutput(content)
        },
      })

      // Save to Firestore
      if (user?.uid && fullContent) {
        const saved = await saveToolOutput(user.uid, toolId, {
          output: fullContent,
          ...metadata,
        })

        addOutput(toolId, {
          id: saved,
          output: fullContent,
          ...metadata,
          createdAt: new Date(),
        })

        const toolMeta = getToolById(toolId)

        if (toolMeta && user?.uid) {
          const preview = metadata?.fullName
            ? `${toolMeta.name} — ${metadata.fullName}`
            : metadata?.company
              ? `${toolMeta.name} — ${metadata.company}`
              : metadata?.topic
                ? `${toolMeta.name} — ${metadata.topic.slice(0, 40)}`
                : metadata?.targetRole
                  ? `${toolMeta.name} — ${metadata.targetRole}`
                  : toolMeta.name

          await saveToolSession(
            user.uid,
            toolId,
            toolMeta.name,
            preview,
            toolMeta.icon
          ).catch(() => {})
        }
      }

      return fullContent
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.')
      console.error('Tool error:', err)
      return null
    } finally {
      setLoadingLocal(false)
      setStreaming(false)
    }
  }

  async function deleteOutput(outputId) {
    if (!user?.uid) return

    try {
      await deleteToolOutput(user.uid, toolId, outputId)
      removeOutput(toolId, outputId)
    } catch (err) {
      console.error('Failed to delete output:', err)
    }
  }

  function reset() {
    setOutput('')
    setError(null)
  }

  return {
    output,
    streaming,
    loading,
    error,
    history: getHistory(toolId),
    generate,
    loadHistory,
    deleteOutput,
    reset,
  }
}
