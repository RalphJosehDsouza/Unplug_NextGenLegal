import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileText, Calendar, AlertTriangle } from 'lucide-react';

import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type NoticeType =
  | 'cheque_bounce_138'
  | 'consumer_complaint'
  | 'property_dispute'
  | 'employment_dispute'
  | 'rent_recovery'
  | 'defamation'
  | 'custom';

type GeneratedNotice = {
  document_id: string;
  notice_type: NoticeType;
  response_deadline: string;
};

export function LegalNoticePage() {
  const [form, setForm] = useState({
    notice_type: 'cheque_bounce_138' as NoticeType,
    sender_name: '',
    sender_address: '',
    sender_advocate_name: '',
    recipient_name: '',
    recipient_address: '',
    subject: '',
    facts_and_circumstances: '',
    relief_sought: '',
    city: '',
    date: new Date().toISOString().slice(0, 10),
  });

  const [generated, setGenerated] = useState<GeneratedNotice | null>(null);
  const [trackForm, setTrackForm] = useState({
    postal_tracking_number: '',
    sent_via: 'registered_post' as 'registered_post' | 'email' | 'both',
    sent_at: new Date().toISOString().slice(0, 10),
  });

  const trackingsQuery = useQuery({
    queryKey: ['legal-notice-trackings'],
    queryFn: async () => {
      const resp = await api.get('/api/legal-notice/tracking');
      return resp.data?.data?.trackings || [];
    },
    staleTime: 30 * 1000,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const resp = await api.post('/api/legal-notice/generate', form);
      return resp.data?.data as GeneratedNotice;
    },
    onSuccess: (data) => {
      setGenerated(data);
      toast.success('Legal notice generated.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to generate notice');
    },
  });

  const trackMutation = useMutation({
    mutationFn: async () => {
      if (!generated) return;
      const resp = await api.post(`/api/legal-notice/${generated.document_id}/track-delivery`, trackForm);
      return resp.data?.data;
    },
    onSuccess: () => {
      toast.success('Delivery tracking saved.');
      setTrackForm({
        postal_tracking_number: '',
        sent_via: 'registered_post',
        sent_at: new Date().toISOString().slice(0, 10),
      });
      trackingsQuery.refetch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save tracking');
    },
  });

  // Countdown is driven by backend `days_remaining`; we still keep a human-friendly label.
  const generatedDeadlineLabel = useMemo(() => {
    if (!generated?.response_deadline) return null;
    const d = new Date(generated.response_deadline);
    return d.toLocaleDateString('en-IN');
  }, [generated?.response_deadline]);

  useEffect(() => {
    // If the user navigates back after generating and the auth token is gone,
    // keep this page stable rather than throwing rendering errors.
    if (!api) return;
  }, []);

  return (
    <section className="pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-red-600" />
            <h1 className="text-3xl font-extrabold text-gray-900">Legal Notice Generator</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Generate a professional legal notice and track delivery deadlines.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">1) Generate your notice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Notice type</Label>
                  <Select value={form.notice_type} onValueChange={(v) => setForm((s) => ({ ...s, notice_type: v as NoticeType }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select notice type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cheque_bounce_138">Cheque bounce (Section 138)</SelectItem>
                      <SelectItem value="consumer_complaint">Consumer complaint</SelectItem>
                      <SelectItem value="property_dispute">Property dispute</SelectItem>
                      <SelectItem value="employment_dispute">Employment dispute</SelectItem>
                      <SelectItem value="rent_recovery">Rent recovery</SelectItem>
                      <SelectItem value="defamation">Defamation</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input value={form.date} onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))} type="date" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sender name</Label>
                  <Input value={form.sender_name} onChange={(e) => setForm((s) => ({ ...s, sender_name: e.target.value }))} placeholder="Your full name" />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} placeholder="e.g., Mumbai" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sender address</Label>
                <Textarea value={form.sender_address} onChange={(e) => setForm((s) => ({ ...s, sender_address: e.target.value }))} placeholder="Address of sender" />
              </div>

              <div className="space-y-2">
                <Label>Sender advocate name (optional)</Label>
                <Input value={form.sender_advocate_name} onChange={(e) => setForm((s) => ({ ...s, sender_advocate_name: e.target.value }))} placeholder="Advocate name (if any)" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Recipient name</Label>
                  <Input value={form.recipient_name} onChange={(e) => setForm((s) => ({ ...s, recipient_name: e.target.value }))} placeholder="Recipient full name" />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input value={form.subject} onChange={(e) => setForm((s) => ({ ...s, subject: e.target.value }))} placeholder="Subject line" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Recipient address</Label>
                <Textarea value={form.recipient_address} onChange={(e) => setForm((s) => ({ ...s, recipient_address: e.target.value }))} placeholder="Recipient address" />
              </div>

              <div className="space-y-2">
                <Label>Facts and circumstances</Label>
                <Textarea value={form.facts_and_circumstances} onChange={(e) => setForm((s) => ({ ...s, facts_and_circumstances: e.target.value }))} placeholder="Describe what happened (in your own words)" />
              </div>

              <div className="space-y-2">
                <Label>Relief sought</Label>
                <Input value={form.relief_sought} onChange={(e) => setForm((s) => ({ ...s, relief_sought: e.target.value }))} placeholder="What you want the recipient to do" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => void generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? 'Generating...' : 'Generate Notice'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {generated ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">2) Track delivery & monitor response</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tracking number</Label>
                    <Input value={trackForm.postal_tracking_number} onChange={(e) => setTrackForm((s) => ({ ...s, postal_tracking_number: e.target.value }))} placeholder="Registered post / courier number" />
                  </div>
                  <div className="space-y-2">
                    <Label>Sent via</Label>
                    <Select value={trackForm.sent_via} onValueChange={(v) => setTrackForm((s) => ({ ...s, sent_via: v as any }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="registered_post">Registered post</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sent date</Label>
                    <Input value={trackForm.sent_at} onChange={(e) => setTrackForm((s) => ({ ...s, sent_at: e.target.value }))} type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Response deadline</Label>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar className="w-4 h-4 text-red-600" />
                      <span className="font-semibold">{generatedDeadlineLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => void trackMutation.mutate()}
                    disabled={trackMutation.isPending}
                  >
                    {trackMutation.isPending ? 'Saving...' : 'Save Tracking'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">3) Active notices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trackingsQuery.isLoading ? (
                <div className="text-sm text-gray-500">Loading your notices...</div>
              ) : trackingsQuery.data.length === 0 ? (
                <div className="text-sm text-gray-500">No tracked legal notices yet.</div>
              ) : (
                <div className="space-y-2">
                  {trackingsQuery.data.map((t: any) => (
                    <div key={t.tracking_id} className="bg-white border rounded-xl p-4 flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold text-gray-900">{t.notice_title || 'Legal Notice'}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Tracking:</span> {t.tracking_number}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Days remaining:</span> {t.days_remaining}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Status: {t.status}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {t.action_required ? (
                          <Badge variant="outline" className="border-red-200 text-red-700">
                            <AlertTriangle className="w-4 h-4 mr-1 inline" />
                            Action Required
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                            On Track
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

