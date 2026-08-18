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

let authListenerStarted = false


function initAuthListener() {
  if (authListenerStarted) return

  authListenerStarted = true

  onAuthStateChanged(auth, async (firebaseUser) => {
    const {
      setUser,
      setLoading,
      clearUser,
    } = useUserStore.getState()

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
        profileError: false,
      })

    } catch (err) {
      console.error('Auth profile error:', err)

      const cachedUser =
        useUserStore.getState().user

      // If Firestore temporarily fails but we already
      // know this user, keep their existing profile.
      if (
        cachedUser &&
        cachedUser.uid === firebaseUser.uid
      ) {
        setUser({
          ...cachedUser,
          email: firebaseUser.email || '',
          displayName:
            firebaseUser.displayName || '',
          photoURL:
            firebaseUser.photoURL || null,
          emailVerified:
            firebaseUser.emailVerified,
          profileError: true,
        })
      } else {
        // Auth succeeded but Firestore is unavailable.
        // Do NOT invent an onboarding state.
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName:
            firebaseUser.displayName || '',
          photoURL:
            firebaseUser.photoURL || null,
          emailVerified:
            firebaseUser.emailVerified,
          profile: null,
          profileError: true,
        })
      }

    } finally {
      setLoading(false)
    }
  })
}


async function getOrCreateProfile(firebaseUser) {
  const ref = doc(
    db,
    'students',
    firebaseUser.uid
  )

  const snap = await getDoc(ref)

  // Existing profile
  if (snap.exists()) {
    return snap.data()
  }

  // New user profile
  const newProfile = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || '',
    language: 'english',
    useCase: '',
    isPro: false,
    plan: 'free',

    dailyMessageCount: 0,
    lastMessageReset:
      new Date().toDateString(),

    streak: 0,
    lastStreakDate: '',

    onboarded: false,

    createdAt: serverTimestamp(),
    lastActive: serverTimestamp(),
  }

  await setDoc(ref, newProfile)

  return {
    ...newProfile,
    onboarded: false,
  }
}


export function useAuth() {
  const user = useUserStore(
    (s) => s.user
  )

  const loading = useUserStore(
    (s) => s.loading
  )

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

    useUserStore
      .getState()
      .clearUser()
  }


  async function forgotPassword(email) {
    return sendPasswordResetEmail(
      auth,
      email
    )
  }


  async function sendVerificationEmail() {
    const currentUser =
      auth.currentUser

    if (!currentUser) {
      throw new Error(
        'Not logged in'
      )
    }

    if (
      currentUser.emailVerified
    ) {
      throw new Error(
        'Already verified'
      )
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