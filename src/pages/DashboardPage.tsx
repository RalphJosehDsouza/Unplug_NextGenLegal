import { FileText, Users, Shield, MessageCircle, ArrowRight, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import api from '@/api/axios';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SecureViewer } from '@/features/documents/SecureViewer';
import { LawyerAlertsTab } from '@/components/webrtc/LawyerAlertsTab';

interface DashboardPageProps {
  user: any;
}

type ActivityItem = {
  id: string;
  created_at: string;
  uploader: { id: string | null; name: string };
  document: { id: string; title: string; viewer_policy: 'view_only' | 'download_allowed' };
};

const backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export function DashboardPage({ user }: DashboardPageProps) {
  const isLawyer = user?.role === 'lawyer';
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerFileName, setViewerFileName] = useState('');

  const activityQuery = useQuery({
    queryKey: ['recent-activity', user?.role],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const resp = await api.get('/api/activity/recent?limit=10');
      return (resp?.data?.data?.items || []) as ActivityItem[];
    },
  });

  const recentItems = activityQuery.data || [];

  const handleOpenViewer = async (docId: string, title: string) => {
    try {
      const tokenResp = await api.post(`/api/docs/${docId}/view-token`);
      const token = tokenResp?.data?.data?.view_token;
      if (!token) throw new Error('Unable to open document');

      setViewerFileName(title);
      setViewerUrl(`${backendBase}/api/docs/${docId}/stream?token=${encodeURIComponent(token)}`);
      setViewerOpen(true);
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Could not open document';
      toast.error(message);
    }
  };


  const quickLinks = [
    {
      title: 'Document Studio',
      description: 'Generate legal documents instantly',
      icon: FileText,
      url: '/documents',
      color: 'bg-red-500',
    },
    {
      title: 'Find a Lawyer',
      description: 'Search and filter expert lawyers',
      icon: Users,
      url: '/lawyers',
      color: 'bg-red-500',
    },
    {
      title: 'Compliance',
      description: 'Track deadlines and filings',
      icon: Shield,
      url: '/compliance',
      color: 'bg-purple-500',
    },
    {
      title: 'AI Assistant',
      description: 'Get instant legal answers',
      icon: MessageCircle,
      url: '/chat',
      color: 'bg-emerald-500', 
    },
  ];

  if (isLawyer) {
    quickLinks.unshift({
      title: 'Cases & Files',
      description: 'Manage case documents and reminders',
      icon: FileText,
      url: '/cases',
      color: 'bg-amber-500',
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.full_name?.split(' ')[0] || 'User'}!</h1>
        <p className="text-gray-600 mb-8">What would you like to do today?</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {quickLinks.map((link) => (
            <Link 
              key={link.title} 
              to={link.url}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group flex flex-col items-start"
            >
              <div className={`w-12 h-12 ${link.color} rounded-xl flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform`}>
                <link.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{link.title}</h3>
              <p className="text-sm text-gray-500 flex-1">{link.description}</p>
              <div className="mt-4 flex items-center text-sm font-medium text-red-600 group-hover:gap-2 transition-all">
                Get started <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          ))}
        </div>

        {isLawyer && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Phone className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Video Call Alerts</h2>
            </div>
            <LawyerAlertsTab />
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          {activityQuery.isLoading ? (
            <div className="py-8 text-center text-gray-500 border-2 border-dashed border-gray-100 rounded-xl">
              Loading activity...
            </div>
          ) : recentItems.length === 0 ? (
            <div className="py-8 text-center text-gray-500 border-2 border-dashed border-gray-100 rounded-xl">
              You don't have any recent activity yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentItems.map((item) => (
                <button
                  key={item.id}
                  className="w-full text-left rounded-xl border border-gray-100 px-4 py-3 hover:border-red-200 hover:bg-red-50/40 transition-colors"
                  onClick={() => handleOpenViewer(item.document.id, item.document.title)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-gray-900">{item.document.title}</div>
                    <Badge variant="secondary" className="bg-red-50 text-red-800 border-red-100">
                      View
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Uploaded by {item.uploader.name} • {new Date(item.created_at).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={viewerOpen}
        onOpenChange={(open) => {
          setViewerOpen(open);
          if (!open) {
            setViewerUrl(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{viewerFileName || 'Document Viewer'}</DialogTitle>
          </DialogHeader>
          {viewerUrl ? <SecureViewer documentUrl={viewerUrl} fileName={viewerFileName || 'Document'} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
