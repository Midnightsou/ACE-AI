import { useState, useEffect } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '../services/firebase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function getOrCreateProfile(firebaseUser) {
    const ref = doc(db, 'students', firebaseUser.uid)

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const snap = await getDoc(ref)
        if (!snap.exists()) {
          const newProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || '',
            language: 'english',
            isPro: false,
            plan: 'free',
            dailyMessageCount: 0,
            lastMessageReset: new Date().toDateString(),
            onboarded: false,
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
          }
          await setDoc(ref, newProfile)
          return newProfile
        }
        const profile = snap.data()

        // Cache onboarded state — survives page refresh within same session
        if (profile.onboarded) {
          sessionStorage.setItem(`onboarded_${firebaseUser.uid}`, 'true')
        }

        return profile
      } catch (err) {
        if (attempt === 2) throw err
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
      }
    }
  }

  useEffect(() => {
    // Safety timeout — if auth takes more than 8 seconds, unblock the app
    const safetyTimer = setTimeout(() => {
      setLoading(false)
    }, 8000)

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(safetyTimer)

      if (firebaseUser) {
        try {
          // Timeout for profile fetch — 5 seconds max
          const profilePromise = getOrCreateProfile(firebaseUser)
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
          )

          const profile = await Promise.race([profilePromise, timeoutPromise])
          setUser({ ...firebaseUser, profile })
        } catch (err) {
          console.error('Auth profile error:', err)
          // Still let the user through with empty profile
          // Better to reach onboarding than be stuck forever
          setUser({
            ...firebaseUser,
            profile: {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || '',
              language: 'english',
              isPro: false,
              plan: 'free',
              onboarded: false,
            },
          })
        }
      } else {
        setUser(null)
      }

      setLoading(false)
    })

    return () => {
      clearTimeout(safetyTimer)
      unsub()
    }
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
    return sendPasswordResetEmail(auth, email)
  }

  async function sendVerificationEmail() {
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error('Not logged in')
    if (currentUser.emailVerified) throw new Error('Already verified')
    await sendEmailVerification(currentUser, {
      url: window.location.origin + '/chat',
    })
  }

  return {
    user, loading,
    signup, login, loginWithGoogle, logout,
    forgotPassword, sendVerificationEmail,
  }
}