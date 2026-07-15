export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'NGN',
    interval: null,
    badge: null,
    color: 'zinc',
    limits: {
      dailyMessages: 50,
      toolGenerations: 5,
      dojoSources: 2,
      essayWordCount: 1000,
    },
    features: [
      '50 AI messages per day',
      'Access to all tools (limited)',
      '5 tool generations per day',
      'Dojo — 2 sources max',
      'Essays up to 1,000 words',
      'English language only',
      'Standard response speed',
    ],
    notIncluded: [
      'Unlimited messages',
      'Priority AI speed',
      'All languages',
      'Essay up to 5,000 words',
      'Unlimited Dojo sources',
      'CV PDF export',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 3000,
    currency: 'NGN',
    interval: 'month',
    badge: 'Most popular',
    color: 'violet',
    paystackPlanCode: 'https://paystack.shop/pay/mhde5l8ok5',
    limits: {
      dailyMessages: 200,
      toolGenerations: 50,
      dojoSources: 10,
      essayWordCount: 5000,
    },
    features: [
      '200 AI messages per day',
      'All tools — unlimited',
      '50 tool generations per day',
      'Dojo — 10 sources',
      'Essays up to 5,000 words',
      'All 4 languages (Pidgin, Yoruba, Hausa)',
      'Priority AI speed',
      'CV & Cover Letter PDF export',
      
    ],
    notIncluded: [
      'Unlimited messages',
      'Team collaboration',
    ],
  },
  proPlus: {
    id: 'proPlus',
    name: 'Pro+',
    price: 20000,
    currency: 'NGN',
    interval: 'month',
    badge: 'Best value',
    color: 'amber',
    paystackPlanCode: 'https://paystack.shop/pay/uv33thjg9o',
    limits: {
      dailyMessages: Infinity,
      toolGenerations: Infinity,
      dojoSources: Infinity,
      essayWordCount: 7000,
    },
    features: [
      'Unlimited AI messages',
      'All tools — unlimited',
      'Unlimited tool generations',
      'Dojo — unlimited sources',
      'Essays up to 7,000 words',
      'All 4 languages',
      'Fastest AI speed (R1 for all)',
      'CV & Cover Letter PDF export',
      
      'Priority support',
      'Early access to new features',
    ],
    notIncluded: [],
  },
}

export function getUserPlan(profile) {
  if (profile?.plan === 'proPlus') return PLANS.proPlus
  if (profile?.plan === 'pro' || profile?.isPro) return PLANS.pro
  return PLANS.free
}

export function canUseFeature(profile, feature, currentCount = 0) {
  if (profile?.isAdmin || profile?.isTester) return true

  const plan = getUserPlan(profile)

  switch (feature) {
    case 'message':
      return plan.limits.dailyMessages === Infinity ||
        currentCount < plan.limits.dailyMessages
    case 'toolGeneration':
      return plan.limits.toolGenerations === Infinity ||
        currentCount < plan.limits.toolGenerations
    case 'dojoSource':
      return plan.limits.dojoSources === Infinity ||
        currentCount < plan.limits.dojoSources
    case 'language':
      return plan.id !== 'free'
    case 'imageGeneration':
      return plan.id !== 'free'
    case 'pdfExport':
      return plan.id !== 'free'
    default:
      return true
  }
}

export function getUpgradeMessage(feature) {
  const messages = {
    message: "You've used all your free messages today. Upgrade to Pro for 200 messages/day.",
    toolGeneration: "You've reached your daily tool limit. Upgrade to Pro for 50 generations/day.",
    dojoSource: "Free plan allows 2 sources. Upgrade to Pro for up to 10 sources.",
    language: "Local languages are a Pro feature. Upgrade to use Pidgin, Yoruba, and Hausa.",
    imageGeneration: "Image generation is a Pro feature.",
    pdfExport: "PDF export is a Pro feature. Upgrade to download your documents.",
  }
  return messages[feature] || "Upgrade to Pro to access this feature."
}