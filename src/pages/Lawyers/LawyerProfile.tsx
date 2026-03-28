import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Star, MapPin, CheckCircle2 } from 'lucide-react';

import api from '@/api/axios';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { BookingFlow } from '@/components/lawyers/BookingFlow';

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user: { full_name: string | null };
};

type LawyerProfile = {
  id: string;
  specialization: string[];
  languages: string[];
  state: string;
  city: string;
  rate_per_hour: number;
  bio: string | null;
  verified: boolean;
  user: { full_name: string | null; email: string | null; phone: string | null };
  working_hours: Record<string, string[]>;
};

export function LawyerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [slot, setSlot] = useState<string | null>(null);
  const [flowOpen, setFlowOpen] = useState(false);

  const profileQuery = useQuery({
    queryKey: ['lawyer-profile', id],
    queryFn: async () => (await api.get(`/api/lawyers/${id}`)).data.data as { lawyer: LawyerProfile; reviews: ReviewRow[]; rating_summary: Record<string, number>; avg_rating: number; review_count: number },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });

  const slotsQuery = useQuery({
    queryKey: ['lawyer-slots', id],
    queryFn: async () => (await api.get(`/api/lawyers/${id}/slots`)).data.data as { slots: string[] },
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });

  const lawyer = profileQuery.data?.lawyer;
  const reviews = profileQuery.data?.reviews || [];
  const avg = profileQuery.data?.avg_rating || 0;
  const count = profileQuery.data?.review_count || 0;

  const slots = slotsQuery.data?.slots || [];

  const slotsByDay = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const s of slots) {
      const d = new Date(s);
      const key = d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
      const arr = map.get(key) || [];
      arr.push(s);
      map.set(key, arr);
    }
    return Array.from(map.entries()).slice(0, 14);
  }, [slots]);

  if (profileQuery.isLoading) {
    return (
      <section className="pt-20 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-2/3 mb-4" />
          <Skeleton className="h-24 w-full" />
        </div>
      </section>
    );
  }

  if (!lawyer) {
    return (
      <section className="pt-20 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border rounded-2xl p-6">
            <div className="font-bold text-gray-900">Lawyer not found</div>
            <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => navigate('/lawyers')}>
              Back
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const name = lawyer.user?.full_name || 'Verified Lawyer';

  return (
    <section className="pt-20 pb-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-gray-900">{name}</div>
                {lawyer.verified ? (
                  <Badge className="bg-emerald-50 text-emerald-800 border-emerald-100" variant="secondary">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </Badge>
                ) : null}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <MapPin className="w-4 h-4" />
                {lawyer.city}, {lawyer.state}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 mt-3">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-semibold">{avg ? avg.toFixed(1) : '—'}</span>
                <span className="text-gray-400">({count} reviews)</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Rate</div>
              <div className="text-2xl font-bold text-gray-900">
                ₹{Math.round(lawyer.rate_per_hour / 100).toLocaleString('en-IN')}/hr
              </div>
            </div>
          </div>

          {lawyer.bio ? <div className="text-gray-700 mt-5">{lawyer.bio}</div> : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {lawyer.specialization.map((s) => (
              <Badge key={s} variant="secondary" className="bg-indigo-50 text-indigo-800 border-indigo-100">
                {s}
              </Badge>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {lawyer.languages.map((l) => (
              <Badge key={l} variant="secondary" className="bg-gray-50 text-gray-700 border-gray-100">
                {l}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6 mt-6">
          <div className="bg-white border rounded-2xl p-6">
            <div className="font-bold text-gray-900 mb-2">Available slots (next 14 days)</div>
            <div className="text-sm text-gray-600 mb-4">Tap a time to select.</div>

            {slotsQuery.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : slots.length === 0 ? (
              <div className="text-sm text-gray-600">No slots available.</div>
            ) : (
              <div className="space-y-4">
                {slotsByDay.map(([day, items]) => (
                  <div key={day}>
                    <div className="text-sm font-semibold text-gray-900 mb-2">{day}</div>
                    <div className="flex flex-wrap gap-2">
                      {items.slice(0, 12).map((t) => {
                        const d = new Date(t);
                        const label = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                        const selected = slot === t;
                        return (
                          <button
                            key={t}
                            onClick={() => setSlot(t)}
                            className={`px-3 py-2 rounded-full text-sm border transition-colors ${
                              selected
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border rounded-2xl p-6 lg:sticky top-24 h-fit">
            <div className="font-bold text-gray-900">Book & Pay</div>
            <div className="text-sm text-gray-600 mt-2">
              Select a slot to continue.
            </div>

            <Button
              className="w-full mt-5 bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={!slot}
              onClick={() => setFlowOpen(true)}
            >
              Book Consultation
            </Button>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-6 mt-6">
          <div className="font-bold text-gray-900 mb-4">Reviews</div>
          {reviews.length === 0 ? (
            <div className="text-sm text-gray-600">No reviews yet.</div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="border border-gray-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900">{r.user?.full_name || 'User'}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      {r.rating}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(r.created_at).toLocaleDateString('en-IN')}</div>
                  {r.comment ? <div className="text-sm text-gray-700 mt-3">{r.comment}</div> : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {slot ? (
          <BookingFlow
            open={flowOpen}
            onOpenChange={setFlowOpen}
            lawyerId={lawyer.id}
            lawyerName={name}
            ratePerHourPaisa={lawyer.rate_per_hour}
            slotTimeIso={slot}
          />
        ) : null}
      </div>
    </section>
  );
}

