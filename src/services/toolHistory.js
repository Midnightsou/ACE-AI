import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  deleteDoc,
  doc,
} from 'firebase/firestore'
import { db } from './firebase'

export async function saveToolOutput(uid, toolId, data) {
  const ref = collection(db, 'students', uid, 'toolHistory', toolId, 'outputs')
  const docRef = await addDoc(ref, {
    ...data,
    toolId,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function loadToolHistory(uid, toolId, limitCount = 10) {
  const ref = collection(db, 'students', uid, 'toolHistory', toolId, 'outputs')
  const q = query(ref, orderBy('createdAt', 'desc'), limit(limitCount))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }))
}

export async function deleteToolOutput(uid, toolId, outputId) {
  const ref = doc(db, 'students', uid, 'toolHistory', toolId, 'outputs', outputId)
  await deleteDoc(ref)
}