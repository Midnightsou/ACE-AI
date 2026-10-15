// AuthShell.jsx - thin Grim wrapper that delegates to the existing AuthLayout
// so login / signup keep the violet card styling while getting the mascot.
import GrimMascot from './GrimMascot'
import AuthLayout from './auth/AuthLayout'

export default function AuthShell({ mood = 'welcome', eyebrow, title, subtitle, children, footer }) {
  return (
    <AuthLayout eyebrow={eyebrow} title={title} subtitle={subtitle} footer={footer} mascot={<GrimMascot mood={mood} size={104} />}>
      {children}
    </AuthLayout>
  )
}
