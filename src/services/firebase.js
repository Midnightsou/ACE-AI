import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import {
  getFirestore,
  enableNetwork,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

console.log('Firebase project:', firebaseConfig.projectId)
console.log('Firebase auth domain:', firebaseConfig.authDomain)
console.log(
  'Firebase API key exists:',
  !!firebaseConfig.apiKey
)

const app =
  getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig)

export const auth = getAuth(app)

export const googleProvider =
  new GoogleAuthProvider()

export const db = getFirestore(app)

console.log(
  '[Firebase] Project:',
  firebaseConfig.projectId
)

console.log(
  '[Firebase] Environment:',
  import.meta.env.MODE
)

enableNetwork(db)
  .then(() => {
    console.log(
      '[Firestore] Network enabled'
    )
  })
  .catch((err) => {
    console.error(
      '[Firestore] Failed to enable network:',
      err
    )
  })

window.addEventListener('online', () => {
  console.log(
    '[Network] Browser is online — reconnecting Firestore'
  )

  enableNetwork(db)
    .catch((err) => {
      console.error(
        '[Firestore] Reconnect failed:',
        err
      )
    })
})

window.addEventListener('offline', () => {
  console.warn(
    '[Network] Browser is offline'
  )
})