import { useState, useEffect } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth'

import {
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore'

import {
  auth,
  db,
  googleProvider,
} from '../services/firebase'

// ------------------------------------------------------------------
// Profile cache
// ------------------------------------------------------------------
// Firebase Auth is the source of truth for authentication.
// The Firestore profile is enrichment (name, plan, onboarding, etc).
// We cache the last-known profile locally so a temporary Firestore
// outage never breaks the app or re-triggers onboarding for a user
// who has already completed it.

function getCachedProfile(uid) {
  try {
    const raw = localStorage.getItem(
      `cached_profile_${uid}`
    )
    return raw ? JSON.parse(raw) : null
  } catch (err) {
    console.error(
      'Could not read cached profile:',
      err
    )
    return null
  }
}

function cacheProfile(uid, profile) {
  try {
    localStorage.setItem(
      `cached_profile_${uid}`,
      JSON.stringify(profile)
    )
  } catch (err) {
    console.error(
      'Could not cache profile:',
      err
    )
  }
}

function clearCachedProfile(uid) {
  try {
    localStorage.removeItem(
      `cached_profile_${uid}`
    )
  } catch (err) {
    console.error(
      'Could not clear cached profile:',
      err
    )
  }
}

function createFallbackProfile(firebaseUser) {
  const cached = getCachedProfile(firebaseUser.uid)

  const cachedOnboarded =
    cached?.onboarded === true ||
    sessionStorage.getItem(
      `onboarded_${firebaseUser.uid}`
    ) === 'true'

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || '',
    language: cached?.language || 'english',
    isPro: cached?.isPro === true,
    plan: cached?.plan || 'free',
    dailyMessageCount: cached?.dailyMessageCount || 0,
    lastMessageReset:
      cached?.lastMessageReset ||
      new Date().toDateString(),
    onboarded: cachedOnboarded,
    createdAt:
      cached?.createdAt ||
      new Date().toISOString(),
    lastActive: new Date().toISOString(),
  }
}

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function getOrCreateProfile(firebaseUser) {
    const ref = doc(
      db,
      'students',
      firebaseUser.uid
    )

    try {
      const snap = await getDoc(ref)

      if (snap.exists()) {
        const profile = snap.data()

        // Cache the last-known profile so a temporary
        // Firestore outage doesn't degrade the experience.
        cacheProfile(firebaseUser.uid, profile)

        if (profile.onboarded) {
          sessionStorage.setItem(
            `onboarded_${firebaseUser.uid}`,
            'true'
          )
        }

        return profile
      }

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

      // Try to create the profile.
      // If this fails, the app can still continue.
      try {
        await setDoc(ref, newProfile)
        cacheProfile(firebaseUser.uid, newProfile)
      } catch (err) {
        console.error(
          'Could not create profile:',
          err
        )
      }

      return newProfile

    } catch (err) {
      console.error(
        'Firestore profile fetch failed:',
        err
      )

      // Important:
      // Firestore failed, but Firebase Auth succeeded.
      // Keep the user logged in and use the cached /
      // fallback profile instead of logging them out.
      return createFallbackProfile(firebaseUser)
    }
  }

  useEffect(() => {
    let mounted = true
    let unsub

    // Ask Firebase to persist the session across
    // tabs / browser restarts. Note: this mostly controls
    // future sign-ins, while onAuthStateChanged restores
    // the existing session regardless.
    setPersistence(
      auth,
      browserLocalPersistence
    ).catch((err) => {
      console.error(
        'Failed to set auth persistence:',
        err
      )
    })

    // Safety net — never leave the app stuck on a spinner.
    const safetyTimer = setTimeout(() => {
      setLoading(false)
    }, 8000)

    unsub = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        clearTimeout(safetyTimer)

        if (firebaseUser) {
          try {
            const profilePromise =
              getOrCreateProfile(firebaseUser)

            const timeoutPromise =
              new Promise((_, reject) =>
                setTimeout(
                  () =>
                    reject(
                      new Error(
                        'Profile fetch timeout'
                      )
                    ),
                  5000
                )
              )

            const profile =
              await Promise.race([
                profilePromise,
                timeoutPromise,
              ])

            if (!mounted) return

            setUser({
              ...firebaseUser,
              profile,
            })
          } catch (err) {
            console.error(
              'Auth profile error:',
              err
            )

            if (!mounted) return

            // Firebase Auth succeeded.
            // Only the Firestore profile failed.
            // The user should NOT be logged out.
            setUser({
              ...firebaseUser,
              profile:
                createFallbackProfile(
                  firebaseUser
                ),
            })
          }
        } else {
          if (!mounted) return
          setUser(null)
        }

        if (mounted) {
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(safetyTimer)

      if (unsub) {
        unsub()
      }
    }
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
    const currentUser = auth.currentUser

    try {
      await signOut(auth)
    } finally {
      // Explicit logout — remove the locally stored
      // profile copy for hygiene / shared devices.
      if (currentUser) {
        clearCachedProfile(currentUser.uid)
      }
    }
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