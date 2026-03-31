import { useState } from 'react';
import { Sparkles, Copy, RefreshCw, Loader2, Building2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/api/axios';

const INDUSTRIES = ['Technology','Healthcare','Education','Finance','Legal','Retail','Food & Beverage','Manufacturing','Real Estate','Agriculture','Fashion','Media','Travel','Sports','Automobile'];
const STYLES = [
  { id: 'professional', label: '💼 Professional', desc: 'Corporate, trustworthy' },
  { id: 'creative', label: '🎨 Creative', desc: 'Unique, artistic' },
  { id: 'modern', label: '⚡ Modern', desc: 'Tech-forward, sleek' },
  { id: 'traditional', label: '🏛️ Traditional', desc: 'Classic, timeless' },
  { id: 'tech', label: '🚀 Tech', desc: 'Startup-friendly' },
];

export function BusinessNameGenerator() {
  const [industry, setIndustry] = useState('');
  const [keywords, setKeywords] = useState('');
  const [style, setStyle] = useState('professional');
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!industry || !keywords) { toast.error('Industry and keywords are required'); return; }
    setLoading(true);
    try {
      const resp = await api.post('/api/name-generator', { industry, keywords, style, count });
      setResults(resp.data.data || []);
      toast.success(`Generated ${resp.data.data?.length || 0} name suggestions!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Generation failed');
    } finally { setLoading(false); }
  };

  const copyName = (name: string, idx: number) => {
    navigator.clipboard.writeText(name);
    setCopiedIdx(idx);
    toast.success('Copied!');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <section className="pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-1.5 bg-red-100 text-red-700 text-sm font-semibold rounded-full mb-4">Name Generator</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Find Your Perfect <span className="text-red-600">Business Name</span></h1>
          <p className="text-gray-600">AI-powered suggestions tailored for the Indian market</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-5 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry *</label>
              <select value={industry} onChange={e => setIndustry(e.target.value)} className="block w-full border border-gray-300 rounded-xl px-4 py-3">
                <option value="">Select industry</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keywords *</label>
              <input type="text" value={keywords} onChange={e => setKeywords(e.target.value)} className="block w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="e.g., legal, smart, trust" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Style</label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map(s => (
                <button key={s.id} onClick={() => setStyle(s.id)}
                  className={`px-4 py-2 rounded-xl text-sm border-2 transition-all ${style === s.id ? 'border-red-600 bg-red-50 font-medium' : 'border-gray-100 hover:border-red-300'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of suggestions: {count}</label>
            <input type="range" min={3} max={20} value={count} onChange={e => setCount(parseInt(e.target.value))} className="w-full accent-red-600" />
          </div>

          <Button className="w-full bg-red-600 hover:bg-red-700 text-white py-3" onClick={handleGenerate} disabled={loading}>
            {loading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Generating...</> : <><Sparkles className="w-5 h-5 mr-2" /> Generate Names</>}
          </Button>
        </div>

        {results.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{results.length} Suggestions</h3>
              <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Regenerate
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map((r, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-lg hover:border-red-200 transition-all group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-red-600" />
                      <h4 className="text-lg font-bold text-gray-900">{r.name}</h4>
                    </div>
                    <button onClick={() => copyName(r.name, i)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded-lg">
                      {copiedIdx === i ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
                    </button>
                  </div>
                  {r.tagline && <p className="text-sm text-gray-600 mb-2 italic">"{r.tagline}"</p>}
                  {r.domain_suggestion && <p className="text-xs text-blue-600 mb-2">🌐 {r.domain_suggestion}</p>}
                  {r.reasoning && <p className="text-xs text-gray-500">{r.reasoning}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
