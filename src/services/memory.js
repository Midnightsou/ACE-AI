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
  serverTimestamp,
  increment,
  runTransaction,
  getCountFromServer,
} from 'firebase/firestore'
import { db } from './firebase'
import { getUserPlan } from '../config/pricing'

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
  const saved = await addDoc(ref, {
    role: message.role,
    content: message.content,
    ...(message.versions ? { versions: message.versions } : {}),
    createdAt: serverTimestamp(),
  })
  await updateDoc(doc(db, 'students', uid, 'conversations', convId), {
    updatedAt: serverTimestamp(),
  })
  invalidateConversationCache(uid)
  return saved.id
}

export async function loadMessages(uid, convId) {
  const ref = collection(db, 'students', uid, 'conversations', convId, 'messages')
  const q = query(ref, orderBy('createdAt', 'desc'), limit(100))
  const snap = await getDocs(q)
  return snap.docs.reverse().map((d) => ({ id: d.id, ...d.data() }))
}

export async function loadConversationSummary(uid, convId) {
  const conversationRef = doc(db, 'students', uid, 'conversations', convId)
  const messagesRef = collection(db, 'students', uid, 'conversations', convId, 'messages')
  const [snap, countSnap] = await Promise.all([
    getDoc(conversationRef),
    getCountFromServer(messagesRef),
  ])
  if (!snap.exists()) {
    return { summary: '', summarizedMessageCount: 0, messageCount: countSnap.data().count }
  }
  const data = snap.data()
  return {
    summary: data.summary || '',
    summarizedMessageCount: data.summarizedMessageCount || 0,
    messageCount: countSnap.data().count,
  }
}

export async function updateConversationSummary(uid, convId, summary, summarizedMessageCount) {
  await updateDoc(doc(db, 'students', uid, 'conversations', convId), {
    summary,
    summarizedMessageCount,
    updatedAt: serverTimestamp(),
  })
  invalidateConversationCache(uid)
}

export async function updateMessage(uid, convId, messageId, changes) {
  await updateDoc(
    doc(db, 'students', uid, 'conversations', convId, 'messages', messageId),
    changes
  )
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
  const cooldownUntil = Date.parse(data.messageCooldownUntil || '')
  if (Number.isFinite(cooldownUntil) && cooldownUntil > Date.now()) {
    return data.dailyMessageCount || 0
  }

  if (Number.isFinite(cooldownUntil) && cooldownUntil <= Date.now()) {
    await updateDoc(doc(db, 'students', uid), {
      dailyMessageCount: 0,
      lastMessageReset: new Date().toDateString(),
      messageCooldownUntil: null,
    })
    return 0
  }

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

export async function reserveMessageSlot(uid) {
  const userRef = doc(db, 'students', uid)
  const now = Date.now()
  const today = new Date(now).toDateString()

  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(userRef)
    if (!snap.exists()) throw new Error('Cannot reserve a message for a missing profile.')

    const data = snap.data()
    const plan = getUserPlan(data)
    const currentCount = data.dailyMessageCount || 0
    const cooldownUntil = Date.parse(data.messageCooldownUntil || '')

    if (data.isAdmin || data.isTester) {
      return { allowed: true, count: currentCount, cooldownUntil: null, planId: plan.id }
    }

    if (plan.id === 'free' && Number.isFinite(cooldownUntil) && cooldownUntil > now) {
      return {
        allowed: false,
        count: currentCount,
        cooldownUntil,
        planId: plan.id,
        limit: plan.limits.dailyMessages,
      }
    }

    const isNewDay = data.lastMessageReset !== today
    const count = isNewDay || (
      plan.id === 'free' &&
      Number.isFinite(cooldownUntil) &&
      cooldownUntil <= now
    )
      ? 0
      : currentCount

    if (plan.limits.dailyMessages !== Infinity && count >= plan.limits.dailyMessages) {
      const nextCooldown = plan.id === 'free' ? now + 5 * 60 * 60 * 1000 : null
      transaction.update(userRef, {
        dailyMessageCount: count,
        lastMessageReset: today,
        ...(nextCooldown ? { messageCooldownUntil: new Date(nextCooldown).toISOString() } : {}),
      })
      return {
        allowed: false,
        count,
        cooldownUntil: nextCooldown,
        planId: plan.id,
        limit: plan.limits.dailyMessages,
      }
    }

    const nextCount = count + 1
    const nextCooldown = plan.id === 'free' && nextCount >= plan.limits.dailyMessages
      ? now + 5 * 60 * 60 * 1000
      : null

    transaction.update(userRef, {
      dailyMessageCount: nextCount,
      lastMessageReset: today,
      lastActive: new Date(now).toISOString(),
      messageCooldownUntil: nextCooldown ? new Date(nextCooldown).toISOString() : null,
    })

    return {
      allowed: true,
      count: nextCount,
      cooldownUntil: nextCooldown,
      planId: plan.id,
      limit: plan.limits.dailyMessages,
    }
  })
}

export async function incrementMessageCount(uid) {
  const userRef = doc(db, 'students', uid)
  const snap = await getDoc(userRef)

  if (!snap.exists()) return

  const data = snap.data()
  const today = new Date().toDateString()
  const isNewDay = data.lastMessageReset !== today

  await updateDoc(userRef, {
    dailyMessageCount: isNewDay ? 1 : increment(1),
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
export async function saveDojoSession(uid, sessionId, data) {
  const ref = collection(db, 'students', uid, 'conversations')

  const safeData = {
    generatedContent: data.generatedContent || {},
    sourceMetadata: data.sourceMetadata || [],

    ...Object.fromEntries(
      Object.entries(data.generatedContent || {}).map(([key, value]) => [
        key,
        typeof value === 'string' && value.length > 5000
          ? value.slice(0, 5000) + '\n[truncated]'
          : value,
      ])
    ),
  }

  let currentSessionId = sessionId

  // Create a Dojo session if one doesn't exist yet
  if (!currentSessionId) {
    const newDoc = await addDoc(ref, {
      type: 'tool',
      toolId: 'dojo',
      toolName: 'Dojo',
      icon: '🥋',
      title: 'Dojo Session',
      savedState: JSON.stringify(safeData),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    currentSessionId = newDoc.id
  } else {
    await updateDoc(
      doc(db, 'students', uid, 'conversations', currentSessionId),
      {
        savedState: JSON.stringify(safeData),
        updatedAt: serverTimestamp(),
      }
    )
  }

  invalidateConversationCache(uid)

  return currentSessionId
}