import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronRight, Download, Loader2 } from 'lucide-react';

import api from '@/api/axios';
import { useAuthStore } from '@/store/authStore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';

type PioMatch = {
  department: string;
  ministry: string;
  central_or_state: string;
  state: string | null;
  pio_name: string;
  pio_designation: string;
  pio_address: string;
  appeal_authority: string;
  appeal_address: string;
  fee_mode: 'IPO' | 'DD' | 'online' | 'court_fee_stamp';
  online_portal_url?: string;
};

type RtiGenerateResponse = {
  document_id: string;
  pio_details: PioMatch;
  response_deadline: string;
  tracking_created: boolean;
  generated_text: string;
};

const STATES = [
  { key: 'maharashtra', label: 'Maharashtra' },
  { key: 'delhi', label: 'Delhi' },
  { key: 'karnataka', label: 'Karnataka' },
  { key: 'uttar pradesh', label: 'Uttar Pradesh' },
  { key: 'tamil nadu', label: 'Tamil Nadu' },
] as const;
type StateKey = (typeof STATES)[number]['key'];

function formatDate(isoOrDateOnly: string) {
  const d = new Date(isoOrDateOnly);
  if (Number.isNaN(d.getTime())) return isoOrDateOnly;
  return d.toLocaleDateString('en-IN');
}

function feeLine(pio: PioMatch | null | undefined, bplExempt: boolean) {
  if (bplExempt) return 'BPL cardholder: RTI fee is waived.';
  if (!pio) return 'Application fee: ₹10.';
  return `Application fee: ₹10 payable via ${pio.fee_mode === 'IPO' ? 'IPO/DD' : pio.fee_mode === 'DD' ? 'Demand Draft' : pio.fee_mode === 'online' ? 'online portal' : pio.fee_mode}. (Follow department instructions.)`;
}

export function RTIPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isLoggedIn = Boolean(accessToken && user);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [departmentHint, setDepartmentHint] = useState('');
  const [stateKey, setStateKey] = useState<StateKey>('maharashtra');
  const [informationSought, setInformationSought] = useState('');

  const [isSearchingPIO, setIsSearchingPIO] = useState(false);
  const [pioMatches, setPioMatches] = useState<PioMatch[]>([]);
  const [selectedPio, setSelectedPio] = useState<PioMatch | null>(null);

  const [applicantName, setApplicantName] = useState(user?.full_name || '');
  const [applicantAddress, setApplicantAddress] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [bplExempt, setBplExempt] = useState(false);
  const [aiEnhance, setAiEnhance] = useState(true);

  const [generated, setGenerated] = useState<null | (RtiGenerateResponse & { downloaded?: boolean })>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setApplicantName(user?.full_name || '');
  }, [user?.full_name]);

  // Autocomplete: search as user types.
  useEffect(() => {
    const q = departmentHint.trim();
    if (q.length < 3) {
      setPioMatches([]);
      return;
    }

    const handle = window.setTimeout(async () => {
      try {
        setIsSearchingPIO(true);
        const resp = await api.post('/api/rti/search-pio', { department: q, state: stateKey });
        setPioMatches((resp?.data?.data?.matches || []) as PioMatch[]);
      } catch {
        // Do nothing; allow manual entry.
      } finally {
        setIsSearchingPIO(false);
      }
    }, 350);

    return () => window.clearTimeout(handle);
  }, [departmentHint, stateKey]);

  const previewFee = useMemo(() => feeLine(selectedPio, bplExempt), [selectedPio, bplExempt]);

  const findRightOffice = async () => {
    const q = departmentHint.trim();
    if (!q) {
      toast.error('Please enter a department hint.');
      return;
    }
    if (!informationSought.trim()) {
      toast.error('Please describe what information you need.');
      return;
    }

    if (pioMatches.length === 0) {
      try {
        setIsSearchingPIO(true);
        const resp = await api.post('/api/rti/search-pio', { department: q, state: stateKey });
        setPioMatches(resp?.data?.data?.matches || []);
      } catch {
        toast.error('Failed to find offices. Try again.');
        return;
      } finally {
        setIsSearchingPIO(false);
      }
    }

    setSelectedPio(pioMatches?.[0] || null);
    setStep(2);
  };

  const downloadPdf = async (docId: string, title: string) => {
    try {
      const resp = await api.get(`/api/docs/${docId}/download`, { responseType: 'blob' });
      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9-_ ]/gi, '').slice(0, 80) || 'rti'} .pdf`.replace(' ', '_');
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Downloaded.');
    } catch {
      toast.error('Download failed.');
    }
  };

  const generateRti = async () => {
    if (!isLoggedIn) {
      toast.error('Please log in to generate the RTI PDF.');
      navigate('/login');
      return;
    }

    if (!selectedPio) {
      toast.error('Please confirm the office (PIO) to send to.');
      setStep(2);
      return;
    }

    if (!applicantName.trim() || !applicantAddress.trim() || !informationSought.trim()) {
      toast.error('Please complete all required applicant fields.');
      return;
    }

    setIsGenerating(true);
    try {
      const payload = {
        department: departmentHint.trim(),
        state: stateKey,
        pio: selectedPio,
        applicant_name: applicantName.trim(),
        applicant_address: applicantAddress.trim(),
        applicant_phone: applicantPhone.trim(),
        applicant_email: applicantEmail.trim(),
        information_sought: informationSought.trim(),
        bpl_exempt: bplExempt,
        ai_enhance: aiEnhance,
      };

      const resp = await api.post('/api/rti/generate', payload);
      const data = resp?.data?.data as RtiGenerateResponse;
      setGenerated(data);
      setStep(4);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to generate RTI application.';
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="pt-24 pb-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">RTI Application Assistant</h1>
            <p className="text-gray-600 mt-1">Find the right office, generate a formal RTI application, and get reminders.</p>
          </div>
          <Badge variant="secondary" className="bg-red-50 text-red-800 border-red-100">
            Fee ₹10 (BPL exempt)
          </Badge>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((s) => (
            <Button
              key={s}
              type="button"
              variant={step === s ? 'default' : 'outline'}
              className={step === s ? 'bg-red-600 hover:bg-red-700 text-white' : 'border-red-200 text-red-700 hover:bg-red-50'}
              onClick={() => setStep(s as any)}
              disabled={s > step + 1}
            >
              Step {s}
            </Button>
          ))}
        </div>

        {step === 1 ? (
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold text-gray-900 mb-2">What information do you need?</div>
                <Textarea
                  value={informationSought}
                  onChange={(e) => setInformationSought(e.target.value)}
                  placeholder="Describe what information you're looking for (in your own words)"
                  className="min-h-[170px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Department hint</div>
                  <Input
                    value={departmentHint}
                    onChange={(e) => setDepartmentHint(e.target.value)}
                    placeholder="e.g., Department of Revenue, Police, Education, Railways..."
                  />
                  {isSearchingPIO ? <div className="text-xs text-gray-500 mt-2">Searching…</div> : null}
                  {pioMatches.length ? (
                    <div className="mt-3 border border-gray-100 rounded-xl bg-white overflow-hidden">
                      {pioMatches.map((m) => (
                        <button
                          key={`${m.department}-${m.pio_name}`}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          onClick={() => setDepartmentHint(m.department)}
                        >
                          <div className="text-sm font-semibold text-gray-900">{m.department}</div>
                          <div className="text-xs text-gray-500">{m.pio_designation}</div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">State</div>
                  <select
                    value={stateKey}
                    onChange={(e) => setStateKey(e.target.value as StateKey)}
                    className="w-full h-10 border border-gray-200 rounded-md px-3 text-sm"
                  >
                    {STATES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => void findRightOffice()}>
                  Find the right office <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        {step === 2 ? (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Here’s who to send it to</div>
                  <div className="text-sm text-gray-600 mt-1">Top PIO match with alternatives.</div>
                </div>
                {selectedPio ? (
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 border-emerald-100">
                    Best match
                  </Badge>
                ) : null}
              </div>

              {pioMatches.length === 0 ? (
                <div className="text-sm text-gray-600">No matches. Go back and try another department hint.</div>
              ) : (
                <>
                  {pioMatches.slice(0, 1).map((m) => (
                    <div key={`${m.department}-${m.pio_name}`} className="border border-red-100 bg-red-50 rounded-2xl p-4">
                      <div className="font-semibold text-gray-900">{m.pio_name}</div>
                      <div className="text-sm text-gray-700 mt-1">{m.pio_designation}</div>
                      <div className="text-xs text-gray-600 mt-2">{m.pio_address}</div>
                      <div className="mt-4 flex gap-3">
                        <Button
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => {
                            setSelectedPio(m);
                            setStep(3);
                          }}
                        >
                          This looks right
                        </Button>
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => setStep(1)}
                        >
                          Try a different office
                        </Button>
                      </div>
                    </div>
                  ))}

                  {pioMatches.length > 1 ? (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-gray-900 mt-4">Alternative PIOs</div>
                      <div className="grid gap-3">
                        {pioMatches.slice(1).map((m) => (
                          <div key={`${m.department}-${m.pio_name}`} className="border border-gray-100 bg-white rounded-2xl p-4 flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-gray-900">{m.pio_name}</div>
                              <div className="text-xs text-gray-600 mt-1">{m.pio_address}</div>
                            </div>
                            <Button
                              variant="outline"
                              className="border-red-200 text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setSelectedPio(m);
                                setStep(3);
                              }}
                            >
                              This looks right
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </Card>
        ) : null}

        {step === 3 ? (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="text-sm font-semibold text-gray-900">Fill your details</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Name</div>
                  <Input value={applicantName} onChange={(e) => setApplicantName(e.target.value)} placeholder="Your full name" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Phone</div>
                  <Input value={applicantPhone} onChange={(e) => setApplicantPhone(e.target.value)} placeholder="Phone number" />
                </div>
                <div className="md:col-span-2">
                  <div className="text-sm font-medium text-gray-700 mb-2">Address</div>
                  <Textarea
                    value={applicantAddress}
                    onChange={(e) => setApplicantAddress(e.target.value)}
                    placeholder="Your full address"
                    className="min-h-[120px]"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="text-sm font-medium text-gray-700 mb-2">Email (optional)</div>
                  <Input value={applicantEmail} onChange={(e) => setApplicantEmail(e.target.value)} placeholder="email@example.com" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-100 rounded-2xl p-4 bg-white">
                  <div className="flex items-start gap-3">
                    <Checkbox checked={bplExempt} onCheckedChange={(v) => setBplExempt(Boolean(v))} />
                    <div>
                      <div className="font-semibold text-gray-900">Are you a BPL cardholder?</div>
                      <div className="text-sm text-gray-600 mt-1">If yes, RTI application fee is waived.</div>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-100 rounded-2xl p-4 bg-white">
                  <div className="flex items-start gap-3">
                    <Checkbox checked={aiEnhance} onCheckedChange={(v) => setAiEnhance(Boolean(v))} />
                    <div>
                      <div className="font-semibold text-gray-900">Use AI to draft my application</div>
                      <div className="text-sm text-gray-600 mt-1">Uses Gemini to generate formal RTI text under 300 words.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-gray-600">
                  Selected fee: <b>{previewFee}</b>
                </div>
                <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => void generateRti()} disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Generate RTI Application
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        {step === 4 && generated ? (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Your RTI application is ready</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Response deadline: <b>{formatDate(generated.response_deadline)}</b>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 border-emerald-100">
                  Tracking created
                </Badge>
              </div>

              <div className="border border-gray-100 bg-white rounded-2xl p-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">Preview</div>
                <pre className="text-sm text-gray-800 whitespace-pre-wrap">{generated.generated_text}</pre>
              </div>

              <div className="flex items-center justify-between gap-3">
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => void downloadPdf(generated.document_id, `RTI_${generated.pio_details?.department || 'application'}`)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <div className="text-xs text-gray-500">
                  We’ll remind you if they don’t respond in 30 days.
                </div>
              </div>

              <div className="border border-gray-100 rounded-2xl p-4 bg-white">
                <div className="text-sm font-semibold text-gray-900 mb-2">How to send this</div>
                <Accordion type="single" collapsible defaultValue="online">
                  <AccordionItem value="online">
                    <AccordionTrigger>Online</AccordionTrigger>
                    <AccordionContent>
                      {generated.pio_details?.online_portal_url ? (
                        <a
                          className="text-red-700 underline"
                          href={generated.pio_details.online_portal_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {generated.pio_details.online_portal_url}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-600">No portal link available for this PIO.</span>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="post">
                    <AccordionTrigger>By post</AccordionTrigger>
                    <AccordionContent>
                      <div className="text-sm text-gray-700">
                        <div className="font-semibold">{generated.pio_details?.pio_name}</div>
                        <div className="mt-1">{generated.pio_details?.pio_address}</div>
                        <div className="mt-2 text-xs text-gray-500">Send by Registered Post to keep proof.</div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="fee">
                    <AccordionTrigger>Fee</AccordionTrigger>
                    <AccordionContent>
                      <div className="text-sm text-gray-700">
                        {feeLine(generated.pio_details, Boolean(bplExempt))}
                        <div className="mt-2 text-xs text-gray-500">
                          ₹10 by IPO/DD/court fee stamp payable to Accounts Officer of the department (BPL exempt).
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    </section>
  );
}

