import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

export async function createShareLink(uid, convId, messages, title) {
  const shareId = `${convId.slice(0, 8)}_${Date.now().toString(36)}`

  await setDoc(doc(db, 'sharedConversations', shareId), {
    uid,
    convId,
    title: title || 'Ace Conversation',
    messages: messages.slice(-50).map((m) => ({
      role: m.role,
      content: m.content.slice(0, 2000), // truncate for safety
    })),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), // 7 days
  })

  return `${window.location.origin}/share/${shareId}`
}

export async function loadSharedConversation(shareId) {
  const snap = await getDoc(doc(db, 'sharedConversations', shareId))
  if (!snap.exists()) return null

  const data = snap.data()
  // Check expiry
  if (new Date(data.expiresAt) < new Date()) return null

  return data
}