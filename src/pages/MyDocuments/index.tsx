import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  Trash2,
  FileText,
  FileSignature,
  Scale,
  Shield,
  Clock,
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
import { SecureViewer } from '@/features/documents/SecureViewer';

type DocumentRow = {
  id: string;
  doc_type: string;
  title: string;
  signed: boolean;
  signed_at: string | null;
  created_at: string;
};

function formatDDMMYYYY(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function badgeForDocType(docType: string) {
  const map: Record<string, { cls: string; label: string }> = {
    nda: { cls: 'bg-blue-50 text-blue-800 border-blue-100', label: 'NDA' },
    rental_agreement: { cls: 'bg-indigo-50 text-indigo-800 border-indigo-100', label: 'Rental' },
    partnership_deed: { cls: 'bg-purple-50 text-purple-800 border-purple-100', label: 'Partnership' },
    employment_contract: { cls: 'bg-amber-50 text-amber-800 border-amber-100', label: 'Employment' },
    affidavit: { cls: 'bg-rose-50 text-rose-800 border-rose-100', label: 'Affidavit' },
  };
  return map[docType] || { cls: 'bg-gray-50 text-gray-700 border-gray-100', label: docType };
}

function SignedBadge({ signed }: { signed: boolean }) {
  return signed ? (
    <Badge className="bg-emerald-50 text-emerald-800 border-emerald-100" variant="secondary">
      Signed
    </Badge>
  ) : (
    <Badge className="bg-gray-50 text-gray-700 border-gray-100" variant="secondary">
      Pending
    </Badge>
  );
}

export function MyDocuments() {
  const navigate = useNavigate();
  const location = useLocation();

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerFileName, setViewerFileName] = useState('');

  const handleViewerOpenChange = (open: boolean) => {
    setViewerOpen(open);
    if (!open && viewerUrl) {
      URL.revokeObjectURL(viewerUrl);
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
    }
  }, [location.state]);

  const handleDownload = async (doc: DocumentRow) => {
    try {
      const resp = await api.get(`/api/docs/${doc.id}/download`, { responseType: 'blob' });
      const blob = resp.data instanceof Blob ? resp.data : new Blob([resp.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setViewerFileName(doc.title);
      setViewerUrl(url);
      setViewerOpen(true);
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Download failed';
      toast.error(message);
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

  return (
    <section className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Documents</h2>
            <p className="text-gray-600 mt-1">Securely generated and ready for download.</p>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => navigate('/documents')}>
            Generate new
          </Button>
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
            <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center mb-4">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Generate your first legal document</h3>
            <p className="text-gray-600 mt-2 max-w-md mx-auto">
              Choose a template from the Document Studio to create a protected PDF draft.
            </p>
            <Button
              className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white"
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
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 flex-shrink-0">
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
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className={badge.cls}>
                      {badge.label}
                    </Badge>
                    <SignedBadge signed={doc.signed} />

                    <Button
                      variant="outline"
                      className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
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
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-800 border-indigo-100">
                  {viewerFileName}
                </Badge>
              ) : null}
            </DialogTitle>
          </DialogHeader>

          {viewerUrl ? <SecureViewer documentUrl={viewerUrl} fileName={viewerFileName} /> : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

