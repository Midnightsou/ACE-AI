import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

export async function updateStreak(uid) {
  const ref = doc(db, 'students', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return

  const profile = snap.data()
  const today = new Date().toDateString()
  const lastActive = profile.lastActiveDate || ''
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  let newStreak = profile.streak || 0

  if (lastActive === today) {
    // Already studied today — no change
    return newStreak
  } else if (lastActive === yesterday) {
    // Studied yesterday — continue streak
    newStreak += 1
  } else {
    // Missed a day — reset streak
    newStreak = 1
  }

  await updateDoc(ref, {
    streak: newStreak,
    lastActiveDate: today,
  })

  return newStreak
}

export function getExamCountdown(examDate) {
  if (!examDate) return null
  const exam = new Date(examDate)
  const now = new Date()
  const diff = exam - now
  if (diff <= 0) return null
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return days
}

export function getCountdownUrgency(days) {
  if (days <= 7) return 'critical'
  if (days <= 30) return 'warning'
  return 'normal'
}