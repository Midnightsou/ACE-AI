import { useState } from 'react'
import { useUserStore } from '../store/userStore'
import { canUseFeature, getUpgradeMessage, getUserPlan } from '../config/pricing'

export function useLimits() {
  const user = useUserStore((s) => s.user)
  const [upgradePrompt, setUpgradePrompt] = useState(null)

  function checkLimit(feature, currentCount = 0) {
    const profile = user?.profile
    const allowed = canUseFeature(profile, feature, currentCount)

    if (!allowed) {
      setUpgradePrompt({
        feature,
        message: getUpgradeMessage(feature),
      })
      return false
    }
    return true
  }

  function dismissPrompt() {
    setUpgradePrompt(null)
  }

  const plan = getUserPlan(user?.profile)

  return { checkLimit, upgradePrompt, dismissPrompt, plan }
}