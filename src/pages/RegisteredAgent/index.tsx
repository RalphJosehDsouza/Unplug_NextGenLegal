import { useState, useEffect } from 'react';
import { Shield, Copy, Check, Mail, Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/api/axios';

const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];

export function RegisteredAgentPage() {
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [businessName, setBusinessName] = useState('');
  const [entityType, setEntityType] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [state, setState] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    api.get('/api/registered-agent/status')
      .then(resp => setAgent(resp.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSignup = async () => {
    if (!businessName || !state || !email) { toast.error('Business name, state, and email are required'); return; }
    setSaving(true);
    try {
      const resp = await api.post('/api/registered-agent/signup', {
        business_name: businessName, entity_type: entityType, registration_number: regNumber,
        registered_state: state, notifications_email: email,
      });
      setAgent(resp.data.data);
      toast.success('Registered agent activated!');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Signup failed');
    } finally { setSaving(false); }
  };

  const copyAddress = () => {
    if (agent?.agent_address) {
      navigator.clipboard.writeText(agent.agent_address);
      setCopied(true);
      toast.success('Address copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <div className="pt-24 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-red-600" /></div>;

  return (
    <section className="pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-1.5 bg-red-100 text-red-700 text-sm font-semibold rounded-full mb-4">Registered Agent</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Your <span className="text-red-600">Registered Agent</span> Service</h1>
          <p className="text-gray-600">A professional registered address for your business — receive legal notices, maintain compliance</p>
        </div>

        {/* Info cards */}
        {!agent && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: Shield, title: 'Compliance', desc: 'Stay compliant with MCA/ROC requirements' },
                { icon: Mail, title: 'Notifications', desc: 'Get instant email alerts for legal notices' },
                { icon: Building2, title: 'Privacy', desc: 'Use our address instead of your personal one' },
              ].map(item => (
                <div key={item.title} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
                  <item.icon className="w-8 h-8 text-red-600 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-5">
              <h3 className="text-xl font-bold text-gray-900">Activate Registered Agent</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                  <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} className="block w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="Company name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                  <input type="text" value={entityType} onChange={e => setEntityType(e.target.value)} className="block w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="e.g., Pvt Ltd, LLP" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                  <input type="text" value={regNumber} onChange={e => setRegNumber(e.target.value)} className="block w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="CIN / LLPIN (optional)" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <select value={state} onChange={e => setState(e.target.value)} className="block w-full border border-gray-300 rounded-xl px-4 py-3">
                    <option value="">Select state</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notification Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="block w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="you@company.com" />
              </div>
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white py-3" onClick={handleSignup} disabled={saving}>
                {saving ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Activating...</> : 'Activate Registered Agent'}
              </Button>
            </div>
          </>
        )}

        {/* Active Dashboard */}
        {agent && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{agent.business_name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${agent.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{agent.status?.toUpperCase()}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Your Registered Address</label>
              <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-900 flex-1">{agent.agent_address}</p>
                <button onClick={copyAddress} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">State:</span> <span className="font-medium">{agent.registered_state}</span></div>
              <div><span className="text-gray-500">Entity:</span> <span className="font-medium">{agent.entity_type || 'N/A'}</span></div>
              <div><span className="text-gray-500">Reg. No:</span> <span className="font-medium">{agent.registration_number || 'N/A'}</span></div>
              <div><span className="text-gray-500">Notifications:</span> <span className="font-medium">{agent.notifications_email}</span></div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
