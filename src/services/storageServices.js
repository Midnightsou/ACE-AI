import { ref, uploadString, getDownloadURL, deleteObject, getStorage } from 'firebase/storage'

// Lazily initialized storage instance — only loads firebase/storage when needed
const storage = getStorage()

// Save large content to Firebase Storage instead of Firestore
export async function saveLargeContent(uid, sessionId, key, content) {
  if (!content || content.length < 1000) return null // Only use for large content

  const path = `users/${uid}/sessions/${sessionId}/${key}.txt`
  const storageRef = ref(storage, path)

  await uploadString(storageRef, content)
  return await getDownloadURL(storageRef)
}

export async function loadLargeContent(url) {
  if (!url) return null
  const response = await fetch(url)
  return response.text()
}

export async function deleteLargeContent(uid, sessionId, key) {
  const path = `users/${uid}/sessions/${sessionId}/${key}.txt`
  const storageRef = ref(storage, path)
  await deleteObject(storageRef).catch(() => {})
}