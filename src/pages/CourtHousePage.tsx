import { useEffect, useMemo, useState } from 'react';
import { Eye, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SecureViewer } from '@/features/documents/SecureViewer';

interface CaseTypeRequiredDoc {
  id: string;
  code: string;
  label: string;
  description: string | null;
  allowed_mime: string[];
  required: boolean;
  sort_order: number;
}

interface CaseType {
  id: string;
  name: string;
  slug: string;
  required_documents: CaseTypeRequiredDoc[];
}

interface HearingSummary {
  id: string;
  topic: string;
  description: string | null;
  hearing_at: string;
  status: string;
  case_type: { id: string; name: string; slug: string };
  checklist_summary: {
    total_required: number;
    uploaded_required: number;
    missing_required: number;
    complete: boolean;
  };
}

interface HearingDetailRequirement {
  id: string;
  label: string;
  description: string | null;
  allowed_mime: string[];
  required: boolean;
  uploaded: boolean;
  upload: {
    id: string;
    uploaded_at: string;
    document: {
      id: string;
      title: string;
      mime_type: string;
      created_at: string;
    };
  } | null;
}

interface HearingDetail {
  id: string;
  topic: string;
  description: string | null;
  hearing_at: string;
  status: string;
  case_type: { id: string; name: string; slug: string };
  checklist: HearingDetailRequirement[];
  checklist_summary: {
    total_required: number;
    uploaded_required: number;
    missing_required: number;
    complete: boolean;
  };
}

const emptyForm = {
  topic: '',
  description: '',
  hearing_at: '',
  case_type_id: '',
};

const backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export function CourtHousePage({ user }: { user: { role?: string } | null }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [types, setTypes] = useState<CaseType[]>([]);
  const [hearings, setHearings] = useState<HearingSummary[]>([]);
  const [selectedHearingId, setSelectedHearingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<HearingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [uploadingRequirementId, setUploadingRequirementId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerFileName, setViewerFileName] = useState('');

  const selectedType = useMemo(
    () => types.find((t) => t.id === form.case_type_id) || null,
    [form.case_type_id, types],
  );

  useEffect(() => {
    if (!user || user.role !== 'lawyer') return;
    void loadInitial();
  }, [user]);

  useEffect(() => {
    if (!selectedHearingId) {
      setDetail(null);
      return;
    }
    void loadHearingDetail(selectedHearingId);
  }, [selectedHearingId]);

  async function loadInitial() {
    try {
      setLoading(true);
      const [typesResp, hearingsResp] = await Promise.all([
        api.get('/api/courthouse/case-types'),
        api.get('/api/courthouse/hearings'),
      ]);

      const loadedTypes = typesResp.data?.data?.case_types || [];
      const loadedHearings = hearingsResp.data?.data?.hearings || [];

      setTypes(loadedTypes);
      setHearings(loadedHearings);
      setForm((prev) => ({
        ...prev,
        case_type_id: prev.case_type_id || loadedTypes?.[0]?.id || '',
      }));

      if (loadedHearings.length > 0) {
        setSelectedHearingId((prev) => prev || loadedHearings[0].id);
      }
    } catch {
      toast.error('Failed to load CourtHouse data.');
    } finally {
      setLoading(false);
    }
  }

  async function loadHearingDetail(hearingId: string) {
    try {
      setDetailLoading(true);
      const resp = await api.get(`/api/courthouse/hearings/${hearingId}`);
      setDetail(resp.data?.data?.hearing || null);
    } catch {
      toast.error('Failed to load hearing details.');
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleCreateHearing(e: React.FormEvent) {
    e.preventDefault();
    if (!form.topic.trim() || !form.hearing_at || !form.case_type_id) {
      toast.error('Topic, date/time and case type are required.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/api/courthouse/hearings', {
        topic: form.topic.trim(),
        description: form.description.trim(),
        hearing_at: new Date(form.hearing_at).toISOString(),
        case_type_id: form.case_type_id,
      });

      toast.success('Court hearing scheduled.');
      setForm((prev) => ({ ...emptyForm, case_type_id: prev.case_type_id }));
      await loadInitial();
    } catch {
      toast.error('Could not schedule hearing.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpload(hearingId: string, requirementId: string, file: File | null) {
    if (!file) return;
    try {
      setUploadingRequirementId(requirementId);
      const data = new FormData();
      data.append('file', file);
      await api.post(`/api/courthouse/hearings/${hearingId}/requirements/${requirementId}/upload`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('File uploaded.');
      await Promise.all([loadHearingDetail(hearingId), loadInitial()]);
    } catch {
      toast.error('Upload failed for this requirement.');
    } finally {
      setUploadingRequirementId(null);
    }
  }

  async function handleOpenViewer(documentId: string, title: string) {
    try {
      const tokenResp = await api.post(`/api/docs/${documentId}/view-token`);
      const token = tokenResp?.data?.data?.view_token;
      if (!token) throw new Error('Unable to open document');

      const url = `${backendBase}/api/docs/${documentId}/stream?token=${encodeURIComponent(token)}`;
      setViewerFileName(title);
      setViewerUrl(url);
      setViewerOpen(true);
    } catch {
      toast.error('Open viewer failed');
    }
  }

  if (!user || user.role !== 'lawyer') {
    return <div className="min-h-screen pt-24 px-4 text-center">Access denied. Only lawyers can open CourtHouse.</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center gap-2 text-gray-600">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading CourtHouse...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm lg:col-span-1">
          <h1 className="text-2xl font-bold text-gray-900">CourtHouse</h1>
          <p className="text-sm text-gray-600 mt-1">Schedule hearings and track required case files.</p>

          <form className="mt-6 space-y-4" onSubmit={handleCreateHearing}>
            <div>
              <label className="text-sm font-medium text-gray-800">Topic</label>
              <Input
                value={form.topic}
                onChange={(e) => setForm((prev) => ({ ...prev, topic: e.target.value }))}
                placeholder="Bail hearing for case CR-24/2026"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-800">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief context for upcoming hearing"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-800">Date and time</label>
              <Input
                type="datetime-local"
                value={form.hearing_at}
                onChange={(e) => setForm((prev) => ({ ...prev, hearing_at: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-800">Case type</label>
              <select
                value={form.case_type_id}
                onChange={(e) => setForm((prev) => ({ ...prev, case_type_id: e.target.value }))}
                className="w-full h-10 border border-gray-200 rounded-md px-3 text-sm"
              >
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              {submitting ? 'Scheduling...' : 'Schedule hearing'}
            </Button>
          </form>

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-gray-900">Required files for selected case type</h2>
            <ul className="mt-2 text-sm text-gray-700 space-y-2">
              {selectedType?.required_documents?.map((doc) => (
                <li key={doc.id} className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  <div className="font-medium">{doc.label}</div>
                  {doc.description ? <div className="text-xs text-gray-500">{doc.description}</div> : null}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900">Your hearings</h2>

          {hearings.length === 0 ? (
            <p className="mt-4 text-sm text-gray-600">No hearings scheduled yet.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="space-y-3">
                {hearings.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setSelectedHearingId(h.id)}
                    className={`w-full text-left border rounded-xl p-4 ${
                      selectedHearingId === h.id ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{h.topic}</div>
                    <div className="text-xs text-gray-600 mt-1">{h.case_type?.name} • {new Date(h.hearing_at).toLocaleString()}</div>
                    <div className="text-xs mt-2 text-gray-700">
                      Uploaded {h.checklist_summary.uploaded_required}/{h.checklist_summary.total_required} required files
                    </div>
                  </button>
                ))}
              </div>

              <div className="border border-gray-200 rounded-xl p-4 min-h-[280px]">
                {detailLoading ? (
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading details...
                  </div>
                ) : detail ? (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900">{detail.topic}</h3>
                    <p className="text-xs text-gray-600 mt-1">{detail.case_type?.name} • {new Date(detail.hearing_at).toLocaleString()}</p>
                    <p className="text-sm text-gray-700 mt-3">{detail.description || 'No description'}</p>

                    <div className="mt-4 space-y-3">
                      {detail.checklist.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="font-medium text-sm text-gray-900">{item.label}</div>
                          <div className="text-xs text-gray-500">{item.description || 'No additional description'}</div>
                          <div className="mt-2 text-xs text-gray-700">
                            {item.uploaded
                              ? `Uploaded: ${item.upload?.document?.title || 'File'} on ${new Date(item.upload?.uploaded_at || '').toLocaleString()}`
                              : 'Not uploaded yet'}
                          </div>

                          <div className="mt-3 relative inline-block">
                            <input
                              type="file"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={(e) => {
                                void handleUpload(detail.id, item.id, e.target.files?.[0] || null);
                                e.currentTarget.value = '';
                              }}
                            />
                            <Button type="button" variant="outline" size="sm" disabled={uploadingRequirementId === item.id} className="pointer-events-none">
                              <Upload className="w-4 h-4 mr-2" />
                              {uploadingRequirementId === item.id ? 'Uploading...' : 'Upload file'}
                            </Button>
                          </div>

                          {item.uploaded && item.upload?.document?.id ? (
                            <div className="mt-3">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                onClick={() =>
                                  handleOpenViewer(
                                    item.upload?.document?.id || '',
                                    item.upload?.document?.title || item.label,
                                  )
                                }
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Open
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-600">Select a hearing to view and upload required files.</div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      <Dialog
        open={viewerOpen}
        onOpenChange={(open) => {
          setViewerOpen(open);
          if (!open) {
            setViewerUrl(null);
            setViewerFileName('');
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Document Viewer</DialogTitle>
          </DialogHeader>
          {viewerUrl ? <SecureViewer documentUrl={viewerUrl} fileName={viewerFileName} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
