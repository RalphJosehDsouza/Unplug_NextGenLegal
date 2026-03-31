import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Phone, Cross, Lock, HelpCircle, Building2, AlertTriangle } from 'lucide-react';

import api from '@/api/axios';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

import mahilaCourts from '@/data/mahila_courts.json';
import dlsaDirectory from '@/data/dlsa_directory.json';

const emergencyStates = ['maharashtra', 'delhi', 'karnataka', 'uttar pradesh', 'tamil nadu'] as const;
type EmergencyStateKey = (typeof emergencyStates)[number];

function pickStateKey(raw: string | null | undefined): EmergencyStateKey {
  const s = String(raw || '').toLowerCase();
  if (s.includes('mumbai') || s.includes('maharashtra') || s.includes('mh')) return 'maharashtra';
  if (s.includes('delhi') || s.includes('dl')) return 'delhi';
  if (s.includes('karnataka') || s.includes('ka') || s.includes('bengaluru')) return 'karnataka';
  if (s.includes('uttar') || s.includes('pradesh') || s.includes('up')) return 'uttar pradesh';
  if (s.includes('tamil') || s.includes('tn') || s.includes('chennai')) return 'tamil nadu';
  return 'maharashtra';
}

async function detectStateFromIp(): Promise<EmergencyStateKey> {
  try {
    const resp = await fetch('https://ipapi.co/json/');
    if (!resp.ok) return 'maharashtra';
    const data = (await resp.json()) as any;
    const region = data?.region || data?.region_name || data?.state || null;
    return pickStateKey(region);
  } catch {
    return 'maharashtra';
  }
}

function todaysDateISO() {
  return new Date().toISOString().slice(0, 10);
}

type ReliefKey = 'Protection Order' | 'Residence Order' | 'Monetary Relief' | 'Custody Order';

const RELIEFS: ReliefKey[] = ['Protection Order', 'Residence Order', 'Monetary Relief', 'Custody Order'];

export function WomensHelpModal({ open, onOpenChange }: { open: boolean; onOpenChange: (next: boolean) => void }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isLoggedIn = Boolean(accessToken && user);

  const [stateKey, setStateKey] = useState<EmergencyStateKey>('maharashtra');

  useEffect(() => {
    if (!open) return;
    void (async () => {
      const detected = await detectStateFromIp();
      setStateKey(detected);
    })();
  }, [open]);

  const stateSpecificNumbers = useMemo(() => {
    const base = [{ label: 'Women Helpline', value: '181' }];
    if (stateKey === 'maharashtra') {
      base.push({ label: 'Maitri helpline', value: '103' });
      base.push({ label: "Mumbai Police Women's Cell", value: '022-22633333' });
    } else if (stateKey === 'delhi') {
      base.push({ label: 'Delhi Commission for Women', value: '181' });
    } else if (stateKey === 'karnataka') {
      base.push({ label: 'Vanitha Sahayavani', value: '1091' });
    }
    return base;
  }, [stateKey]);

  const [pwdvaForm, setPwdvaForm] = useState({
    applicant_address: '',
    respondent_name: '',
    respondent_address: '',
    relationship: '',
    incident_description: '',
    reliefs_sought: [] as ReliefKey[],
    children_details: '',
    court_name: '',
    district: '',
    date: todaysDateISO(),
  });

  useEffect(() => {
    if (!open) return;
    // Pre-fill court/district selection based on state.
    const courts = (mahilaCourts as any)[stateKey] || [];
    const first = courts?.[0] || null;
    setPwdvaForm((prev) => ({
      ...prev,
      court_name: first?.court_name || prev.court_name,
      district: first?.district || prev.district,
    }));
  }, [open, stateKey]);

  const dlsaForDistrict = useMemo(() => {
    const stateMap = (dlsaDirectory as any)[stateKey] || {};
    return stateMap[pwdvaForm.district] || null;
  }, [stateKey, pwdvaForm.district]);

  const courtsForState = useMemo(() => {
    const list = (mahilaCourts as any)[stateKey] || [];
    return Array.isArray(list) ? list : [];
  }, [stateKey]);

  const dlsaDistricts = useMemo(() => {
    const stateMap = (dlsaDirectory as any)[stateKey] || {};
    return Object.keys(stateMap || {});
  }, [stateKey]);

  const toggleRelief = (r: ReliefKey) => {
    setPwdvaForm((prev) => {
      const exists = prev.reliefs_sought.includes(r);
      const next = exists ? prev.reliefs_sought.filter((x) => x !== r) : [...prev.reliefs_sought, r];
      return { ...prev, reliefs_sought: next };
    });
  };

  const closeQuickly = () => onOpenChange(false);

  const submitPwdva = async () => {
    if (!isLoggedIn) {
      toast.error('Please log in to generate documents.');
      onOpenChange(false);
      navigate('/login');
      return;
    }

    if (!pwdvaForm.applicant_address || !pwdvaForm.respondent_name || !pwdvaForm.respondent_address || !pwdvaForm.incident_description) {
      toast.error('Please complete required fields.');
      return;
    }
    if (!pwdvaForm.court_name || !pwdvaForm.district) {
      toast.error('Please select a court and district.');
      return;
    }

    try {
      const resp = await api.post('/api/womens-help/generate-application', {
        applicant_name: user?.full_name || '',
        applicant_address: pwdvaForm.applicant_address,
        respondent_name: pwdvaForm.respondent_name,
        respondent_address: pwdvaForm.respondent_address,
        relationship: pwdvaForm.relationship,
        incident_description: pwdvaForm.incident_description,
        reliefs_sought: pwdvaForm.reliefs_sought,
        children_details: pwdvaForm.children_details,
        court_name: pwdvaForm.court_name,
        district: pwdvaForm.district,
        date: pwdvaForm.date,
      });

      const documentId = resp?.data?.data?.document_id;
      toast.success('Application generated. Check My Documents to download.');
      onOpenChange(false);
      if (documentId) navigate('/my-documents');
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message || 'Failed to generate application.';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="p-5 border-b border-gray-100 shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </span>
            Women’s Emergency
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 overflow-y-auto max-h-[70vh]">
          <div className="flex items-center justify-between gap-3 mb-4">
            <Badge variant="secondary" className="bg-amber-50 text-amber-800 border-amber-100">
              Discreet support (no red SOS)
            </Badge>
            <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50" onClick={closeQuickly}>
              <Cross className="w-4 h-4 mr-2" />
              Close quickly
            </Button>
          </div>

          <Tabs defaultValue="help" className="w-full">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="help">Get help now</TabsTrigger>
              <TabsTrigger value="rights">Know your rights</TabsTrigger>
              <TabsTrigger value="docs">Generate documents</TabsTrigger>
            </TabsList>

            <TabsContent value="help" className="mt-4">
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                  <div className="font-semibold text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-red-700" />
                    Emergency contacts
                  </div>
                  <div className="text-sm text-gray-600 mt-2">All calls are confidential. You do not need to give your name.</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border border-gray-100 rounded-2xl p-4 bg-white">
                    <div className="text-sm text-gray-500">Women Helpline</div>
                    <a className="block mt-2 text-lg font-bold text-red-700" href="tel:181">
                      181
                    </a>
                    <div className="text-xs text-gray-500 mt-1">National helpline</div>
                  </div>

                  <div className="border border-gray-100 rounded-2xl p-4 bg-white">
                    <div className="text-sm text-gray-500">National Commission for Women</div>
                    <a className="block mt-2 text-lg font-bold text-red-700" href="tel:7827170170">
                      7827170170
                    </a>
                    <div className="text-xs text-gray-500 mt-1">NCW</div>
                  </div>

                  <div className="border border-gray-100 rounded-2xl p-4 bg-white">
                    <div className="text-sm text-gray-500">One Stop Centre (Sakhi)</div>
                    <a className="block mt-2 text-lg font-bold text-red-700" href="tel:181">
                      181
                    </a>
                    <div className="text-xs text-gray-500 mt-1">Sakhi</div>
                  </div>

                  <div className="border border-gray-100 rounded-2xl p-4 bg-white">
                    <div className="text-sm text-gray-500">Police</div>
                    <div className="mt-2 flex flex-col gap-2">
                      <a className="text-lg font-bold text-red-700" href="tel:100">
                        100
                      </a>
                      <a className="text-lg font-bold text-red-700" href="tel:112">
                        112
                      </a>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-2xl p-4 bg-white sm:col-span-2">
                    <div className="text-sm text-gray-500">iCall (Mental Health)</div>
                    <a className="block mt-2 text-lg font-bold text-red-700" href="tel:9152987821">
                      9152987821
                    </a>
                  </div>

                  {stateSpecificNumbers
                    .filter((x) => x.label !== 'Women Helpline')
                    .map((x) => (
                      <div key={x.label} className="border border-gray-100 rounded-2xl p-4 bg-white sm:col-span-1">
                        <div className="text-sm text-gray-500">{x.label}</div>
                        <a className="block mt-2 text-lg font-bold text-red-700" href={`tel:${x.value}`}>
                          {x.value}
                        </a>
                      </div>
                    ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rights" className="mt-4">
              <div className="space-y-3">
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-red-700" /> Plain-language guidance (not legal advice)
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border border-gray-100 rounded-2xl p-4 bg-white">
                    <div className="font-semibold text-gray-900">If you are being hurt at home</div>
                    <div className="text-sm text-gray-600 mt-2">
                      Protection of Women from Domestic Violence Act, 2005 (PWDVA) can support a Protection Order. You can request protection from abuse and related interim relief.
                    </div>
                  </div>
                  <div className="border border-gray-100 rounded-2xl p-4 bg-white">
                    <div className="font-semibold text-gray-900">If you want to leave</div>
                    <div className="text-sm text-gray-600 mt-2">
                      You may have a right to reside in a shared household, along with interim relief while the case is processed.
                    </div>
                  </div>
                  <div className="border border-gray-100 rounded-2xl p-4 bg-white">
                    <div className="font-semibold text-gray-900">If you were assaulted</div>
                    <div className="text-sm text-gray-600 mt-2">
                      Criminal provisions may apply (e.g., Section 354/375 BNS, earlier IPC). Seek medical examination and support services.
                    </div>
                  </div>
                  <div className="border border-gray-100 rounded-2xl p-4 bg-white">
                    <div className="font-semibold text-gray-900">At the workplace</div>
                    <div className="text-sm text-gray-600 mt-2">
                      POSH Act, 2013 supports action through the Internal Complaints Committee (ICC) for workplace harassment.
                    </div>
                  </div>
                  <div className="border border-gray-100 rounded-2xl p-4 bg-white md:col-span-2">
                    <div className="font-semibold text-gray-900">For your children</div>
                    <div className="text-sm text-gray-600 mt-2">
                      You can seek custody/related directions and maintenance support under relevant provisions (e.g., Section 125 CrPC / BNSS 144).
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="docs" className="mt-4">
              {!isLoggedIn ? (
                <div className="border border-amber-200 bg-amber-50 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5" />
                    <div>
                      <div className="font-semibold text-amber-900">Login required to generate documents</div>
                      <div className="text-sm text-amber-800 mt-1">
                        Emergency contacts are available without login, but document generation needs authentication.
                      </div>
                      <div className="mt-3">
                        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => submitPwdva()}>
                          <Lock className="w-4 h-4 mr-2" />
                          Login to generate
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                    <div className="font-semibold text-gray-900">Protection Order Application (PWDVA 2005 - Form I)</div>
                    <div className="text-sm text-gray-600 mt-1">We generate a ready-to-download PDF using your details.</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Applicant name</div>
                      <Input value={user?.full_name || ''} disabled className="mt-1" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Applicant address</div>
                      <Textarea
                        value={pwdvaForm.applicant_address}
                        onChange={(e) => setPwdvaForm((prev) => ({ ...prev, applicant_address: e.target.value }))}
                        placeholder="Full address (editable)"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Respondent name</div>
                      <Input
                        value={pwdvaForm.respondent_name}
                        onChange={(e) => setPwdvaForm((prev) => ({ ...prev, respondent_name: e.target.value }))}
                        placeholder="Name of respondent"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Respondent address</div>
                      <Textarea
                        value={pwdvaForm.respondent_address}
                        onChange={(e) => setPwdvaForm((prev) => ({ ...prev, respondent_address: e.target.value }))}
                        placeholder="Address of respondent"
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-sm font-medium text-gray-700">Relationship</div>
                      <Input
                        value={pwdvaForm.relationship}
                        onChange={(e) => setPwdvaForm((prev) => ({ ...prev, relationship: e.target.value }))}
                        placeholder="e.g., Husband / Partner / Family member"
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-sm font-medium text-gray-700">Incident description</div>
                      <Textarea
                        value={pwdvaForm.incident_description}
                        onChange={(e) => setPwdvaForm((prev) => ({ ...prev, incident_description: e.target.value }))}
                        placeholder="Describe what happened (dates, brief events)."
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-2xl p-4 bg-white">
                    <div className="text-sm font-semibold text-gray-900 mb-2">Reliefs sought</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {RELIEFS.map((r) => (
                        <label key={r} className="flex items-start gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer">
                          <Checkbox checked={pwdvaForm.reliefs_sought.includes(r)} onCheckedChange={() => toggleRelief(r)} />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{r}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {r === 'Protection Order'
                                ? 'Protection from violence/abuse'
                                : r === 'Residence Order'
                                  ? 'Right to reside / interim residence'
                                  : r === 'Monetary Relief'
                                    ? 'Maintenance/financial support directions'
                                    : 'Custody-related directions'}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>

                    {pwdvaForm.reliefs_sought.includes('Custody Order') ? (
                      <div className="mt-3">
                        <div className="text-sm font-medium text-gray-700">Children details</div>
                        <Textarea
                          value={pwdvaForm.children_details}
                          onChange={(e) => setPwdvaForm((prev) => ({ ...prev, children_details: e.target.value }))}
                          placeholder="Children name(s), age(s), custody preference (if any)"
                          className="mt-1"
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="border border-gray-100 rounded-2xl p-4 bg-white">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">Find nearest Mahila Court</div>
                          <div className="text-xs text-gray-500 mt-1">Based on detected state: {stateKey}</div>
                        </div>
                        <Building2 className="w-4 h-4 text-red-700" />
                      </div>

                      <div className="mt-3">
                        <label className="text-sm font-medium text-gray-700">Court / district</label>
                        <select
                          value={pwdvaForm.court_name}
                          onChange={(e) => {
                            const v = e.target.value;
                            const picked = courtsForState.find((c: any) => c.court_name === v) || null;
                            setPwdvaForm((prev) => ({
                              ...prev,
                              court_name: picked?.court_name || prev.court_name,
                              district: picked?.district || prev.district,
                            }));
                          }}
                          className="w-full h-10 mt-1 border border-gray-200 rounded-md px-3 text-sm"
                        >
                          {courtsForState.length ? (
                            courtsForState.map((c: any) => (
                              <option key={c.court_name} value={c.court_name}>
                                {c.court_name}
                              </option>
                            ))
                          ) : (
                            <option value="">No courts found</option>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="border border-gray-100 rounded-2xl p-4 bg-white">
                      <div className="text-sm font-semibold text-gray-900">Find nearest DLSA</div>
                      <div className="text-xs text-gray-500 mt-1">Free legal aid by district</div>

                      <div className="mt-3">
                        <label className="text-sm font-medium text-gray-700">District</label>
                        <select
                          value={pwdvaForm.district}
                          onChange={(e) => setPwdvaForm((prev) => ({ ...prev, district: e.target.value }))}
                          className="w-full h-10 mt-1 border border-gray-200 rounded-md px-3 text-sm"
                        >
                          {dlsaDistricts.length ? (
                            dlsaDistricts.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))
                          ) : (
                            <option value="">Select a district</option>
                          )}
                        </select>
                      </div>

                      {dlsaForDistrict ? (
                        <div className="mt-3 text-sm text-gray-700">
                          <div className="font-semibold">{dlsaForDistrict.dlsa_name}</div>
                          <div className="text-xs text-gray-500 mt-1">{dlsaForDistrict.address}</div>
                        </div>
                      ) : (
                        <div className="mt-3 text-xs text-gray-500">DLSA info not found for this district.</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50" onClick={closeQuickly}>
                      <Cross className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => void submitPwdva()}>
                      Generate application PDF
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500">
                    For safety, you can use “Close quickly” anytime. Document generation stays on this page.
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

