import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { PLANS, getUserPlan } from '../config/pricing'
import { updateProfile } from '../services/memory'

function PlanCard({ plan, currentPlan, onSelect, loading }) {
  const isCurrentPlan = currentPlan.id === plan.id
  const colorMap = {
    zinc: { bg: 'bg-zinc-50', border: 'border-zinc-200', badge: 'bg-zinc-100 text-zinc-600', btn: 'bg-zinc-800 hover:bg-zinc-700 text-white' },
    violet: { bg: 'bg-violet-50', border: 'border-violet-300', badge: 'bg-violet-100 text-violet-700', btn: 'bg-violet-600 hover:bg-violet-700 text-white' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-300', badge: 'bg-amber-100 text-amber-700', btn: 'bg-amber-500 hover:bg-amber-600 text-white' },
  }
  const colors = colorMap[plan.color]

  return (
    <div className={`relative rounded-2xl border-2 p-6 flex flex-col gap-5 transition-all
      ${isCurrentPlan ? `${colors.border} ${colors.bg}` : 'border-zinc-200 bg-white hover:border-zinc-300'}`}
    >
      {plan.badge && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
          {plan.badge}
        </div>
      )}

      {/* Header */}
      <div>
        <p className="text-lg font-bold text-zinc-900">{plan.name}</p>
        <div className="flex items-baseline gap-1 mt-2">
          {plan.price === 0 ? (
            <span className="text-3xl font-bold text-zinc-900">Free</span>
          ) : (
            <>
              <span className="text-3xl font-bold text-zinc-900">
                ₦{plan.price.toLocaleString()}
              </span>
              <span className="text-sm text-zinc-400">/ month</span>
            </>
          )}
        </div>
      </div>

      {/* CTA */}
      {isCurrentPlan ? (
        <div className="w-full py-3 rounded-xl border border-zinc-200 text-sm text-center text-zinc-500 font-medium">
          Current plan
        </div>
      ) : (
        <button
          onClick={() => onSelect(plan)}
          disabled={loading}
          className={`w-full py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${colors.btn}`}
        >
          {loading ? 'Processing...' : plan.price === 0 ? 'Downgrade to Free' : `Upgrade to ${plan.name}`}
        </button>
      )}

      {/* Features */}
      <div className="flex flex-col gap-2">
        {plan.features.map((f) => (
          <div key={f} className="flex items-start gap-2 text-sm">
            <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            <span className="text-zinc-700">{f}</span>
          </div>
        ))}
        {plan.notIncluded.map((f) => (
          <div key={f} className="flex items-start gap-2 text-sm">
            <svg className="w-4 h-4 text-zinc-300 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            <span className="text-zinc-400">{f}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PricingPage() {
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const setUser = useUserStore((s) => s.setUser)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const currentPlan = getUserPlan(user?.profile)

  async function handleSelectPlan(plan) {
    if (plan.id === currentPlan.id) return

    // Free plan — downgrade immediately
    if (plan.id === 'free') {
      setLoading(true)
      try {
        await updateProfile(user.uid, { plan: 'free', isPro: false })
        setUser({ ...user, profile: { ...user.profile, plan: 'free', isPro: false } })
        navigate('/chat')
      } catch {
        setError('Failed to update plan.')
      } finally {
        setLoading(false)
      }
      return
    }

    // Paid plans — Paystack
    setLoading(true)
    setError(null)

    try {
      // Load Paystack inline
      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v1/inline.js'
      document.head.appendChild(script)

      script.onload = () => {
        const handler = window.PaystackPop.setup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
          email: user.email,
          amount: plan.price * 100, // kobo
          currency: 'NGN',
          plan: plan.paystackPlanCode,
          metadata: {
            uid: user.uid,
            plan: plan.id,
          },
          callback: async (response) => {
            // Payment successful
            try {
              await updateProfile(user.uid, {
                plan: plan.id,
                isPro: true,
                paystackReference: response.reference,
                planActivatedAt: new Date().toISOString(),
              })
              setUser({
                ...user,
                profile: { ...user.profile, plan: plan.id, isPro: true },
              })
              navigate('/chat')
            } catch {
              setError('Payment received but plan update failed. Contact support.')
            }
          },
          onClose: () => {
            setLoading(false)
          },
        })
        handler.openIframe()
      }
    } catch (err) {
      setError('Payment failed. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-100 px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <p className="text-base font-bold text-zinc-900">Plans & Pricing</p>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-10">

        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-zinc-900">Choose your plan</h1>
          <p className="text-zinc-500 mt-3 text-lg">
            Start free. Upgrade when you need more.
          </p>
          {currentPlan.id !== 'free' && (
            <div className="inline-flex items-center gap-2 mt-4 bg-violet-50 border border-violet-200 rounded-full px-4 py-2 text-sm text-violet-700">
              <span>⭐</span>
              You're on the {currentPlan.name} plan
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-6 text-center">
            {error}
          </div>
        )}

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.values(PLANS).map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlan={currentPlan}
              onSelect={handleSelectPlan}
              loading={loading}
            />
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-zinc-800 text-center">Common questions</h2>
          {[
            {
              q: 'Can I cancel anytime?',
              a: 'Yes. Cancel anytime and your plan stays active until the end of the billing period.',
            },
            {
              q: 'What payment methods are accepted?',
              a: 'Card, bank transfer, USSD, and mobile money via Paystack.',
            },
            {
              q: 'Is there a student discount?',
              a: 'Coming soon. Follow us on X for updates.',
            },
            {
              q: 'What happens when I hit my daily limit?',
              a: "You'll see an upgrade prompt. Your conversations are saved and you can continue the next day or upgrade immediately.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="bg-white border border-zinc-100 rounded-xl p-5">
              <p className="text-sm font-semibold text-zinc-800">{q}</p>
              <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}