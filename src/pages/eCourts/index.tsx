import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

function maskCnrs(cnr: string) {
  const s = String(cnr || '').toUpperCase();
  if (s.length <= 6) return s;
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

function countdownDays(isoDate: string | Date | null | undefined) {
  if (!isoDate) return null;
  const t = typeof isoDate === 'string' ? new Date(isoDate).getTime() : isoDate.getTime();
  if (Number.isNaN(t)) return null;
  const ms = t - Date.now();
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  return days;
}

export function ECourtsPage() {
  const [cnr, setCnr] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const trackedQuery = useQuery({
    queryKey: ['ecourts-tracked'],
    queryFn: async () => (await api.get('/api/ecourts/tracked')).data.data.trackedCases as any[],
    staleTime: 30 * 1000,
  });

  const tracked = trackedQuery.data || [];

  const daysUntilNextForTracked = useMemo(() => {
    const map: Record<string, number | null> = {};
    for (const c of tracked) {
      map[c.id] = countdownDays(c.last_hearing_date);
    }
    return map;
  }, [tracked]);

  const doSearch = async () => {
    const trimmed = cnr.trim().toUpperCase();
    if (!/^[A-Z]{4}[0-9]{12}$/.test(trimmed)) {
      toast.error('Enter a valid CNR (format: AAAA##########).');
      return;
    }

    setSearching(true);
    setResult(null);
    try {
      const resp = await api.get(`/api/ecourts/case/${encodeURIComponent(trimmed)}`);
      setResult(resp.data.data);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message || 'Failed to fetch case.';
      toast.error(msg);
    } finally {
      setSearching(false);
    }
  };

  const doTrack = async () => {
    const trimmed = cnr.trim().toUpperCase();
    if (!/^[A-Z]{4}[0-9]{12}$/.test(trimmed)) {
      toast.error('Enter a valid CNR first.');
      return;
    }

    try {
      await api.post('/api/ecourts/track', { cnr: trimmed });
      toast.success('Case tracked. You will get updates on hearing changes.');
      await trackedQuery.refetch();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message || 'Failed to track case.';
      toast.error(msg);
    }
  };

  const untrack = async (id: string) => {
    try {
      await api.delete(`/api/ecourts/tracked/${id}`);
      toast.success('Removed from tracked cases.');
      await trackedQuery.refetch();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message || 'Failed to untrack case.';
      toast.error(msg);
    }
  };

  return (
    <section className="pt-24 pb-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">eCourts Tracker</h1>
            <p className="text-gray-600 mt-1">Search by CNR number, track the case, and get hearing updates.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="font-semibold text-gray-900">Case search</div>
                <Badge variant="secondary" className="bg-red-50 text-red-800 border-red-100">
                  Auth required
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">CNR number</div>
                  <Input
                    value={cnr}
                    onChange={(e) => setCnr(e.target.value)}
                    placeholder="AAAA##########"
                    className="font-mono"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => void doSearch()}
                    disabled={searching}
                  >
                    {searching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Search
                  </Button>
                  <Button variant="outline" onClick={() => void doTrack()} disabled={searching || !cnr.trim()}>
                    Track
                  </Button>
                </div>
              </div>

              {result ? (
                <div className="mt-5 space-y-3">
                  <div className="border border-gray-100 rounded-xl p-4 bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{result.case_name || 'Case'}</div>
                        <div className="text-xs text-gray-500 mt-1">{maskCnrs(result.cnr_number)}</div>
                      </div>
                      <Badge variant="outline" className="bg-gray-50 text-gray-800 border-gray-100">
                        {result.status || 'Status'}
                      </Badge>
                    </div>

                    <div className="mt-3 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-red-600" />
                        Next hearing:{' '}
                        <b className="text-gray-900">
                          {result.next_hearing_date ? new Date(result.next_hearing_date).toLocaleDateString('en-IN') : 'N/A'}
                        </b>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {result.court_name ? `${result.court_name}${result.district ? ` • ${result.district}` : ''}` : result.district ? result.district : null}
                      </div>
                    </div>

                    {Array.isArray(result.acts_sections) && result.acts_sections.length > 0 ? (
                      <div className="mt-4">
                        <div className="text-xs font-semibold text-gray-700 mb-2">Act / section hints</div>
                        <div className="flex flex-wrap gap-2">
                          {result.acts_sections.slice(0, 8).map((a: any, idx: number) => (
                            <Badge key={idx} variant="secondary" className="bg-emerald-50 text-emerald-800 border-emerald-100">
                              {a.act}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {Array.isArray(result.orders) && result.orders.length > 0 ? (
                      <div className="mt-4 space-y-2">
                        <div className="text-xs font-semibold text-gray-700">Orders / documents</div>
                        {result.orders.slice(0, 6).map((o: any, idx: number) => (
                          <div key={idx} className="flex items-start justify-between gap-3 border border-gray-100 rounded-lg p-3">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{o.text || 'Order'}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {o.date ? new Date(o.date).toLocaleDateString('en-IN') : '—'}
                              </div>
                            </div>
                            {o.pdf_url ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(o.pdf_url, '_blank')}
                                className="border-red-200 text-red-700 hover:bg-red-50"
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Open
                              </Button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </Card>
          </div>

          <div className="lg:col-span-7">
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="font-semibold text-gray-900">Tracked cases</div>
                <Badge variant="secondary" className="bg-gray-50 text-gray-800 border-gray-100">
                  {tracked.length} total
                </Badge>
              </div>

              {trackedQuery.isLoading ? (
                <div className="text-sm text-gray-600">Loading tracked cases…</div>
              ) : tracked.length === 0 ? (
                <div className="text-sm text-gray-600">No tracked cases yet. Search by CNR and click “Track”.</div>
              ) : (
                <div className="space-y-3">
                  {tracked.map((c) => {
                    const days = daysUntilNextForTracked[c.id];
                    const nextDate = c.last_hearing_date ? new Date(c.last_hearing_date).toLocaleDateString('en-IN') : 'N/A';
                    const statusTone =
                      days == null
                        ? 'bg-gray-50 text-gray-700 border-gray-100'
                        : days < 0
                          ? 'bg-red-50 text-red-800 border-red-100'
                          : days <= 7
                            ? 'bg-amber-50 text-amber-800 border-amber-100'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-100';

                    return (
                      <div key={c.id} className="border border-gray-100 rounded-xl p-4 bg-white flex items-start justify-between gap-4">
                        <div>
                          <div className="font-semibold text-gray-900">{c.case_name || 'Case'}</div>
                          <div className="text-xs text-gray-500 mt-1 font-mono">{maskCnrs(c.cnr)}</div>
                          <div className="mt-2 text-sm text-gray-700">
                            Next hearing: <b className="text-gray-900">{nextDate}</b>
                          </div>
                          <div className="mt-1 text-xs text-gray-500">Last status: {c.last_status || '—'}</div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="outline" className={statusTone}>
                            {days == null ? 'Unknown' : days < 0 ? 'Past due' : `${days} day(s)`}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() => void untrack(c.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Untrack
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

