import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DownloadCloud, Loader2, ShieldAlert, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';


type Severity = 'high' | 'medium' | 'low';

type DocReviewAnalysis = {
  risk_score: number;
  doc_type_detected: string;
  summary: string;
  red_flags: Array<{ clause: string; issue: string; severity: Severity }>;
  missing_protections: Array<{ protection: string; explanation: string; standard_clause: string }>;
  positive_clauses: Array<{ clause: string; why_good: string }>;
  recommendation: string;
  lawyer_specialization_needed: string;
};

function RiskGauge({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, (Number(score) / 10) * 100));

  return (
    <div className="flex items-center gap-4">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center relative"
        style={{
          background: `conic-gradient(from 180deg, #ef4444 0% ${pct}%, #e5e7eb ${pct}% 100%)`,
        }}
      >
        <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
          <div className="text-lg font-bold text-gray-900">{score}</div>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="text-sm text-gray-600">Risk score (1-10)</div>
        <div className="text-xs text-gray-500 mt-1">{score <= 3 ? 'Low risk' : score <= 6 ? 'Medium risk' : 'High risk'}</div>
      </div>
    </div>
  );
}

function severityBadge(sev: Severity) {
  switch (sev) {
    case 'high':
      return { cls: 'bg-red-50 text-red-800 border-red-100', label: 'High' };
    case 'medium':
      return { cls: 'bg-amber-50 text-amber-800 border-amber-100', label: 'Medium' };
    case 'low':
      return { cls: 'bg-emerald-50 text-emerald-800 border-emerald-100', label: 'Low' };
    default:
      return { cls: 'bg-gray-50 text-gray-700 border-gray-100', label: sev };
  }
}

export function DocReviewPage() {
  const navigate = useNavigate();

  const [docType, setDocType] = useState('uploaded_pdf');
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<DocReviewAnalysis | null>(null);

  const [progress, setProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  const canAnalyze = useMemo(() => Boolean(file) && !isAnalyzing, [file, isAnalyzing]);

  const startFakeProgress = () => {
    setProgress(0);
    const start = Date.now();
    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - start;
      // 0 -> 90 over 8 seconds
      const pct = Math.min(90, Math.round((elapsed / 8000) * 90));
      setProgress((prev) => (prev < pct ? pct : prev));
    }, 120);
  };

  const stopFakeProgress = () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    setProgress(100);
  };

  const handleAnalyze = async () => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be <= 10MB.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);
    startFakeProgress();

    try {
      const form = new FormData();
      form.append('file', file);

      const resp = await api.post(`/api/doc-review/analyze?doc_type=${encodeURIComponent(docType)}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = resp?.data?.data as DocReviewAnalysis;
      setAnalysis(data);
      stopFakeProgress();
      toast.success('Document review ready.');
    } catch (err) {
      stopFakeProgress();
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to analyze document.';
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const [showGood, setShowGood] = useState(false);

  return (
    <section className="pt-24 pb-16 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Document Review</h1>
            <p className="text-gray-600 mt-1">Upload a PDF contract to get risk flags and the right specialization.</p>
          </div>
          <Badge variant="secondary" className="bg-red-50 text-red-800 border-red-100">
            PDF &le; 10MB
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4">
            <Card className="p-5">
              <div className="text-sm font-semibold text-gray-900 mb-3">Upload</div>

              <div
                className="border-2 border-dashed border-red-200 rounded-2xl p-5 bg-white cursor-pointer hover:bg-red-50/30 transition-colors"
                onClick={() => document.getElementById('doc-review-file')?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const dropped = e.dataTransfer.files?.[0];
                  if (dropped) setFile(dropped);
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center gap-3">
                  <DownloadCloud className="w-5 h-5 text-red-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Drag & drop PDF</div>
                    <div className="text-xs text-gray-500 mt-1">or click to browse</div>
                  </div>
                </div>

                {file ? (
                  <div className="mt-3 text-sm text-gray-700">
                    Selected: <b>{file.name}</b>
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-gray-500">No file selected</div>
                )}
              </div>

              <input
                id="doc-review-file"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setFile(f);
                }}
              />

              <div className="mt-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Document type (hint)</div>
                <Input value={docType} onChange={(e) => setDocType(e.target.value)} />
                <div className="text-xs text-gray-500 mt-1">Used to improve analysis accuracy.</div>
              </div>

              <Button className="mt-5 w-full bg-red-600 hover:bg-red-700 text-white" disabled={!canAnalyze} onClick={() => void handleAnalyze()}>
                {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldAlert className="w-4 h-4 mr-2" />}
                {isAnalyzing ? 'Analyzing…' : 'Analyze document'}
              </Button>

              {isAnalyzing ? (
                <div className="mt-4">
                  <div className="text-xs text-gray-600 mb-2">Progress: {progress}%</div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-red-600 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ) : null}
            </Card>
          </div>

          <div className="lg:col-span-8">
            {analysis ? (
              <div className="space-y-5">
                <Card className="p-5">
                  <RiskGauge score={analysis.risk_score} />
                  <div className="mt-4">
                    <div className="text-sm text-gray-600">Detected type</div>
                    <div className="text-lg font-semibold text-gray-900">{analysis.doc_type_detected}</div>
                  </div>
                  <div className="mt-3 text-sm text-gray-700">{analysis.summary}</div>
                </Card>

                {analysis.red_flags?.length ? (
                  <Card className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <div className="font-semibold text-gray-900">Red Flags</div>
                    </div>
                    <div className="space-y-3">
                      {analysis.red_flags.map((f, idx) => {
                        const sb = severityBadge(f.severity);
                        return (
                          <details key={idx} className="border border-red-100 rounded-2xl p-4 bg-white">
                            <summary className="cursor-pointer flex items-center justify-between gap-3">
                              <span className="text-sm font-medium text-gray-900">Flag</span>
                              <Badge variant="secondary" className={sb.cls}>
                                {sb.label}
                              </Badge>
                            </summary>
                            <div className="mt-3 space-y-2">
                              <div className="text-xs text-gray-500">Clause</div>
                              <div className="text-sm text-gray-800 bg-red-50 border border-red-100 rounded-xl p-3 font-mono whitespace-pre-wrap">
                                {f.clause}
                              </div>
                              <div className="text-xs text-gray-500">Issue</div>
                              <div className="text-sm text-gray-700">{f.issue}</div>
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  </Card>
                ) : null}

                {analysis.missing_protections?.length ? (
                  <Card className="p-5">
                    <div className="font-semibold text-gray-900 mb-3">Missing Protections</div>
                    <div className="space-y-3">
                      {analysis.missing_protections.map((m, idx) => (
                        <div key={idx} className="border border-amber-100 rounded-2xl p-4 bg-white">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-amber-900">{m.protection}</div>
                            <Badge variant="secondary" className="bg-amber-50 text-amber-800 border-amber-100">
                              Missing
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-700 mt-2">{m.explanation}</div>
                          <div className="mt-3 text-xs text-gray-500">Standard clause example</div>
                          <div className="text-sm text-gray-800 bg-amber-50 border border-amber-100 rounded-xl p-3 font-mono whitespace-pre-wrap">
                            {m.standard_clause}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ) : null}

                {analysis.positive_clauses?.length ? (
                  <Card className="p-5">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div className="font-semibold text-gray-900">Positive Clauses</div>
                      <Button variant="outline" size="sm" onClick={() => setShowGood((v) => !v)} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                        {showGood ? 'Hide' : `Show ${analysis.positive_clauses.length} good clauses`}
                      </Button>
                    </div>
                    {showGood ? (
                      <div className="space-y-3">
                        {analysis.positive_clauses.map((p, idx) => (
                          <div key={idx} className="border border-emerald-100 rounded-2xl p-4 bg-white">
                            <div className="text-xs text-emerald-700 font-semibold">Clause</div>
                            <div className="text-sm text-gray-800 bg-emerald-50 border border-emerald-100 rounded-xl p-3 mt-2 font-mono whitespace-pre-wrap">
                              {p.clause}
                            </div>
                            <div className="text-sm text-gray-700 mt-2">{p.why_good}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">Collapsed by default.</div>
                    )}
                  </Card>
                ) : null}

                <Card className="p-5 bg-red-600 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm text-red-100">Recommendation</div>
                      <div className="text-base font-semibold mt-2">{analysis.recommendation}</div>
                      <div className="mt-3">
                        <Badge variant="secondary" className="bg-white/15 text-white border-white/20">
                          {analysis.lawyer_specialization_needed}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="mt-4 w-full bg-white hover:bg-white/90 text-red-700"
                    onClick={() =>
                      navigate(`/lawyers?specialization=${encodeURIComponent(analysis.lawyer_specialization_needed)}`)
                    }
                  >
                    Book a {analysis.lawyer_specialization_needed} lawyer to review this
                  </Button>
                </Card>

                <div className="text-xs text-gray-500">
                  Note: AI output is for guidance only and should be verified by a lawyer.
                </div>
              </div>
            ) : (
              <div className="bg-white border rounded-2xl p-6 text-center text-gray-600">
                Upload a PDF to get risk flags and matching recommendations.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

