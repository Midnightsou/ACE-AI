import { useState } from 'react'
import { useUserStore } from '../store/userStore'
import { buildDrillPrompt, buildEvaluationPrompt, parseDrillQuestion, parseEvaluation } from '../prompts/drillPrompt'
import { saveDrillResult } from '../services/drill'

const BASE_URL = 'https://api.featherless.ai/v1/chat/completions'

async function callAI(prompt, apiKey) {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-ai/DeepSeek-V3.2',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1024,
      stream: false,
    }),
  })

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

export function useDrill() {
  const user = useUserStore((s) => s.user)
  const apiKey = import.meta.env.VITE_FEATHERLESS_API_KEY

  const [subject, setSubject] = useState('Mathematics')
  const [question, setQuestion] = useState(null)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [evaluation, setEvaluation] = useState(null)
  const [loadingQuestion, setLoadingQuestion] = useState(false)
  const [loadingEval, setLoadingEval] = useState(false)
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0, total: 0 })

  async function generateQuestion() {
    setLoadingQuestion(true)
    setQuestion(null)
    setSelectedAnswer(null)
    setEvaluation(null)

    try {
      const prompt = buildDrillPrompt(subject)
      const raw = await callAI(prompt, apiKey)
      const parsed = parseDrillQuestion(raw)
      setQuestion(parsed)
    } catch (err) {
      console.error('Failed to generate question:', err)
    } finally {
      setLoadingQuestion(false)
    }
  }

  async function submitAnswer(answer) {
    if (!question || loadingEval) return
    setSelectedAnswer(answer)
    setLoadingEval(true)

    try {
      const prompt = buildEvaluationPrompt(
        question.question,
        `${question.answer}: ${question[question.answer?.toLowerCase()]}`,
        `${answer}: ${question[answer?.toLowerCase()]}`
      )

      const raw = await callAI(prompt, apiKey)
      const parsed = parseEvaluation(raw)
      setEvaluation(parsed)

      // Save to Firestore
      await saveDrillResult(user.uid, subject, {
        question: question.question,
        correct: parsed.correct,
        studentAnswer: answer,
        correctAnswer: question.answer,
        timestamp: new Date().toISOString(),
      })

      // Update session stats
      setSessionStats((prev) => ({
        correct: prev.correct + (parsed.correct ? 1 : 0),
        wrong: prev.wrong + (parsed.correct ? 0 : 1),
        total: prev.total + 1,
      }))

    } catch (err) {
      console.error('Failed to evaluate answer:', err)
    } finally {
      setLoadingEval(false)
    }
  }

  function resetSession() {
    setQuestion(null)
    setSelectedAnswer(null)
    setEvaluation(null)
    setSessionStats({ correct: 0, wrong: 0, total: 0 })
  }

  return {
    subject,
    setSubject,
    question,
    selectedAnswer,
    evaluation,
    loadingQuestion,
    loadingEval,
    sessionStats,
    generateQuestion,
    submitAnswer,
    resetSession,
  }
}