import { useState } from 'react';
import { Stamp, ArrowRight, ArrowLeft, Loader2, Search, AlertTriangle, CheckCircle, FileText, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/api/axios';

const MARK_TYPES = [
  { id: 'word', label: 'Word Mark', desc: 'Text-only brand name', example: 'TATA, RELIANCE' },
  { id: 'device', label: 'Device Mark', desc: 'Logo / symbol only', example: 'Apple logo, Nike swoosh' },
  { id: 'combined', label: 'Combined Mark', desc: 'Text + logo together', example: 'Starbucks, Pepsi' },
  { id: 'sound', label: 'Sound Mark', desc: 'Audio signature', example: 'Nokia tune, MGM lion roar' },
];

const NICE_CLASSES = [
  { class: 1, title: 'Chemicals' }, { class: 5, title: 'Pharmaceuticals' }, { class: 9, title: 'Computers & Electronics' },
  { class: 16, title: 'Paper & Printed Goods' }, { class: 25, title: 'Clothing' }, { class: 29, title: 'Processed Food' },
  { class: 30, title: 'Coffee, Tea, Bakery' }, { class: 35, title: 'Advertising & Business' }, { class: 36, title: 'Insurance & Finance' },
  { class: 38, title: 'Telecommunications' }, { class: 41, title: 'Education & Entertainment' }, { class: 42, title: 'Science & Technology' },
  { class: 43, title: 'Hotels & Restaurants' }, { class: 44, title: 'Medical Services' }, { class: 45, title: 'Legal Services' },
];

export function TrademarkPage() {
  const [step, setStep] = useState(0);
  const [markType, setMarkType] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [niceClasses, setNiceClasses] = useState<number[]>([]);
  const [applicantName, setApplicantName] = useState('');
  const [applicantAddress, setApplicantAddress] = useState('');
  const [applicantType, setApplicantType] = useState('individual');
  const [loading, setLoading] = useState(false);
  const [conflictReport, setConflictReport] = useState<any>(null);
  const [appId, setAppId] = useState('');

  const govtFee = applicantType === 'individual' || applicantType === 'startup' ? 4500 : 9000;
  const totalGovtFee = govtFee * Math.max(niceClasses.length, 1);

  const toggleClass = (cls: number) => {
    setNiceClasses(prev => prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]);
  };

  const handleConflictCheck = async () => {
    setLoading(true);
    try {
      // Create application first
      const createResp = await api.post('/api/trademark/apply', {
        mark_type: markType, trademark_name: name, trademark_description: description,
        nice_classes: niceClasses, applicant_name: applicantName,
        applicant_address: applicantAddress, applicant_type: applicantType,
      });
      const id = createResp.data.data.id;
      setAppId(id);

      const resp = await api.post(`/api/trademark/applications/${id}/conflict-check`);
      setConflictReport(resp.data.data.conflict_report);
      toast.success('Conflict check complete!');
      setStep(4);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to run conflict check');
    } finally { setLoading(false); }
  };

  const handleGenerateForms = async () => {
    if (!appId) return;
    setLoading(true);
    try {
      await api.post(`/api/trademark/applications/${appId}/generate-forms`);
      toast.success('TM-A form generated!');
      setStep(5);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to generate forms');
    } finally { setLoading(false); }
  };

  const riskColor = conflictReport?.risk_level === 'low' ? 'green' : conflictReport?.risk_level === 'high' ? 'red' : 'amber';

  return (
    <section className="pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-1.5 bg-red-100 text-red-700 text-sm font-semibold rounded-full mb-4">Trademark Registration</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Protect Your <span className="text-red-600">Brand</span></h1>
          <p className="text-gray-600">AI-powered conflict check and TM-A application generation</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {['Mark Type', 'Details', 'Classification', 'Applicant', 'Conflict Check', 'Generate'].map((label, i) => (
            <div key={label} className="flex items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i <= step ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</div>
              <span className={`text-xs hidden lg:inline ${i <= step ? 'text-red-600' : 'text-gray-400'}`}>{label}</span>
              {i < 5 && <div className={`w-4 h-0.5 ${i < step ? 'bg-red-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 0: Mark Type */}
        {step === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MARK_TYPES.map(mt => (
              <button key={mt.id} onClick={() => { setMarkType(mt.id); setStep(1); }}
                className={`text-left p-6 rounded-2xl border-2 transition-all hover:shadow-lg ${markType === mt.id ? 'border-red-600 bg-red-50' : 'border-gray-100 hover:border-red-300'}`}>
                <Stamp className="w-8 h-8 text-red-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-1">{mt.label}</h3>
                <p className="text-sm text-gray-600 mb-2">{mt.desc}</p>
                <p className="text-xs text-gray-400">e.g., {mt.example}</p>
              </button>
            ))}
          </div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-5">
            <h3 className="text-xl font-bold text-gray-900">Trademark Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trademark Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="block w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="e.g., NextGenLegal" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="block w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="Describe what the mark represents" />
            </div>
            <div className="flex gap-3 pt-3">
              <Button variant="outline" onClick={() => setStep(0)}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white flex-1" onClick={() => setStep(2)} disabled={!name}>Next <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </div>
          </div>
        )}

        {/* Step 2: Nice Classes */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-5">
            <h3 className="text-xl font-bold text-gray-900">Select Nice Classes</h3>
            <p className="text-sm text-gray-600">Choose the categories your trademark applies to. Each class has a separate government fee.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {NICE_CLASSES.map(nc => (
                <button key={nc.class} onClick={() => toggleClass(nc.class)}
                  className={`text-left p-3 rounded-xl border-2 text-sm transition-all ${niceClasses.includes(nc.class) ? 'border-red-600 bg-red-50' : 'border-gray-100 hover:border-red-300'}`}>
                  <span className="font-bold text-gray-900">Class {nc.class}</span>
                  <span className="block text-gray-600 text-xs">{nc.title}</span>
                </button>
              ))}
            </div>
            {niceClasses.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                <Info className="inline w-4 h-4 mr-1" /> Selected {niceClasses.length} class(es) — Est. govt fee: ₹{totalGovtFee.toLocaleString()} (paid when your lawyer files)
              </div>
            )}
            <div className="flex gap-3 pt-3">
              <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white flex-1" onClick={() => setStep(3)} disabled={niceClasses.length === 0}>Next <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </div>
          </div>
        )}

        {/* Step 3: Applicant */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-5">
            <h3 className="text-xl font-bold text-gray-900">Applicant Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Applicant Name *</label>
              <input type="text" value={applicantName} onChange={e => setApplicantName(e.target.value)} className="block w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="Full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea value={applicantAddress} onChange={e => setApplicantAddress(e.target.value)} rows={2} className="block w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="Full address" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[['individual', 'Individual (₹4,500/class)'], ['startup', 'Startup (₹4,500/class)'], ['small_enterprise', 'Small Enterprise (₹9,000/class)'], ['large_enterprise', 'Large Enterprise (₹9,000/class)']].map(([val, label]) => (
                  <button key={val} onClick={() => setApplicantType(val)}
                    className={`p-3 rounded-xl border-2 text-sm text-left ${applicantType === val ? 'border-red-600 bg-red-50' : 'border-gray-100'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-3">
              <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white flex-1" onClick={handleConflictCheck} disabled={!applicantName || loading}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Checking...</> : <><Search className="w-4 h-4 mr-2" /> Run AI Conflict Check</>}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Conflict Report */}
        {step === 4 && conflictReport && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-5">
            <h3 className="text-xl font-bold text-gray-900">AI Conflict Analysis</h3>
            <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${riskColor === 'green' ? 'bg-green-50 border-green-300' : riskColor === 'red' ? 'bg-red-50 border-red-300' : 'bg-amber-50 border-amber-300'}`}>
              {riskColor === 'green' ? <CheckCircle className="w-8 h-8 text-green-600" /> : <AlertTriangle className={`w-8 h-8 ${riskColor === 'red' ? 'text-red-600' : 'text-amber-600'}`} />}
              <div>
                <span className={`text-lg font-bold ${riskColor === 'green' ? 'text-green-800' : riskColor === 'red' ? 'text-red-800' : 'text-amber-800'}`}>
                  {conflictReport.risk_level?.toUpperCase()} RISK
                </span>
                <p className="text-sm text-gray-700">{conflictReport.overall_assessment}</p>
              </div>
            </div>
            {conflictReport.similar_marks?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Similar Marks Found</h4>
                {conflictReport.similar_marks.map((m: any, i: number) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg mb-2 text-sm">
                    <span className="font-medium">{m.name}</span> — {m.similarity_reason}
                  </div>
                ))}
              </div>
            )}
            {conflictReport.recommendation && <p className="text-sm text-gray-700"><strong>Recommendation:</strong> {conflictReport.recommendation}</p>}
            <div className="flex gap-3 pt-3">
              <Button variant="outline" onClick={() => setStep(3)}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white flex-1" onClick={handleGenerateForms} disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</> : <><FileText className="w-4 h-4 mr-2" /> Generate TM-A Application</>}
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Done */}
        {step === 5 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">TM-A Application Generated!</h3>
            <p className="text-gray-600 mb-6">Your trademark application form is ready. A lawyer can now file it with IP India.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 mb-6">
              Estimated government fee: <strong>₹{totalGovtFee.toLocaleString()}</strong> for {niceClasses.length} class(es) — paid when your lawyer files.
            </div>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => window.location.href = '/lawyers'}>
              Find a Trademark Lawyer <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
