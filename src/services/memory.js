import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// ─── Profile ─────────────────────────────────────────

export async function getProfile(uid) {
  const ref = doc(db, 'students', uid)
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : null
}

export async function updateProfile(uid, updates) {
  const ref = doc(db, 'students', uid)
  await updateDoc(ref, updates)
}

// ─── Messages ─────────────────────────────────────────

export async function saveMessage(uid, subject, message) {
  const ref = collection(db, 'students', uid, 'chats', subject, 'messages')
  await addDoc(ref, {
    role: message.role,
    content: message.content,
    createdAt: serverTimestamp(),
  })
}

export async function loadMessages(uid, subject, limitCount = 30) {
  const ref = collection(db, 'students', uid, 'chats', subject, 'messages')
  const q = query(ref, orderBy('createdAt', 'asc'), limit(limitCount))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }))
}

// ─── Cognitive profile updater ─────────────────────────

export async function updateCognitiveProfile(uid, subject, messages) {
  if (!messages.length) return

  const ref = doc(db, 'students', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return

  const profile = snap.data()

  // Track subjects studied
  const subjects = profile.subjects || []
  if (!subjects.includes(subject)) {
    subjects.push(subject)
  }

  // Track last active
  await updateDoc(ref, {
    subjects,
    lastActive: new Date().toISOString(),
    [`studyTime.${subject}`]: (profile.studyTime?.[subject] || 0) + 1,
  })
}

// ─── Daily message count (freemium gate) ──────────────

export async function incrementMessageCount(uid) {
  const ref = doc(db, 'students', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return

  const profile = snap.data()
  const today = new Date().toDateString()
  const lastReset = profile.lastMessageReset || ''

  if (lastReset !== today) {
    await updateDoc(ref, {
      dailyMessageCount: 1,
      lastMessageReset: today,
    })
    return 1
  }

  const newCount = (profile.dailyMessageCount || 0) + 1
  await updateDoc(ref, { dailyMessageCount: newCount })
  return newCount
}

export async function getMessageCount(uid) {
  const ref = doc(db, 'students', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return 0

  const profile = snap.data()
  const today = new Date().toDateString()

  if (profile.lastMessageReset !== today) return 0
  return profile.dailyMessageCount || 0
}