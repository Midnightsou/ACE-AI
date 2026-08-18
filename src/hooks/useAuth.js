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

const PROFILE_TIMEOUT = 5000 // 5 seconds max to fetch profile

async function fetchOrCreateProfile(firebaseUser) {
  const ref = doc(db, 'students', firebaseUser.uid)

  const profilePromise = (async () => {
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

        // Cache onboarded state for refresh resilience
        if (profile.onboarded) {
          sessionStorage.setItem(`onboarded_${firebaseUser.uid}`, 'true')
        }

        return profile
      } catch (err) {
        if (attempt === 2) throw err
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)))
      }
    }
  })()

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Profile fetch timeout')), PROFILE_TIMEOUT)
  )

  return Promise.race([profilePromise, timeoutPromise])
}

function getFallbackProfile(firebaseUser) {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || '',
    language: 'english',
    isPro: false,
    plan: 'free',
    dailyMessageCount: 0,
    onboarded: false,
  }
}

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Hard safety — never spin forever
    const safetyTimer = setTimeout(() => {
      setLoading(false)
    }, 8000)

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(safetyTimer)

      if (!firebaseUser) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        const profile = await fetchOrCreateProfile(firebaseUser)
        setUser({ ...firebaseUser, profile })
      } catch (err) {
        console.error('Profile fetch failed, using fallback:', err)
        // Never block the user — give them a fallback profile
        setUser({
          ...firebaseUser,
          profile: getFallbackProfile(firebaseUser),
        })
      } finally {
        setLoading(false)
      }
    })

    return () => {
      clearTimeout(safetyTimer)
      unsub()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    await sendEmailVerification(currentUser, {
      url: window.location.origin + '/chat',
    })
  }

  return {
    user,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    forgotPassword,
    sendVerificationEmail,
  }
}