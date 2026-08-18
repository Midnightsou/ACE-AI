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
  getDocFromCache,
  serverTimestamp,
} from 'firebase/firestore'

import {
  auth,
  db,
  googleProvider,
} from '../services/firebase'

import { useUserStore } from '../store/userStore'


let authListenerStarted = false


function createFallbackProfile(firebaseUser) {
  // Important:
  // Check whether we previously confirmed onboarding.

  const cachedOnboarded =
    sessionStorage.getItem(
      `onboarded_${firebaseUser.uid}`
    ) === 'true'

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

    // Never blindly assume false
    onboarded: cachedOnboarded,
  }
}


async function getOrCreateProfile(firebaseUser) {
  const ref = doc(
    db,
    'students',
    firebaseUser.uid
  )

  try {
    console.log(
      '[Auth] Fetching Firestore profile...'
    )

    const snap = await getDoc(ref)

    // Existing user
    if (snap.exists()) {
      const profile = snap.data()

      console.log(
        '[Auth] Profile loaded successfully'
      )

      // Cache onboarding state
      if (profile.onboarded === true) {
        sessionStorage.setItem(
          `onboarded_${firebaseUser.uid}`,
          'true'
        )
      } else {
        sessionStorage.removeItem(
          `onboarded_${firebaseUser.uid}`
        )
      }

      return profile
    }


    // No profile exists.
    // This is genuinely a new user.

    console.log(
      '[Auth] Creating new profile...'
    )

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

    console.log(
      '[Auth] New profile created'
    )

    return {
      ...newProfile,
      onboarded: false,
    }

  } catch (err) {
    console.warn(
      '[Auth] Firestore profile fetch failed:',
      err.code,
      err.message
    )


    // Try Firestore's persistent cache
    try {
      const cachedSnap = await getDocFromCache(ref)

      if (cachedSnap.exists()) {
        console.log(
          '[Auth] Using cached Firestore profile'
        )

        const profile = cachedSnap.data()

        if (profile.onboarded === true) {
          sessionStorage.setItem(
            `onboarded_${firebaseUser.uid}`,
            'true'
          )
        }

        return profile
      }

    } catch (cacheError) {
      console.warn(
        '[Auth] No Firestore cache available'
      )
    }


    // Last-resort fallback.
    // Do NOT create a new Firestore profile here.
    console.warn(
      '[Auth] Using temporary fallback profile'
    )

    return createFallbackProfile(firebaseUser)
  }
}


function initAuthListener() {
  if (authListenerStarted) return

  authListenerStarted = true

  const {
    setUser,
    setLoading,
    clearUser,
  } = useUserStore.getState()


  onAuthStateChanged(
    auth,
    async (firebaseUser) => {

      if (!firebaseUser) {
        clearUser()
        return
      }

      setLoading(true)

      try {
        const profile =
          await getOrCreateProfile(firebaseUser)

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName:
            firebaseUser.displayName || '',
          photoURL:
            firebaseUser.photoURL || null,
          emailVerified:
            firebaseUser.emailVerified,
          profile,
        })

      } catch (err) {

        console.error(
          '[Auth] Unexpected auth error:',
          err
        )

        // Auth still works even if profile fails
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName:
            firebaseUser.displayName || '',
          photoURL:
            firebaseUser.photoURL || null,
          emailVerified:
            firebaseUser.emailVerified,
          profile:
            createFallbackProfile(firebaseUser),
          profileError: true,
        })

      } finally {
        setLoading(false)
      }
    }
  )
}


export function useAuth() {

  const user =
    useUserStore((s) => s.user)

  const loading =
    useUserStore((s) => s.loading)


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

    if (currentUser.emailVerified) {
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