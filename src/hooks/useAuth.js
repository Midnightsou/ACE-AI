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

import {
  auth,
  db,
  googleProvider,
} from '../services/firebase'

import { useUserStore } from '../store/userStore'

// ------------------------------------------------------------------
// Singleton auth listener
// ------------------------------------------------------------------
// The app has ONE Firebase auth listener, no matter how many
// components call useAuth(). Without this guard, every component
// calling useAuth() would create its own onAuthStateChanged
// subscription and its own Firestore profile fetch.

let authListenerStarted = false

function initAuthListener() {
  if (authListenerStarted) return
  authListenerStarted = true

  const { setUser, setLoading, clearUser } = useUserStore.getState()

  onAuthStateChanged(
    auth,
    async (firebaseUser) => {
      if (!firebaseUser) {
        clearUser()
        return
      }

      try {
        setLoading(true)

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
        console.error(
          'Auth profile error:',
          err
        )

        // Firebase Auth still works.
        // Do NOT create a fake "not onboarded"
        // profile here because that can send an
        // already onboarded user back to onboarding.

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || null,
          emailVerified: firebaseUser.emailVerified,
          profile: null,
          profileError: true,
        })

      } finally {
        setLoading(false)
      }
    }
  )
}

async function getOrCreateProfile(firebaseUser) {
  const ref = doc(
    db,
    'students',
    firebaseUser.uid
  )

  try {
    const snap = await getDoc(ref)

    // Profile already exists
    if (snap.exists()) {
      return snap.data()
    }

    // First time this account is seen
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

      // IMPORTANT
      // New users must complete onboarding
      onboarded: false,

      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    }

    await setDoc(
      ref,
      newProfile
    )

    return {
      ...newProfile,
      onboarded: false,
    }

  } catch (err) {
    console.error(
      'Firestore profile fetch failed:',
      err
    )

    throw err
  }
}

export function useAuth() {
  const user = useUserStore((s) => s.user)
  const loading = useUserStore((s) => s.loading)

  // Ensure the singleton auth listener is initialized.
  // This is safe to call from any component — only the
  // first invocation actually subscribes to Firebase.
  useEffect(() => {
    initAuthListener()
  }, [])

  async function signup(email, password) {
    return createUserWithEmailAndPassword(
      auth,
      email,
      password
    )
  }

  async function login(email, password) {
    return signInWithEmailAndPassword(
      auth,
      email,
      password
    )
  }

  async function loginWithGoogle() {
    return signInWithPopup(
      auth,
      googleProvider
    )
  }

  async function logout() {
    await signOut(auth)

    const { clearUser } = useUserStore.getState()
    clearUser()
  }

  async function forgotPassword(email) {
    return sendPasswordResetEmail(
      auth,
      email
    )
  }

  async function sendVerificationEmail() {
    const currentUser = auth.currentUser

    if (!currentUser) {
      throw new Error('Not logged in')
    }

    if (currentUser.emailVerified) {
      throw new Error('Already verified')
    }

    await sendEmailVerification(
      currentUser,
      {
        url:
          window.location.origin +
          '/chat',
      }
    )
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