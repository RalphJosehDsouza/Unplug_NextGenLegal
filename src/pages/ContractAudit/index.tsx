import { useState, useCallback } from 'react';
import { Upload, Loader2, AlertTriangle, CheckCircle, Shield, FileText, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/api/axios';

export function ContractAuditPage() {
  const [contractText, setContractText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult] = useState<any>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      toast.error('Please upload a text (.txt) file with your contract content');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setContractText(ev.target?.result as string || '');
    reader.readAsText(file);
  }, []);

  const handleAudit = async () => {
    if (contractText.trim().length < 50) { toast.error('Please enter at least 50 characters of contract text'); return; }
    setLoading(true);
    setResult(null);
    try {
      setLoadingStep('Extracting text...');
      await new Promise(r => setTimeout(r, 500));
      setLoadingStep('Analyzing clauses...');
      await new Promise(r => setTimeout(r, 500));
      setLoadingStep('Generating report...');
      const resp = await api.post('/api/contract-audit', { contract_text: contractText });
      setResult(resp.data.data);
      toast.success('Audit complete!');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Audit failed');
    } finally { setLoading(false); setLoadingStep(''); }
  };

  const scoreColor = (score: number) => score <= 30 ? 'green' : score <= 60 ? 'amber' : 'red';
  const severityColor: Record<string, string> = { critical: 'bg-red-100 text-red-800', high: 'bg-orange-100 text-orange-800', medium: 'bg-amber-100 text-amber-800', low: 'bg-blue-100 text-blue-800' };

  return (
    <section className="pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-1.5 bg-red-100 text-red-700 text-sm font-semibold rounded-full mb-4">Contract Audit</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">AI-Powered <span className="text-red-600">Contract Review</span></h1>
          <p className="text-gray-600">Paste or upload your contract for an instant risk analysis under Indian law</p>
        </div>

        {!result && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-5">
            {/* Upload Zone */}
            <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-red-400 hover:bg-red-50/30 transition-all">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Drop a .txt file or click to upload</span>
              <input type="file" className="hidden" accept=".txt" onChange={handleFileUpload} />
            </label>

            <div className="relative">
              <span className="absolute left-4 top-3 text-xs text-gray-400">Or paste contract text below</span>
              <textarea value={contractText} onChange={e => setContractText(e.target.value)} rows={12}
                className="block w-full border border-gray-300 rounded-xl px-4 pt-8 pb-3 text-sm font-mono focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Paste your contract text here..." />
            </div>
            <p className="text-xs text-gray-400">{contractText.length.toLocaleString()} characters</p>

            <Button className="w-full bg-red-600 hover:bg-red-700 text-white py-3" onClick={handleAudit} disabled={loading || contractText.length < 50}>
              {loading ? (
                <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> {loadingStep}</span>
              ) : (
                <span className="flex items-center gap-2"><Shield className="w-5 h-5" /> Audit This Contract</span>
              )}
            </Button>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {/* Risk Score */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm text-center">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Overall Risk Score</h3>
              <div className="relative w-36 h-36 mx-auto mb-4">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" strokeWidth="8" fill="none" className="stroke-gray-200" />
                  <circle cx="50" cy="50" r="42" strokeWidth="8" fill="none"
                    className={`${scoreColor(result.risk_score) === 'green' ? 'stroke-green-500' : scoreColor(result.risk_score) === 'amber' ? 'stroke-amber-500' : 'stroke-red-500'}`}
                    strokeDasharray={`${(result.risk_score / 100) * 264} 264`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-4xl font-bold ${scoreColor(result.risk_score) === 'green' ? 'text-green-600' : scoreColor(result.risk_score) === 'amber' ? 'text-amber-600' : 'text-red-600'}`}>
                    {result.risk_score}
                  </span>
                </div>
              </div>
              <p className={`text-sm font-medium ${scoreColor(result.risk_score) === 'green' ? 'text-green-700' : scoreColor(result.risk_score) === 'amber' ? 'text-amber-700' : 'text-red-700'}`}>
                {result.risk_score <= 30 ? 'Low Risk' : result.risk_score <= 60 ? 'Moderate Risk' : 'High Risk'}
              </p>
            </div>

            {/* Risks */}
            {result.risks?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-600" /> Risk Items ({result.risks.length})</h3>
                <div className="space-y-3">
                  {result.risks.map((risk: any, i: number) => (
                    <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                      <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50" onClick={() => setExpanded(p => ({ ...p, [i]: !p[i] }))}>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${severityColor[risk.severity] || 'bg-gray-100'}`}>{risk.severity?.toUpperCase()}</span>
                          <span className="text-sm text-gray-900 text-left">{risk.issue}</span>
                        </div>
                        {expanded[i] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {expanded[i] && (
                        <div className="px-4 pb-4 space-y-2 text-sm">
                          {risk.clause_text && <div className="bg-gray-50 p-3 rounded-lg italic text-gray-600">"{risk.clause_text}"</div>}
                          <div><strong>Recommendation:</strong> {risk.recommendation}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Clauses */}
            {result.missing_clauses?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Missing Clauses</h3>
                <div className="space-y-2">
                  {result.missing_clauses.map((mc: any, i: number) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${mc.importance === 'essential' ? 'bg-red-50' : 'bg-gray-50'}`}>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${mc.importance === 'essential' ? 'bg-red-100 text-red-800' : mc.importance === 'recommended' ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-700'}`}>{mc.importance}</span>
                      <div>
                        <span className="font-medium text-gray-900">{mc.clause_name}</span>
                        <p className="text-xs text-gray-600">{mc.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Favorable Terms */}
            {result.favorable_terms?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> Favorable Terms</h3>
                <div className="space-y-2">
                  {result.favorable_terms.map((term: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-green-50 rounded-xl text-sm text-green-800">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {term}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Overall Assessment */}
            {result.overall_assessment && (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Overall Assessment</h3>
                <p className="text-gray-700">{result.overall_assessment}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setResult(null); setContractText(''); }}>
                <FileText className="w-4 h-4 mr-2" /> Audit Another
              </Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => window.location.href = '/lawyers'}>
                Find a Lawyer to Review <Download className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
