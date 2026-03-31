import { useEffect, useRef, useState } from 'react';
import { 
  FileText, 
  Users, 
  Shield, 
  MessageSquare, 
  Clock, 
  Globe,
  Zap,
  Lock
} from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'AI Document Generation',
    description: 'Generate legal documents in under 60 seconds. NDAs, rental agreements, partnership deeds, and more.',
    color: 'bg-red-500',
    stat: '60 sec',
    statLabel: 'Average generation time',
  },
  {
    icon: Users,
    title: 'Expert Lawyer Network',
    description: 'Connect with verified lawyers across India. Filter by specialization, language, and location.',
    color: 'bg-red-500',
    stat: '10,000+',
    statLabel: 'Verified lawyers',
  },
  {
    icon: Shield,
    title: 'Compliance Monitoring',
    description: 'Never miss a deadline. Get alerts for GST filings, RERA renewals, and contract expiries.',
    color: 'bg-amber-500',
    stat: '99.9%',
    statLabel: 'On-time compliance',
  },
  {
    icon: MessageSquare,
    title: 'AI Legal Assistant',
    description: 'Get instant answers to your legal questions. Available 24/7 in multiple Indian languages.',
    color: 'bg-purple-500',
    stat: '24/7',
    statLabel: 'Always available',
  },
  {
    icon: Clock,
    title: 'Zero Platform Fees',
    description: 'No subscriptions. Book any lawyer — you only pay the consultation fee. Platform earns a small 3–5% commission.',
    color: 'bg-rose-500',
    stat: '0',
    statLabel: 'Upfront cost to users',
  },
  {
    icon: Globe,
    title: 'Multi-Language Support',
    description: 'Access legal services in Hindi, Marathi, Tamil, Telugu, and 6+ other Indian languages.',
    color: 'bg-cyan-500',
    stat: '10+',
    statLabel: 'Indian languages',
  },
  {
    icon: Zap,
    title: 'Fast Consultations',
    description: 'Book video consultations with lawyers within 24 hours. No more waiting for appointments.',
    color: 'bg-orange-500',
    stat: '< 24 hrs',
    statLabel: 'Booking to consultation',
  },
  {
    icon: Lock,
    title: 'Bank-Grade Security',
    description: 'Your documents are encrypted with AES-256 and stored securely. Aadhaar verification supported.',
    color: 'bg-red-500',
    stat: '256-bit',
    statLabel: 'Encryption',
  },
];

export function Features() {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    
    itemRefs.current.forEach((ref, index) => {
      if (ref) {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setVisibleItems(prev => new Set([...prev, index]));
              observer.unobserve(ref);
            }
          },
          { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
        );
        observer.observe(ref);
        observers.push(observer);
      }
    });

    return () => observers.forEach(obs => obs.disconnect());
  }, []);

  return (
    <section id="features" className="py-20 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span className="inline-block px-4 py-1.5 bg-red-100 text-red-700 text-sm font-semibold rounded-full mb-4">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Everything You Need for
            <span className="text-red-600"> Legal Success</span>
          </h2>
          <p className="text-lg text-gray-600">
            From document generation to compliance monitoring, NextGenLegal provides 
            a complete suite of legal tools designed for individuals and businesses in India.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              ref={el => { itemRefs.current[index] = el; }}
              className={`group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 ${
                visibleItems.has(index) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${(index % 4) * 100}ms` }}
            >
              {/* Icon */}
              <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                {feature.description}
              </p>

              {/* Stat */}
              <div className="pt-4 border-t border-gray-100">
                <div className="text-2xl font-bold text-gray-900">{feature.stat}</div>
                <div className="text-xs text-gray-500">{feature.statLabel}</div>
              </div>

              {/* Hover Gradient */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            Ready to transform your legal experience?
          </p>
          <a 
            href="/lawyers"
            className="inline-flex items-center gap-2 text-red-600 font-semibold hover:text-red-700 transition-colors"
          >
            Find the Right Lawyer
            <span className="text-lg">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
