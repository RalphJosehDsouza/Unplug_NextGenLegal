import { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  Sparkles, 
  Zap, 
  Building2,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface PricingProps {
  onSelectPlan: () => void;
}

const plans = [
  {
    id: 'freemium',
    name: 'Freemium',
    description: 'Get started with basic legal tools',
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: Sparkles,
    color: 'bg-gray-500',
    features: [
      '1 document generation per month',
      'Basic AI legal chatbot (5 queries/day)',
      'Access to lawyer directory',
      'Email support',
      'Basic compliance reminders',
    ],
    notIncluded: [
      'Video consultations',
      'Priority support',
      'Advanced compliance monitoring',
      'Document e-signing',
    ],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for individuals and small businesses',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    icon: Zap,
    color: 'bg-indigo-500',
    features: [
      '10 document generations per month',
      'Unlimited AI legal chatbot',
      '2 video consultations per month',
      'Priority email support',
      'Advanced compliance monitoring',
      'GST filing reminders',
      'Document e-signing (5/month)',
    ],
    notIncluded: [
      'Dedicated account manager',
      'Custom document templates',
    ],
    cta: 'Start Starter Plan',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing businesses with complex needs',
    monthlyPrice: 999,
    yearlyPrice: 9990,
    icon: Building2,
    color: 'bg-blue-500',
    features: [
      'Unlimited document generations',
      'Unlimited AI legal chatbot',
      '10 video consultations per month',
      'Priority phone & email support',
      'Advanced compliance monitoring',
      'All compliance types included',
      'Unlimited document e-signing',
      'Dedicated account manager',
      'Custom document templates',
      'API access',
    ],
    notIncluded: [],
    cta: 'Start Pro Plan',
    popular: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solutions for large organizations',
    monthlyPrice: null,
    yearlyPrice: null,
    icon: Building2,
    color: 'bg-purple-500',
    features: [
      'Everything in Pro',
      'Unlimited video consultations',
      '24/7 dedicated support',
      'Custom integrations',
      'On-premise deployment option',
      'SLA guarantee',
      'Team training sessions',
      'White-label options',
    ],
    notIncluded: [],
    cta: 'Contact Sales',
    popular: false,
  },
];

export function Pricing({ onSelectPlan }: PricingProps) {
  const [isYearly, setIsYearly] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const formatPrice = (price: number | null) => {
    if (price === null) return 'Custom';
    return `₹${price}`;
  };

  return (
    <section 
      id="pricing" 
      ref={sectionRef}
      className="py-20 lg:py-32 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center max-w-3xl mx-auto mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full mb-4">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent <span className="text-indigo-600">Pricing</span>
          </h2>
          <p className="text-lg text-gray-600">
            Choose the plan that fits your needs. All plans include a 14-day free trial.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className={`flex items-center justify-center gap-4 mb-12 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}>Monthly</span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <span className={`text-sm font-medium ${isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
            Yearly
            <Badge className="ml-2 bg-indigo-100 text-indigo-700">Save 20%</Badge>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl p-6 border transition-all duration-500 ${
                plan.popular 
                  ? 'border-indigo-500 shadow-xl shadow-indigo-500/10 lg:scale-105 lg:-my-4' 
                  : 'border-gray-100 shadow-sm hover:shadow-lg'
              } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${200 + index * 100}ms` }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-indigo-600 text-white px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <div className={`w-12 h-12 ${plan.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  <plan.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(isYearly ? plan.yearlyPrice : plan.monthlyPrice)}
                  </span>
                  {plan.monthlyPrice !== null && (
                    <span className="text-gray-500">/{isYearly ? 'year' : 'month'}</span>
                  )}
                </div>
                {isYearly && plan.yearlyPrice && plan.monthlyPrice && (
                  <p className="text-sm text-indigo-600 mt-1">
                    Save ₹{(plan.monthlyPrice * 12) - plan.yearlyPrice}/year
                  </p>
                )}
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
                {plan.notIncluded.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 opacity-50">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-400">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Button
                onClick={onSelectPlan}
                className={`w-full ${
                  plan.popular 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ))}
        </div>

        {/* Bottom Note */}
        <div className={`mt-12 text-center transition-all duration-700 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-gray-600 mb-4">
            All plans include a 14-day free trial. No credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-500" />
              Cancel anytime
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-500" />
              24/7 support
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-500" />
              Secure payments
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
