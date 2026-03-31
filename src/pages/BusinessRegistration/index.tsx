import { useState } from 'react';
import { Building2, ArrowRight, ArrowLeft, Loader2, Download, Users, FileText, Briefcase, Scale, Store, Factory, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/api/axios';

const ENTITY_TYPES = [
  { id: 'private_limited', label: 'Private Limited', icon: Building2, desc: 'Best for startups raising funding', govtFee: '₹12,000–₹35,000', timeline: '10–15 days' },
  { id: 'llp', label: 'LLP', icon: Briefcase, desc: 'Ideal for professionals & small firms', govtFee: '₹8,000–₹25,000', timeline: '7–12 days' },
  { id: 'opc', label: 'One Person Company', icon: Users, desc: 'Solo entrepreneur with limited liability', govtFee: '₹9,000–₹28,000', timeline: '10–15 days' },
  { id: 'partnership', label: 'Partnership Firm', icon: Scale, desc: 'Simple structure for 2+ partners', govtFee: '₹500–₹2,000', timeline: '3–5 days' },
  { id: 'sole_proprietorship', label: 'Sole Proprietorship', icon: Store, desc: 'Simplest form, no registration needed', govtFee: '₹0–₹500', timeline: '1–2 days' },
  { id: 'section_8', label: 'Section 8 (Nonprofit)', icon: Leaf, desc: 'For charitable or social purposes', govtFee: '₹10,000–₹25,000', timeline: '15–20 days' },
  { id: 'producer_company', label: 'Producer Company', icon: Factory, desc: 'For farmer cooperatives & producer groups', govtFee: '₹15,000–₹30,000', timeline: '15–25 days' },
];

const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];

type Director = { name: string; din: string; address: string; email: string; phone: string };

export function BusinessRegistration() {
  const [step, setStep] = useState(0);
  const [entityType, setEntityType] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [state, setState] = useState('');
  const [address, setAddress] = useState('');
  const [mainObjects, setMainObjects] = useState('');
  const [directors, setDirectors] = useState<Director[]>([{ name: '', din: '', address: '', email: '', phone: '' }]);
  const [authCapital, setAuthCapital] = useState('');
  const [paidUpCapital, setPaidUpCapital] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const addDirector = () => setDirectors([...directors, { name: '', din: '', address: '', email: '', phone: '' }]);
  const updateDirector = (idx: number, field: keyof Director, val: string) => {
    const updated = [...directors];
    updated[idx] = { ...updated[idx], [field]: val };
    setDirectors(updated);
  };
  const removeDirector = (idx: number) => setDirectors(directors.filter((_, i) => i !== idx));

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const createResp = await api.post('/api/business/register', {
        entity_type: entityType, company_name: companyName, state, registered_address: address,
        directors, authorized_capital: parseInt(authCapital) || 0, paid_up_capital: parseInt(paidUpCapital) || 0, main_objects: mainObjects,
      });
      const regId = createResp.data.data.id;
      const genResp = await api.post(`/api/business/registrations/${regId}/generate-docs`);
      setResult(genResp.data.data);
      toast.success('Documents generated successfully!');
      setStep(4);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to generate documents');
    } finally { setLoading(false); }
  };

  const entityInfo = ENTITY_TYPES.find(e => e.id === entityType);
  const showCapital = !['partnership', 'sole_proprietorship'].includes(entityType);

  return (
    <section className="pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-1.5 bg-red-100 text-red-700 text-sm font-semibold rounded-full mb-4">Business Registration</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Register Your <span className="text-red-600">Business</span></h1>
          <p className="text-gray-600">AI-powered document generation for company incorporation</p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {['Entity Type', 'Company Details', 'Directors', 'Capital', 'Review'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i <= step ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</div>
              <span className={`text-sm hidden sm:inline ${i <= step ? 'text-red-600 font-medium' : 'text-gray-400'}`}>{label}</span>
              {i < 4 && <div className={`w-8 h-0.5 ${i < step ? 'bg-red-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 0: Entity Type */}
        {step === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ENTITY_TYPES.map(et => {
              const Icon = et.icon;
              return (
                <button key={et.id} onClick={() => { setEntityType(et.id); setStep(1); }}
                  className={`text-left p-5 rounded-2xl border-2 transition-all hover:shadow-lg ${entityType === et.id ? 'border-red-600 bg-red-50' : 'border-gray-100 hover:border-red-300'}`}>
                  <Icon className="w-8 h-8 text-red-600 mb-3" />
                  <h3 className="font-bold text-gray-900 mb-1">{et.label}</h3>
                  <p className="text-sm text-gray-600 mb-3">{et.desc}</p>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>Govt: {et.govtFee}</span>
                    <span>~{et.timeline}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 1: Company Details */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-5">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Company Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="block w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500" placeholder="e.g., NextGen Technologies Pvt Ltd" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
              <select value={state} onChange={e => setState(e.target.value)} className="block w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500">
                <option value="">Select state</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registered Address</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)} rows={3} className="block w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500" placeholder="Full registered address" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Main Business Objects</label>
              <textarea value={mainObjects} onChange={e => setMainObjects(e.target.value)} rows={3} className="block w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500" placeholder="Describe main business activities" />
            </div>
            <div className="flex gap-3 pt-3">
              <Button variant="outline" onClick={() => setStep(0)}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white flex-1" onClick={() => setStep(2)} disabled={!companyName || !state}>
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Directors */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-900">Directors / Partners</h3>
              <Button variant="outline" size="sm" onClick={addDirector}>+ Add</Button>
            </div>
            {directors.map((d, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Director {i + 1}</span>
                  {directors.length > 1 && <button onClick={() => removeDirector(i)} className="text-xs text-red-500 hover:text-red-700">Remove</button>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" value={d.name} onChange={e => updateDirector(i, 'name', e.target.value)} placeholder="Full Name *" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  <input type="text" value={d.din} onChange={e => updateDirector(i, 'din', e.target.value)} placeholder="DIN (optional)" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  <input type="email" value={d.email} onChange={e => updateDirector(i, 'email', e.target.value)} placeholder="Email" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  <input type="text" value={d.phone} onChange={e => updateDirector(i, 'phone', e.target.value)} placeholder="Phone" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <textarea value={d.address} onChange={e => updateDirector(i, 'address', e.target.value)} placeholder="Address" rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            ))}
            <div className="flex gap-3 pt-3">
              <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white flex-1" onClick={() => setStep(showCapital ? 3 : 4)} disabled={!directors[0]?.name}>
                {showCapital ? 'Next' : 'Review'} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Capital */}
        {step === 3 && showCapital && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-5">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Capital Structure</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Authorized Capital (₹)</label>
              <input type="number" value={authCapital} onChange={e => setAuthCapital(e.target.value)} className="block w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="e.g., 1000000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paid-up Capital (₹)</label>
              <input type="number" value={paidUpCapital} onChange={e => setPaidUpCapital(e.target.value)} className="block w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="e.g., 100000" />
            </div>
            <div className="flex gap-3 pt-3">
              <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white flex-1" onClick={() => setStep(4)}>
                Review <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Generate */}
        {step === 4 && !result && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Review & Generate</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Entity Type:</span> <span className="font-medium">{entityInfo?.label}</span></div>
                <div><span className="text-gray-500">Company:</span> <span className="font-medium">{companyName}</span></div>
                <div><span className="text-gray-500">State:</span> <span className="font-medium">{state}</span></div>
                <div><span className="text-gray-500">Directors:</span> <span className="font-medium">{directors.filter(d => d.name).length}</span></div>
                {showCapital && <div><span className="text-gray-500">Auth. Capital:</span> <span className="font-medium">₹{authCapital || '0'}</span></div>}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
                <p className="text-sm text-amber-700"><strong>Govt fees (est.):</strong> {entityInfo?.govtFee} — paid separately when your lawyer files with MCA.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(showCapital ? 3 : 2)}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white flex-1" onClick={handleGenerate} disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</> : <><FileText className="w-4 h-4 mr-2" /> Generate Documents</>}
              </Button>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Documents Generated!</h3>
              <p className="text-sm text-gray-600 mt-1">{result.documents?.length || 0} documents ready</p>
            </div>
            <div className="space-y-3 mb-6">
              {(result.documents || []).map((doc: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-gray-900">{doc.name}</span>
                  </div>
                  <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Preview</Button>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-700">
                <strong>Next step:</strong> Find a lawyer to file these documents with MCA.{' '}
                <a href="/lawyers" className="underline font-semibold hover:text-blue-900">Find a Lawyer →</a>
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
