import { useState } from 'react';
import { Check, X, Sparkles, Zap, Crown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    icon: Zap,
    monthly: 499,
    yearly: 4199,
    desc: 'For individuals needing basic AI legal help',
    color: 'blue',
    features: [
      { name: 'AI Legal Chat Assistant', included: true },
      { name: 'Contract Audit Tool', included: true },
      { name: 'Business Name Generator', included: true },
      { name: '10 Documents / month', included: true },
      { name: 'Basic Templates', included: true },
      { name: 'Browse & Book Lawyers', included: true },
      { name: 'Doc Review & eSign', included: false },
      { name: 'RTI Assistant', included: false },
      { name: 'Business Registration', included: false },
      { name: 'Trademark Filing', included: false },
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    icon: Sparkles,
    monthly: 1499,
    yearly: 12499,
    desc: 'For professionals & frequent document users',
    color: 'red',
    popular: true,
    features: [
      { name: 'Everything in Starter', included: true },
      { name: 'Unlimited Documents', included: true },
      { name: 'All Templates (Real Estate, Family, Personal)', included: true },
      { name: 'Doc Review & eSign', included: true },
      { name: 'RTI Assistant', included: true },
      { name: 'Legal Notice Tracking', included: true },
      { name: 'Law Mapper', included: true },
      { name: 'Business Registration', included: false },
      { name: 'Trademark Filing', included: false },
      { name: 'AI Logo Maker', included: false },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    icon: Crown,
    monthly: 2499,
    yearly: 24999,
    desc: 'Replaces ₹50K–₹1L+ in annual CA/CS fees',
    color: 'purple',
    features: [
      { name: 'Everything in Professional', included: true },
      { name: 'Business Registration Tools', included: true },
      { name: 'Trademark Filing & Conflict Check', included: true },
      { name: 'AI Logo Maker', included: true },
      { name: 'Registered Agent Service', included: true },
      { name: 'eCourts Tracking', included: true },
      { name: 'Enterprise API Access', included: true },
      { name: 'Priority Support', included: true },
    ],
  },
];

export function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const user = useAuthStore((s) => s.user);

  const handleSubscribe = (planId: string) => {
    // For demo, just show toast
    toast.success(`Subscribed to ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan! (Demo mode)`);
  };

  const formatPrice = (amount: number) => {
    return amount.toLocaleString('en-IN');
  };

  return (
    <section className="pt-20 pb-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-block px-4 py-1.5 bg-red-100 text-red-700 text-sm font-semibold rounded-full mb-4">
            Pricing
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Simple, transparent <span className="text-red-600">pricing</span>
          </h1>
          <p className="text-lg text-gray-600">
            No per-transaction fees. No hidden charges. Your subscription covers everything.
          </p>
        </div>

        {/* Free tier banner */}
        <div className="max-w-2xl mx-auto mb-8 bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Free Plan</h3>
            <p className="text-sm text-gray-600">Browse lawyers, Women's Help, Compliance Dashboard, 1 doc/month</p>
          </div>
          <span className="text-2xl font-bold text-gray-900">₹0</span>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900' : 'text-gray-400'}`}>Monthly</span>
          <button onClick={() => setIsYearly(!isYearly)}
            className="relative w-14 h-7 bg-gray-300 rounded-full transition-colors focus:outline-none"
            style={{ backgroundColor: isYearly ? '#dc2626' : '#d1d5db' }}>
            <div className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-all shadow-sm ${isYearly ? 'left-8' : 'left-1'}`} />
          </button>
          <span className={`text-sm font-medium ${isYearly ? 'text-gray-900' : 'text-gray-400'}`}>
            Yearly <span className="text-red-600 font-semibold ml-1">Save ~30%</span>
          </span>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const price = isYearly ? plan.yearly : plan.monthly;
            const monthlyEquiv = isYearly ? Math.round(plan.yearly / 12) : plan.monthly;
            const isCurrent = user?.subscription_tier === plan.id;
            const borderColor = plan.color === 'blue' ? 'border-blue-500' : plan.color === 'red' ? 'border-red-500' : 'border-purple-500';
            const bgColor = plan.color === 'blue' ? 'bg-blue-600' : plan.color === 'red' ? 'bg-red-600' : 'bg-purple-600';
            const hoverBg = plan.color === 'blue' ? 'hover:bg-blue-700' : plan.color === 'red' ? 'hover:bg-red-700' : 'hover:bg-purple-700';
            const lightBg = plan.color === 'blue' ? 'bg-blue-100 text-blue-700' : plan.color === 'red' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700';

            return (
              <div key={plan.id}
                className={`relative bg-white rounded-3xl p-7 border-2 shadow-sm hover:shadow-xl transition-all duration-300 ${plan.popular ? borderColor : 'border-gray-100'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                    MOST POPULAR
                  </div>
                )}

                <div className={`w-12 h-12 ${lightBg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{plan.desc}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">₹{formatPrice(monthlyEquiv)}</span>
                    <span className="text-gray-500">/mo</span>
                  </div>
                  {isYearly && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-400 line-through">₹{formatPrice(plan.monthly)}/mo</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                        Save ₹{formatPrice(plan.monthly * 12 - plan.yearly)}/yr
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Billed {isYearly ? `₹${formatPrice(price)}/year` : 'monthly'}
                  </p>
                </div>

                <Button
                  className={`w-full ${isCurrent ? 'bg-gray-200 text-gray-600 cursor-default' : `${bgColor} ${hoverBg} text-white`} mb-6`}
                  onClick={() => !isCurrent && handleSubscribe(plan.id)}
                  disabled={isCurrent}
                >
                  {isCurrent ? 'Current Plan' : <>Subscribe <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>

                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f.name} className="flex items-start gap-2 text-sm">
                      {f.included ? (
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={f.included ? 'text-gray-700' : 'text-gray-400'}>{f.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <div className="text-center mt-12 max-w-2xl mx-auto">
          <p className="text-sm text-gray-500">
            All plans include access to the lawyer marketplace. Lawyer consultations are booked and paid separately.
            Government filing fees (e.g., MCA, IP India) are paid directly when your lawyer files — not through the platform.
          </p>
          <a href="/enterprise" className="inline-block mt-4 text-red-600 font-semibold hover:text-red-700 text-sm">
            Need a plan for your team? Explore Enterprise →
          </a>
        </div>
      </div>
    </section>
  );
}
