import { useState, useEffect } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  getIdToken,
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '../services/firebase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Declare FIRST before useEffect
  async function getOrCreateProfile(firebaseUser) {
    const ref = doc(db, 'students', firebaseUser.uid)

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
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

        await updateDoc(ref, {
          lastActiveDate: new Date().toDateString(),
        }).catch(() => {})

        return snap.data()
      } catch (err) {
        if (attempt === 2) throw err
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
  }

  // useEffect comes AFTER the function it calls
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await getIdToken(firebaseUser, true)
          const profile = await getOrCreateProfile(firebaseUser)
          setUser({ ...firebaseUser, profile })
        } catch (err) {
          console.error('Auth error:', err)
          setUser({ ...firebaseUser, profile: {} })
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

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

  async function forgotPassword(email) {
    await sendPasswordResetEmail(auth, email)
  }

  return { user, loading, signup, login, loginWithGoogle, logout, forgotPassword }
}