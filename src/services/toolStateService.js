import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

const writeQueue = new Map()

export async function saveToolState(uid, toolId, state) {
  const key = `${uid}_${toolId}`

  // Cancel any pending write
  if (writeQueue.has(key)) {
    clearTimeout(writeQueue.get(key))
  }

  // Queue a new write 2 seconds from now
  return new Promise((resolve) => {
    const timer = setTimeout(async () => {
      writeQueue.delete(key)
      const ref = doc(db, 'students', uid, 'toolStates', toolId)
      await setDoc(ref, {
        state: JSON.stringify(state),
        updatedAt: new Date().toISOString(),
      })
      resolve()
    }, 2000)

    writeQueue.set(key, timer)
  })
}

export async function loadToolState(uid, toolId) {
  const ref = doc(db, 'students', uid, 'toolStates', toolId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  try {
    return JSON.parse(snap.data().state)
  } catch {
    return null
  }
}