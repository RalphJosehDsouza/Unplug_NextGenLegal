import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Eye,
  Trash2,
  FileText,
  FileSignature,
  Scale,
  Shield,
  Clock,
  Upload,
} from 'lucide-react';

import api from '@/api/axios';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SecureViewer } from '@/features/documents/SecureViewer';
import { useAuthStore } from '@/store/authStore';

type DocumentRow = {
  id: string;
  doc_type: string;
  title: string;
  signed: boolean;
  signed_at: string | null;
  signature_id?: string | null;
  signed_expired?: boolean;
  created_at: string;
  source_type?: 'generated' | 'uploaded';
  uploader_name?: string | null;
  viewer_policy?: 'view_only' | 'download_allowed';
};

const backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

function formatDDMMYYYY(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function badgeForDocType(docType: string) {
  const map: Record<string, { cls: string; label: string }> = {
    nda: { cls: 'bg-red-50 text-red-800 border-red-100', label: 'NDA' },
    rental_agreement: { cls: 'bg-red-50 text-red-800 border-red-100', label: 'Rental' },
    partnership_deed: { cls: 'bg-purple-50 text-purple-800 border-purple-100', label: 'Partnership' },
    employment_contract: { cls: 'bg-amber-50 text-amber-800 border-amber-100', label: 'Employment' },
    affidavit: { cls: 'bg-rose-50 text-rose-800 border-rose-100', label: 'Affidavit' },
  };
  return map[docType] || { cls: 'bg-gray-50 text-gray-700 border-gray-100', label: docType };
}

function SignedBadge({
  signed,
  signed_at,
  signature_id,
}: {
  signed: boolean;
  signed_at: string | null;
  signature_id?: string | null;
}) {
  if (signed) {
    return (
      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-100" variant="secondary">
        Signed{signed_at ? ` • ${formatDDMMYYYY(signed_at)}` : ''}
      </Badge>
    );
  }

  if (signature_id) {
    return (
      <Badge className="bg-amber-50 text-amber-800 border-amber-100" variant="secondary">
        Signing in progress
      </Badge>
    );
  }

  return (
    <Badge className="bg-gray-50 text-gray-700 border-gray-100" variant="secondary">
      Not signed
    </Badge>
  );
}

export function MyDocuments() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerFileName, setViewerFileName] = useState('');
  const [uploading, setUploading] = useState(false);

  const [esignOpen, setEsignOpen] = useState(false);
  const [esignDoc, setEsignDoc] = useState<DocumentRow | null>(null);
  const [esignSubmitting, setEsignSubmitting] = useState(false);
  const [esignSignatories, setEsignSignatories] = useState<
    Array<{ name: string; email: string; phone: string; type: 'AADHAAR' | 'CLICK' }>
  >([]);

  const handleViewerOpenChange = (open: boolean) => {
    setViewerOpen(open);
    if (!open && viewerUrl) {
      if (viewerUrl.startsWith('blob:')) {
        URL.revokeObjectURL(viewerUrl);
      }
      setViewerUrl(null);
    }
  };

  const query = useQuery({
    queryKey: ['my-docs'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const resp = await api.get('/api/docs');
      return resp?.data?.data?.documents || [];
    },
  });

  const docs = useMemo(() => (query.data || []) as DocumentRow[], [query.data]);

  useEffect(() => {
    const state = location.state as unknown as { docId?: string } | undefined;
    if (state?.docId) {
      toast.success('Your document is ready to download.');
      // Force refetch because React Query cache might be stale after generating
      query.refetch().then((res) => {
        // Auto-open if possible
        const newDoc = res.data?.find((d: any) => d.id === state.docId);
        if (newDoc) {
          handleOpenViewer(newDoc);
        }
      });
      // Clear the state so it doesn't trigger again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleOpenViewer = async (doc: DocumentRow) => {
    try {
      const tokenResp = await api.post(`/api/docs/${doc.id}/view-token`);
      const token = tokenResp?.data?.data?.view_token;
      if (!token) throw new Error('Unable to open document');

      const url = `${backendBase}/api/docs/${doc.id}/stream?token=${encodeURIComponent(token)}`;
      setViewerFileName(doc.title);
      setViewerUrl(url);
      setViewerOpen(true);
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Open viewer failed';
      toast.error(message);
    }
  };

  const handleUploadPdf = async (file: File | null) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.replace(/\.pdf$/i, ''));

    try {
      setUploading(true);
      await api.post('/api/docs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('PDF uploaded successfully.');
      query.refetch();
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Upload failed';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: DocumentRow) => {
    try {
      await api.delete(`/api/docs/${doc.id}`);
      toast.success('Document deleted.');
      query.refetch();
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Delete failed';
      toast.error(message);
    }
  };

  const openEsignDialog = (doc: DocumentRow) => {
    if (!user) return;
    setEsignDoc(doc);
    setEsignOpen(true);
    setEsignSubmitting(false);
    setEsignSignatories([
      {
        name: user.full_name || '',
        email: user.email || '',
        phone: '',
        type: 'CLICK',
      },
    ]);
  };

  const submitEsign = async () => {
    if (!esignDoc) return;
    if (!user) return;
    setEsignSubmitting(true);
    try {
      // Backend expects signatories with `type` values: AADHAAR | CLICK.
      await api.post(`/api/docs/${esignDoc.id}/esign/initiate`, {
        signatories: esignSignatories.map((s) => ({
          name: s.name,
          email: s.email,
          phone: s.phone,
          type: s.type,
        })),
      });

      toast.success('Signing link created. Parties will be notified via email.');
      setEsignOpen(false);
      query.refetch();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'E-sign initiation failed';
      toast.error(message);
    } finally {
      setEsignSubmitting(false);
    }
  };

  const downloadSignedCopy = async (doc: DocumentRow) => {
    try {
      const resp = await api.get(`/api/docs/${doc.id}/download`, { responseType: 'blob' });
      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Download failed';
      toast.error(message);
    }
  };

  return (
    <section className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Documents</h2>
            <p className="text-gray-600 mt-1">Securely generated or uploaded documents in protected view mode.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-flex">
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  handleUploadPdf(file);
                  e.currentTarget.value = '';
                }}
              />
              <span className="inline-flex items-center justify-center rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload PDF'}
              </span>
            </label>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => navigate('/documents')}>
              Generate new
            </Button>
          </div>
        </div>

        {query.isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border rounded-2xl p-5">
                <Skeleton className="h-4 w-2/3 mb-3" />
                <Skeleton className="h-3 w-1/2 mb-4" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="bg-white border rounded-2xl p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-red-50 text-red-700 rounded-2xl flex items-center justify-center mb-4">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Generate your first legal document</h3>
            <p className="text-gray-600 mt-2 max-w-md mx-auto">
              Choose a template from the Document Studio to create a protected PDF draft.
            </p>
            <Button
              className="mt-6 bg-red-600 hover:bg-red-700 text-white"
              onClick={() => navigate('/documents')}
            >
              Go to Document Studio
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => {
              const badge = badgeForDocType(doc.doc_type);
              return (
                <div key={doc.id} className="bg-white border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-700 flex-shrink-0">
                      {doc.doc_type === 'nda' ? (
                        <Shield className="w-5 h-5" />
                      ) : doc.doc_type === 'rental_agreement' ? (
                        <FileText className="w-5 h-5" />
                      ) : doc.doc_type === 'partnership_deed' ? (
                        <FileSignature className="w-5 h-5" />
                      ) : doc.doc_type === 'affidavit' ? (
                        <Scale className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{doc.title}</div>
                      <div className="text-sm text-gray-500 mt-1">Created: {formatDDMMYYYY(doc.created_at)}</div>
                      {doc.uploader_name ? (
                        <div className="text-sm text-gray-500">Uploaded by: {doc.uploader_name}</div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className={badge.cls}>
                      {badge.label}
                    </Badge>
                    <SignedBadge signed={doc.signed} signed_at={doc.signed_at} signature_id={doc.signature_id || null} />
                    <Badge variant="secondary" className="bg-slate-50 text-slate-700 border-slate-200">
                      {doc.source_type === 'uploaded' ? 'Uploaded' : 'Generated'}
                    </Badge>

                    <Button
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => handleOpenViewer(doc)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Open
                    </Button>

                    {doc.viewer_policy === 'download_allowed' ? (
                      <Button
                        variant="outline"
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => downloadSignedCopy(doc)}
                      >
                        {doc.signed ? 'Download Signed Copy' : 'Download PDF'}
                      </Button>
                    ) : !doc.signed ? (
                      <Button
                        variant="outline"
                        className="border-amber-200 text-amber-700 hover:bg-amber-50"
                        onClick={() => openEsignDialog(doc)}
                        disabled={Boolean(doc.signature_id)}
                      >
                        {doc.signature_id ? 'E-sign in progress' : 'E-sign'}
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(doc)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={viewerOpen} onOpenChange={handleViewerOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-4">
              <span>Document Viewer</span>
              {viewerFileName ? (
                <Badge variant="secondary" className="bg-red-50 text-red-800 border-red-100">
                  {viewerFileName}
                </Badge>
              ) : null}
            </DialogTitle>
          </DialogHeader>

          {viewerUrl ? <SecureViewer documentUrl={viewerUrl} fileName={viewerFileName} /> : null}
        </DialogContent>
      </Dialog>

      <Dialog open={esignOpen} onOpenChange={setEsignOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Who needs to sign this?</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter signatories and choose signing type. The document owner must be the first signatory.
            </p>

            <div className="space-y-3">
              {esignSignatories.map((s, idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-gray-900">
                      Signatory {idx === 0 ? '(Owner)' : `#${idx + 1}`}
                    </div>
                    {idx > 0 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        onClick={() => setEsignSignatories((arr) => arr.filter((_, i) => i !== idx))}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Name</Label>
                      <Input
                        value={s.name}
                        onChange={(e) => setEsignSignatories((arr) => arr.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))}
                        placeholder="Full name"
                        disabled={idx === 0 && Boolean(user?.full_name)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Email</Label>
                      <Input
                        value={s.email}
                        onChange={(e) => setEsignSignatories((arr) => arr.map((x, i) => (i === idx ? { ...x, email: e.target.value } : x)))}
                        placeholder="email@example.com"
                        disabled={idx === 0}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Phone</Label>
                      <Input
                        value={s.phone}
                        onChange={(e) => setEsignSignatories((arr) => arr.map((x, i) => (i === idx ? { ...x, phone: e.target.value } : x)))}
                        placeholder="Phone number"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Signing type</Label>
                      <Select
                        value={s.type}
                        onValueChange={(v) => {
                          const nextType = (v === 'AADHAAR' ? 'AADHAAR' : 'CLICK') as 'AADHAAR' | 'CLICK';
                          setEsignSignatories((arr) => arr.map((x, i) => (i === idx ? { ...x, type: nextType } : x)));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select signing type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AADHAAR">Aadhaar eSign</SelectItem>
                          <SelectItem value="CLICK">Click-to-sign</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50"
                onClick={() =>
                  setEsignSignatories((arr) => [
                    ...arr,
                    { name: '', email: '', phone: '', type: 'CLICK' as const },
                  ])
                }
              >
                Add signatory
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEsignOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => void submitEsign()}
                  disabled={esignSubmitting || esignSignatories.length === 0}
                >
                  {esignSubmitting ? 'Creating...' : 'Start e-sign'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

