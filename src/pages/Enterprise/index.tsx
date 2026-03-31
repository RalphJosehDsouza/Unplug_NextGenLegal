import { useState } from 'react';
import { Building2, Users, Shield, FileText, Scale, MessageSquare, CheckCircle, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/api/axios';

const FEATURES = [
  { icon: MessageSquare, title: 'AI Legal Chat', desc: 'Instant answers to legal questions' },
  { icon: FileText, title: 'Document Generation', desc: 'Unlimited AI-powered legal documents' },
  { icon: Scale, title: 'Contract Audit', desc: 'AI risk analysis for all contracts' },
  { icon: Users, title: 'Lawyer Access', desc: 'Book consultations with verified lawyers' },
  { icon: Shield, title: 'Compliance Dashboard', desc: 'Track deadlines and regulatory requirements' },
  { icon: Building2, title: 'Business Registration', desc: 'Company incorporation document support' },
];

export function EnterprisePage() {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [employeeCount, setEmployeeCount] = useState(50);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!companyName || !contactName || !email) { toast.error('Company name, contact name, and email are required'); return; }
    setLoading(true);
    try {
      await api.post('/api/enterprise/contact', { company_name: companyName, contact_name: contactName, email, phone, employee_count: employeeCount, message });
      setSubmitted(true);
      toast.success('Thank you! We\'ll contact you within 24 hours.');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Submission failed');
    } finally { setLoading(false); }
  };

  return (
    <section className="pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4">
        {/* Hero */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-red-100 text-red-700 text-sm font-semibold rounded-full mb-4">Enterprise</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Legal Benefits for <span className="text-red-600">Your Team</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Give your employees access to AI-powered legal assistance as a workplace benefit. Starting at ₹399/employee/month.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg hover:border-red-200 transition-all">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Volume Pricing */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-3xl p-8 sm:p-12 text-white text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Volume Discounts Available</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { range: '10-50 employees', price: '₹399/employee/mo' },
              { range: '51-200 employees', price: '₹299/employee/mo' },
              { range: '200+ employees', price: 'Custom pricing' },
            ].map(tier => (
              <div key={tier.range} className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
                <div className="text-sm opacity-90 mb-1">{tier.range}</div>
                <div className="text-xl font-bold">{tier.price}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Get Started</h2>
            <p className="text-gray-600">Tell us about your organization and we'll tailor a plan for you.</p>
          </div>

          {submitted ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
              <p className="text-gray-600">Our enterprise team will contact you within 24 hours.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="block w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="Your company" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
                  <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} className="block w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="block w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="you@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="block w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="+91..." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Employees: {employeeCount}</label>
                <input type="range" min={5} max={500} value={employeeCount} onChange={e => setEmployeeCount(parseInt(e.target.value))} className="w-full accent-red-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} className="block w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="Tell us about your needs..." />
              </div>
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white py-3" onClick={handleSubmit} disabled={loading}>
                {loading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Sending...</> : <><Send className="w-5 h-5 mr-2" /> Contact Sales</>}
              </Button>
            </div>
          )}

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> SOC 2 Compliant</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Powered by Gemini AI</span>
            <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> 17+ Legal Tools</span>
          </div>
        </div>
      </div>
    </section>
  );
}
