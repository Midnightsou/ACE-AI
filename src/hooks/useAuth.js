import { useState, useEffect } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '../services/firebase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getOrCreateProfile(firebaseUser)
          setUser({ ...firebaseUser, profile })
        } catch (err) {
          console.error('Firestore error:', err)
          // Still set the user even if Firestore fails
          // so the UI doesn't break
          setUser({ ...firebaseUser, profile: {} })
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function getOrCreateProfile(firebaseUser) {
    const ref = doc(db, 'students', firebaseUser.uid)
    const snap = await getDoc(ref)

    if (!snap.exists()) {
      const newProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || '',
        level: null,
        examDate: null,
        examType: null,
        language: 'english',
        subjects: [],
        weakAreas: {},
        studyTime: {},
        streak: 0,
        lastActiveDate: new Date().toDateString(),
        isPro: false,
        dailyMessageCount: 0,
        lastMessageReset: new Date().toDateString(),
        onboarded: false,
        createdAt: new Date().toISOString(),
      }
      await setDoc(ref, newProfile)
      return newProfile
    }

    return snap.data()
  }

  async function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
  }

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function loginWithGoogle() {
    return signInWithPopup(auth, googleProvider)
  }

  async function logout() {
    return signOut(auth)
  }

  return { user, loading, signup, login, loginWithGoogle, logout }
}