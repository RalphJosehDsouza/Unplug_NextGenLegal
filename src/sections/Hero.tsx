import { Button } from '@/components/ui/button';
import { ArrowRight, Star, CheckCircle2, Sparkles, FileText, Users, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

interface HeroProps {
  onGetStarted: () => void;
}

export function Hero({ onGetStarted }: HeroProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    { icon: FileText, label: 'Analyze' },
    { icon: Sparkles, label: 'Train' },
    { icon: Users, label: 'Testing' },
    { icon: Shield, label: 'Deploy' },
  ];

  return (
    <section className="relative min-h-screen pt-20 lg:pt-24 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-50/50 via-white to-white" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className={`space-y-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Rating Badge */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">5.0</span> over <span className="font-semibold text-gray-900">24.5K+</span> Reviews
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Do More. Stress Less.
                <br />
                <span className="text-gray-400">Let AI Handle It.</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-lg">
                Our AI connects with legal experts to help you draft documents, 
                find lawyers, and stay compliant — all at affordable prices.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={onGetStarted}
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-base font-semibold rounded-full shadow-lg shadow-red-600/20"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="px-8 py-6 text-base font-semibold rounded-full border-gray-300"
              >
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 pt-4">
              {[
                'AI-Powered',
                '24/7 Support',
                'Secure & Private',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Hero Card */}
          <div className={`relative transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {features.map((feature, index) => (
                <div 
                  key={feature.label}
                  className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <feature.icon className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-gray-700">{feature.label}</span>
                </div>
              ))}
            </div>

            {/* Main Card */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-red-900/10">
              {/* Nature Background */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-red-100 via-red-50 to-red-200">
                <img 
                  src="https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80"
                  alt="Nature landscape"
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay Card */}
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 w-full max-w-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Set Up Your AI Workspace</h3>
                      <button className="text-gray-400 hover:text-gray-600">
                        <span className="text-lg">&times;</span>
                      </button>
                    </div>
                    
                    {/* Progress */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-red-600">25%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full w-1/4 bg-gradient-to-r from-red-500 to-red-600 rounded-full" />
                      </div>
                    </div>

                    {/* Steps */}
                    <div className="space-y-3">
                      {[
                        { label: 'Select AI Agent Type', done: true },
                        { label: 'Auto Onboarding...', done: false, active: true },
                        { label: 'Activate AI Assistant', done: false },
                        { label: 'Start Using Agent', done: false },
                      ].map((step, i) => (
                        <div 
                          key={i}
                          className={`flex items-center gap-3 p-3 rounded-xl ${
                            step.done ? 'bg-red-50' : step.active ? 'bg-gray-50 border border-gray-200' : 'bg-gray-50/50'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            step.done ? 'bg-red-600' : 'bg-gray-300'
                          }`}>
                            {step.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <span className={`text-sm ${step.done ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
