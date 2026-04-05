import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

export async function saveDrillResult(uid, subject, result) {
  const ref = doc(db, 'students', uid, 'drills', subject)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    await setDoc(ref, {
      subject,
      totalQuestions: 1,
      correct: result.correct ? 1 : 0,
      wrong: result.correct ? 0 : 1,
      history: [result],
      lastDrilled: new Date().toISOString(),
    })
    return
  }

  const data = snap.data()
  await updateDoc(ref, {
    totalQuestions: data.totalQuestions + 1,
    correct: data.correct + (result.correct ? 1 : 0),
    wrong: data.wrong + (result.correct ? 0 : 1),
    history: [...(data.history || []).slice(-49), result],
    lastDrilled: new Date().toISOString(),
  })
}

export async function getDrillStats(uid, subject) {
  const ref = doc(db, 'students', uid, 'drills', subject)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data()
}

export async function getAllDrillStats(uid) {
  const subjects = [
    'Mathematics', 'English', 'Physics',
    'Chemistry', 'Biology', 'Economics',
    'Government', 'Literature', 'Geography'
  ]

  const results = await Promise.all(
    subjects.map(async (subject) => {
      const stats = await getDrillStats(uid, subject)
      return { subject, stats }
    })
  )

  return results.filter((r) => r.stats !== null)
}

export function calculateReadiness(stats) {
  if (!stats || stats.totalQuestions < 1) return 0
  const score = (stats.correct / stats.totalQuestions) * 100
  return Math.round(score)
}