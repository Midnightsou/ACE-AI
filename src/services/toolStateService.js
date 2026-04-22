import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

export async function saveToolState(uid, toolId, state) {
  const ref = doc(db, 'students', uid, 'toolStates', toolId)
  await setDoc(ref, {
    state: JSON.stringify(state),
    updatedAt: new Date().toISOString(),
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