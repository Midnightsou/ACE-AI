import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

const conversationCache = new Map()
const CACHE_TTL = 30000

export async function loadConversations(uid, limitCount = 40) {
  const cacheKey = `convs_${uid}`
  const cached = conversationCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  const ref = collection(db, 'students', uid, 'conversations')
  const q = query(ref, orderBy('updatedAt', 'desc'), limit(limitCount))
  const snap = await getDocs(q)
  const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

  conversationCache.set(cacheKey, { data, timestamp: Date.now() })
  return data
}

export function invalidateConversationCache(uid) {
  conversationCache.delete(`convs_${uid}`)
}

// ── Chat conversations ──────────────────────────────────

export async function createConversation(uid, title) {
  const ref = collection(db, 'students', uid, 'conversations')
  const newDoc = await addDoc(ref, {
    type: 'chat',
    title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  invalidateConversationCache(uid)
  return newDoc.id
}

export async function saveMessage(uid, convId, message) {
  const ref = collection(db, 'students', uid, 'conversations', convId, 'messages')
  await addDoc(ref, {
    role: message.role,
    content: message.content,
    createdAt: serverTimestamp(),
  })
  await updateDoc(doc(db, 'students', uid, 'conversations', convId), {
    updatedAt: serverTimestamp(),
  })
  invalidateConversationCache(uid)
}

export async function loadMessages(uid, convId) {
  const ref = collection(db, 'students', uid, 'conversations', convId, 'messages')
  const q = query(ref, orderBy('createdAt', 'asc'), limit(100))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function updateConversationTitle(uid, convId, title) {
  await updateDoc(doc(db, 'students', uid, 'conversations', convId), {
    title,
    updatedAt: serverTimestamp(),
  })
  invalidateConversationCache(uid)
}

export async function deleteConversation(uid, convId) {
  // Delete all messages first
  const messagesRef = collection(db, 'students', uid, 'conversations', convId, 'messages')
  const snap = await getDocs(messagesRef)
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))

  // Delete the conversation document
  await deleteDoc(doc(db, 'students', uid, 'conversations', convId))
  invalidateConversationCache(uid)
}

export async function renameConversation(uid, convId, newTitle) {
  await updateDoc(doc(db, 'students', uid, 'conversations', convId), {
    title: newTitle,
    updatedAt: serverTimestamp(),
  })
  invalidateConversationCache(uid)
}

// ── Tool sessions (chat-based: Codex, Math, Dojo) ──────

export async function saveToolSession(uid, toolId, toolName, title, icon) {
  const ref = collection(db, 'students', uid, 'conversations')
  const newDoc = await addDoc(ref, {
    type: 'tool',
    toolId,
    toolName,
    icon: icon || '🔧',
    title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  invalidateConversationCache(uid)
  return newDoc.id
}

export async function saveToolMessage(uid, sessionId, message) {
  const ref = collection(db, 'students', uid, 'conversations', sessionId, 'messages')
  await addDoc(ref, {
    role: message.role,
    content: message.content,
    createdAt: serverTimestamp(),
  })
  await updateDoc(doc(db, 'students', uid, 'conversations', sessionId), {
    updatedAt: serverTimestamp(),
  })
  invalidateConversationCache(uid)
}

export async function loadToolMessages(uid, sessionId) {
  const ref = collection(db, 'students', uid, 'conversations', sessionId, 'messages')
  const q = query(ref, orderBy('createdAt', 'asc'), limit(100))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ── Tool sessions (form-based: CV, Email, Essay, etc) ──

export async function createFormToolSession(uid, toolId, toolName, icon, title) {
  const ref = collection(db, 'students', uid, 'conversations')
  const newDoc = await addDoc(ref, {
    type: 'tool',
    toolId,
    toolName,
    icon: icon || '🔧',
    title,
    savedState: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  invalidateConversationCache(uid)
  return newDoc.id
}

export async function updateFormToolSession(uid, sessionId, title, state) {
  await updateDoc(doc(db, 'students', uid, 'conversations', sessionId), {
    title,
    savedState: JSON.stringify(state),
    updatedAt: serverTimestamp(),
  })
  invalidateConversationCache(uid)
}

export async function loadFormToolSession(uid, sessionId) {
  const snap = await getDoc(doc(db, 'students', uid, 'conversations', sessionId))
  if (!snap.exists()) return null
  const data = snap.data()
  if (!data.savedState) return null
  try {
    return JSON.parse(data.savedState)
  } catch {
    return null
  }
}

// ── Profile ────────────────────────────────────────────

export async function updateProfile(uid, data) {
  await updateDoc(doc(db, 'students', uid), data)
}

// ── Message counting + streak ──────────────────────────

export async function getMessageCount(uid) {
  const snap = await getDoc(doc(db, 'students', uid))
  if (!snap.exists()) return 0
  const data = snap.data()

  // Reset count if it's a new day
  const today = new Date().toDateString()
  if (data.lastMessageReset !== today) {
    await updateDoc(doc(db, 'students', uid), {
      dailyMessageCount: 0,
      lastMessageReset: today,
    })
    return 0
  }

  return data.dailyMessageCount || 0
}

export async function incrementMessageCount(uid) {
  const today = new Date().toDateString()
  const snap = await getDoc(doc(db, 'students', uid))
  if (!snap.exists()) return

  const data = snap.data()
  const isNewDay = data.lastMessageReset !== today

  await updateDoc(doc(db, 'students', uid), {
    dailyMessageCount: isNewDay ? 1 : (data.dailyMessageCount || 0) + 1,
    lastMessageReset: today,
    lastActive: new Date().toISOString(),
  })
}

export async function updateStreak(uid) {
  const snap = await getDoc(doc(db, 'students', uid))
  if (!snap.exists()) return

  const data = snap.data()
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  const lastActive = data.lastStreakDate
  let streak = data.streak || 0

  if (lastActive === today) return // Already updated today
  if (lastActive === yesterday) {
    streak += 1 // Continue streak
  } else {
    streak = 1 // Reset streak
  }

  await updateDoc(doc(db, 'students', uid), {
    streak,
    lastStreakDate: today,
  })
}
// dojo session saving
export async function saveDojoSession(uid, data) {
  const ref = collection(db, 'students', uid, 'conversations')
  
  // Find existing dojo session or create new one
  const existing = await getDocs(
    query(ref, where('toolId', '==', 'dojo'), orderBy('updatedAt', 'desc'), limit(1))
  )

  const safeData = {
    generatedContent: data.generatedContent || {},
    sourceMetadata: data.sourceMetadata || [],
    // Truncate any large generated content
    ...Object.fromEntries(
      Object.entries(data.generatedContent || {}).map(([k, v]) => [
        k, v.length > 5000 ? v.slice(0, 5000) + '\n[truncated]' : v
      ])
    ),
  }

  if (!existing.empty) {
    await updateDoc(existing.docs[0].ref, {
      savedState: JSON.stringify(safeData),
      updatedAt: serverTimestamp(),
    })
  } else {
    await addDoc(ref, {
      type: 'tool',
      toolId: 'dojo',
      toolName: 'Dojo',
      icon: '🥋',
      title: 'Dojo Session',
      savedState: JSON.stringify(safeData),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    invalidateConversationCache(uid)
  }
}