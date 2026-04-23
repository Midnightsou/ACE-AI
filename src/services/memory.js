import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'

import { db } from './firebase'

/* ─────────────────────────────
   PROFILE
───────────────────────────── */

export async function getProfile(uid) {
  const ref = doc(db, 'students', uid)
  const snap = await getDoc(ref)

  return snap.exists() ? snap.data() : null
}

export async function updateProfile(uid, updates) {
  const ref = doc(db, 'students', uid)

  // safer: create doc if missing
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      ...updates,
      createdAt: serverTimestamp(),
    })
    return
  }

  await updateDoc(ref, updates)
}

/* ─────────────────────────────
   CONVERSATIONS
───────────────────────────── */

export async function createConversation(uid, firstMessage) {
  const ref = collection(db, 'students', uid, 'conversations')

  const newDoc = await addDoc(ref, {
    title: generateTitle(firstMessage),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return newDoc.id
}

export async function updateConversationTitle(uid, conversationId, title) {
  const ref = doc(db, 'students', uid, 'conversations', conversationId)

  await updateDoc(ref, {
    title,
    updatedAt: serverTimestamp(),
  })
}

export async function loadConversations(uid, limitCount = 30) {
  const ref = collection(db, 'students', uid, 'conversations')

  const q = query(ref, orderBy('updatedAt', 'desc'), limit(limitCount))
  const snap = await getDocs(q)

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }))
}

export async function saveToolSession(uid, toolId, toolName, preview, icon) {
  const ref = collection(db, 'students', uid, 'conversations')

  // Always create a new session — never overwrite existing ones
  const newDoc = await addDoc(ref, {
    type: 'tool',
    toolId,
    toolName,
    icon,
    title: preview,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return newDoc.id
}

/* ─────────────────────────────
   MESSAGES
───────────────────────────── */

export async function saveMessage(uid, conversationId, message) {
  const ref = collection(
    db,
    'students',
    uid,
    'conversations',
    conversationId,
    'messages'
  )

  await addDoc(ref, {
    role: message.role,
    content: message.content,
    createdAt: serverTimestamp(),
  })

  // bump conversation ordering
  const convoRef = doc(
    db,
    'students',
    uid,
    'conversations',
    conversationId
  )

  await updateDoc(convoRef, {
    updatedAt: serverTimestamp(),
  })
}

export async function loadMessages(uid, conversationId, limitCount = 50) {
  const ref = collection(
    db,
    'students',
    uid,
    'conversations',
    conversationId,
    'messages'
  )

  const q = query(ref, orderBy('createdAt', 'asc'), limit(limitCount))
  const snap = await getDocs(q)

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }))
}

/* ─────────────────────────────
   TOOL MESSAGES
───────────────────────────── */

export async function saveToolMessage(uid, sessionId, message) {
  const ref = collection(db, 'students', uid, 'conversations', sessionId, 'messages')
  await addDoc(ref, {
    role: message.role,
    content: message.content,
    createdAt: serverTimestamp(),
  })
  const convoRef = doc(db, 'students', uid, 'conversations', sessionId)
  await updateDoc(convoRef, { updatedAt: serverTimestamp() })
}

export async function loadToolMessages(uid, sessionId) {
  const ref = collection(db, 'students', uid, 'conversations', sessionId, 'messages')
  const q = query(ref, orderBy('createdAt', 'asc'), limit(100))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/* ─────────────────────────────
   FREEMIUM MESSAGE COUNT
───────────────────────────── */

export async function incrementMessageCount(uid) {
  const ref = doc(db, 'students', uid)
  const snap = await getDoc(ref)

  const today = new Date().toDateString()

  if (!snap.exists()) {
    await setDoc(ref, {
      dailyMessageCount: 1,
      lastMessageReset: today,
    })
    return 1
  }

  const data = snap.data()
  const lastReset = data.lastMessageReset || ''

  if (lastReset !== today) {
    await updateDoc(ref, {
      dailyMessageCount: 1,
      lastMessageReset: today,
    })
    return 1
  }

  const newCount = (data.dailyMessageCount || 0) + 1

  await updateDoc(ref, {
    dailyMessageCount: newCount,
  })

  return newCount
}

export async function getMessageCount(uid) {
  const ref = doc(db, 'students', uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) return 0

  const data = snap.data()
  const today = new Date().toDateString()

  if (data.lastMessageReset !== today) return 0

  return data.dailyMessageCount || 0
}

/* ─────────────────────────────
   STREAK SYSTEM (NEW)
───────────────────────────── */

export async function updateStreak(uid) {
  const ref = doc(db, 'students', uid)
  const snap = await getDoc(ref)

  const today = new Date().toDateString()

  if (!snap.exists()) {
    await setDoc(ref, {
      streak: 1,
      lastActiveDate: today,
    })
    return 1
  }

  const data = snap.data()

  const lastActive = data.lastActiveDate || ''
  let streak = data.streak || 0

  // already counted today
  if (lastActive === today) return streak

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  if (lastActive === yesterday.toDateString()) {
    streak += 1
  } else {
    streak = 1
  }

  await updateDoc(ref, {
    streak,
    lastActiveDate: today,
  })

  return streak
}

/* ─────────────────────────────
   HELPERS
───────────────────────────── */

function generateTitle(firstMessage) {
  if (!firstMessage) return 'New chat'

  const cleaned = firstMessage.trim()

  if (cleaned.length <= 40) return cleaned

  return cleaned.slice(0, 40).trimEnd() + '...'
}