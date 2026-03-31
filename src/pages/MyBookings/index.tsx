import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarClock, ExternalLink, Star, Timer, Video } from 'lucide-react';

import api from '@/api/axios';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CitizenVideoCall } from '@/components/webrtc/CitizenVideoCall';

type BookingRow = {
  id: string;
  lawyer_id: string;
  lawyer_user_id?: string | null;
  lawyer_name: string | null;
  is_lawyer_view?: boolean;
  slot_time: string;
  duration_mins: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  meeting_url: string | null;
  reviewed: boolean;
  call_status?: string;
};

function countdown(slotIso: string) {
  const ms = new Date(slotIso).getTime() - Date.now();
  if (ms <= 0) return 'Started';
  const mins = Math.floor(ms / 60000);
  const hrs = Math.floor(mins / 60);
  const d = Math.floor(hrs / 24);
  const rH = hrs % 24;
  const rM = mins % 60;
  if (d > 0) return `${d}d ${rH}h`;
  if (hrs > 0) return `${hrs}h ${rM}m`;
  return `${mins}m`;
}

export function MyBookings() {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<BookingRow | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [videoCallBooking, setVideoCallBooking] = useState<BookingRow | null>(null);

  const query = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => (await api.get('/api/bookings')).data.data.bookings as BookingRow[],
    staleTime: 30 * 1000,
  });

  const bookings = query.data || [];

  const upcoming = useMemo(
    () => bookings.filter((b) => ['pending', 'confirmed'].includes(b.status)).sort((a, b) => new Date(a.slot_time).getTime() - new Date(b.slot_time).getTime()),
    [bookings],
  );
  const past = useMemo(
    () => bookings.filter((b) => ['completed', 'cancelled'].includes(b.status)).sort((a, b) => new Date(b.slot_time).getTime() - new Date(a.slot_time).getTime()),
    [bookings],
  );

  const openReview = (b: BookingRow) => {
    setReviewBooking(b);
    setRating(5);
    setComment('');
    setReviewOpen(true);
  };

  const submitReview = async () => {
    if (!reviewBooking) return;
    try {
      await api.post(`/api/bookings/${reviewBooking.id}/review`, { rating, comment });
      toast.success('Review submitted');
      setReviewOpen(false);
      query.refetch();
    } catch (err) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed';
      toast.error(message);
    }
  };

  return (
    <section className="pt-20 pb-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
            <p className="text-gray-600 mt-1">Upcoming consultations and past sessions.</p>
          </div>
          <Button className="bg-red-600 hover:bg-red-700 text-white" asChild>
            <Link to="/lawyers">Book new</Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white border rounded-2xl p-6">
            <div className="font-bold text-gray-900 mb-4">Upcoming</div>
            {query.isLoading ? (
              <div className="text-sm text-gray-500">Loading…</div>
            ) : upcoming.length === 0 ? (
              <div className="text-sm text-gray-600">No upcoming bookings.</div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((b) => (
                  <div key={b.id} className="border border-gray-100 rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{b.lawyer_name || 'Lawyer'}</div>
                        <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                          <CalendarClock className="w-4 h-4" />
                          {new Date(b.slot_time).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-red-50 text-red-800 border-red-100">
                        {b.status}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="text-sm text-gray-700 flex items-center gap-2">
                        <Timer className="w-4 h-4 text-red-600" />
                        Starts in <b>{countdown(b.slot_time)}</b>
                      </div>
                      <div className="flex gap-2">
                        {b.meeting_url ? (
                          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => window.open(b.meeting_url!, '_blank')}>
                            Join Meeting <ExternalLink className="w-4 h-4 ml-2" />
                          </Button>
                        ) : null}
                        {!b.is_lawyer_view && (
                          <Button
                            variant="outline"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                            onClick={() => setVideoCallBooking(b)}
                          >
                            <Video className="w-4 h-4 mr-2" />
                            Video Call
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border rounded-2xl p-6">
            <div className="font-bold text-gray-900 mb-4">Past</div>
            {query.isLoading ? (
              <div className="text-sm text-gray-500">Loading…</div>
            ) : past.length === 0 ? (
              <div className="text-sm text-gray-600">No past bookings.</div>
            ) : (
              <div className="space-y-3">
                {past.map((b) => (
                  <div key={b.id} className="border border-gray-100 rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{b.lawyer_name || 'Lawyer'}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {new Date(b.slot_time).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          b.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                            : 'bg-gray-50 text-gray-700 border-gray-100'
                        }
                      >
                        {b.status}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      {b.status === 'completed' && !b.reviewed ? (
                        <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => openReview(b)}>
                          Leave Review <Star className="w-4 h-4 ml-2 text-amber-500" />
                        </Button>
                      ) : (
                        <div className="text-sm text-gray-500">{b.reviewed ? 'Reviewed' : '—'}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video call component */}
      {videoCallBooking && (
        <CitizenVideoCall
          booking_id={videoCallBooking.id}
          lawyer_name={videoCallBooking.lawyer_name || 'Lawyer'}
          lawyer_id={videoCallBooking.lawyer_user_id || videoCallBooking.lawyer_id}
          onClose={() => setVideoCallBooking(null)}
        />
      )}

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave a review</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-2">Rating</div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRating(r)}
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center ${rating >= r ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'
                      }`}
                    aria-label={`${r} star`}
                  >
                    <Star className={`w-5 h-5 ${rating >= r ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-900 mb-2">Comment</div>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience…" />
            </div>

            <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={submitReview}>
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

