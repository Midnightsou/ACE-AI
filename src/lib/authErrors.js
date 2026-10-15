const MESSAGES = {
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/wrong-password': 'Wrong password.',
  'auth/user-not-found': 'No account with that email.',
  'auth/invalid-email': 'That email address does not look right.',
  'auth/email-already-in-use': 'An account with this email already exists. Try logging in.',
  'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Wait a bit and try again.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/network-request-failed': 'No internet connection. Check your network and retry.',
  'auth/popup-blocked': 'Your browser blocked the Google window. Allow pop-ups and retry.',
}

// User closed the Google window on purpose: not an error worth showing.
const SILENT = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request'])

export const authMessage = (code) => MESSAGES[code] ?? 'Something went wrong. Try again.'
export const isSilent = (code) => SILENT.has(code)
