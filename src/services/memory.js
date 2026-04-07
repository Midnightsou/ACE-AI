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

// ─── Profile ──────────────────────────────────────────

export async function getProfile(uid) {
  const ref = doc(db, 'students', uid)
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : null
}

export async function updateProfile(uid, updates) {
  const ref = doc(db, 'students', uid)
  await updateDoc(ref, updates)
}

// ─── Conversations ─────────────────────────────────────

export async function createConversation(uid, firstMessage) {
  const ref = collection(db, 'students', uid, 'conversations')
  const title = generateTitle(firstMessage)
  const newDoc = await addDoc(ref, {
    title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return newDoc.id
}

export async function updateConversationTitle(uid, conversationId, title) {
  const ref = doc(db, 'students', uid, 'conversations', conversationId)
  await updateDoc(ref, { title })
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
  const existing = query(
    ref,
    where('type', '==', 'tool'),
    where('toolId', '==', toolId),
    limit(1)
  )
  const snap = await getDocs(existing)

  if (!snap.empty) {
    const docRef = snap.docs[0].ref
    await updateDoc(docRef, {
      title: preview,
      updatedAt: serverTimestamp(),
    })
    return snap.docs[0].id
  }

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

// ─── Messages ─────────────────────────────────────────

export async function saveMessage(uid, conversationId, message) {
  const ref = collection(
    db, 'students', uid, 'conversations', conversationId, 'messages'
  )
  await addDoc(ref, {
    role: message.role,
    content: message.content,
    createdAt: serverTimestamp(),
  })

  // Update conversation's updatedAt so it sorts to top
  const convoRef = doc(db, 'students', uid, 'conversations', conversationId)
  await updateDoc(convoRef, { updatedAt: serverTimestamp() })
}

export async function loadMessages(uid, conversationId, limitCount = 50) {
  const ref = collection(
    db, 'students', uid, 'conversations', conversationId, 'messages'
  )
  const q = query(ref, orderBy('createdAt', 'asc'), limit(limitCount))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }))
}

// ─── Daily message count (freemium gate) ──────────────

export async function incrementMessageCount(uid) {
  const ref = doc(db, 'students', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return 1

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

// ─── Helpers ──────────────────────────────────────────

function generateTitle(firstMessage) {
  if (!firstMessage) return 'New chat'
  const cleaned = firstMessage.trim()
  if (cleaned.length <= 40) return cleaned
  return cleaned.slice(0, 40).trimEnd() + '...'
}