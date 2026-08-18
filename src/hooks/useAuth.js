import { useEffect } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db, googleProvider } from '../services/firebase'
import { useUserStore } from '../store/userStore'

let authListenerStarted = false

function createFallbackProfile(firebaseUser) {
  const cachedOnboarded =
    sessionStorage.getItem(`onboarded_${firebaseUser.uid}`) === 'true'

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || '',
    language: 'english',
    useCase: '',
    isPro: false,
    plan: 'free',
    dailyMessageCount: 0,
    lastMessageReset: new Date().toDateString(),
    streak: 0,
    lastStreakDate: '',
    onboarded: cachedOnboarded,
  }
}

async function getOrCreateProfile(firebaseUser) {
  const ref = doc(db, 'students', firebaseUser.uid)

  // Race against a 5 second timeout
  const profilePromise = (async () => {
    const snap = await getDoc(ref)

    if (snap.exists()) {
      const profile = snap.data()
      if (profile.onboarded === true) {
        sessionStorage.setItem(`onboarded_${firebaseUser.uid}`, 'true')
      } else {
        sessionStorage.removeItem(`onboarded_${firebaseUser.uid}`)
      }
      return profile
    }

    // New user — create profile
    const newProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || '',
      language: 'english',
      useCase: '',
      isPro: false,
      plan: 'free',
      dailyMessageCount: 0,
      lastMessageReset: new Date().toDateString(),
      streak: 0,
      lastStreakDate: '',
      onboarded: false,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    }

    await setDoc(ref, newProfile)
    return { ...newProfile, onboarded: false }
  })()

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Firestore timeout')), 5000)
  )

  try {
    return await Promise.race([profilePromise, timeoutPromise])
  } catch (err) {
    console.warn('[Auth] Profile fetch failed or timed out:', err.message)
    // Return fallback — app still works
    return createFallbackProfile(firebaseUser)
  }
}

function initAuthListener() {
  if (authListenerStarted) return
  authListenerStarted = true

  const { setUser, setLoading, clearUser } = useUserStore.getState()

  // Overall safety timeout — never hang longer than 8s
  const safetyTimer = setTimeout(() => {
    setLoading(false)
  }, 10000)

  onAuthStateChanged(auth, async (firebaseUser) => {
    clearTimeout(safetyTimer)

    if (!firebaseUser) {
      clearUser()
      return
    }

    setLoading(true)

    try {
      const profile = await getOrCreateProfile(firebaseUser)

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || null,
        emailVerified: firebaseUser.emailVerified,
        profile,
      })
    } catch (err) {
      console.error('[Auth] Unexpected error:', err)
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || null,
        emailVerified: firebaseUser.emailVerified,
        profile: createFallbackProfile(firebaseUser),
      })
    } finally {
      setLoading(false)
    }
  })
}

export function useAuth() {
  const user = useUserStore((s) => s.user)
  const loading = useUserStore((s) => s.loading)

  useEffect(() => {
    initAuthListener()
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
    await signOut(auth)
    useUserStore.getState().clearUser()
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