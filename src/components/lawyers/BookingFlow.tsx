import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, CheckCircle2, Loader2 } from 'lucide-react';

import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function formatRupeesFromPaisa(paisa: number) {
  const rupees = Math.round((Number(paisa) || 0) / 100);
  return rupees.toLocaleString('en-IN');
}

function loadRazorpay() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.body.appendChild(script);
  });
}

function googleCalendarUrl({ title, startIso, durationMins, details }: { title: string; startIso: string; durationMins: number; details: string }) {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + durationMins * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', title);
  url.searchParams.set('dates', `${fmt(start)}/${fmt(end)}`);
  url.searchParams.set('details', details);
  return url.toString();
}

type Step = 1 | 2 | 3 | 4;

export function BookingFlow({
  open,
  onOpenChange,
  lawyerId,
  lawyerName,
  ratePerHourPaisa,
  slotTimeIso,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lawyerId: string;
  lawyerName: string;
  ratePerHourPaisa: number;
  slotTimeIso: string;
}) {
  const [step, setStep] = useState<Step>(1);
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [meetingUrl, setMeetingUrl] = useState<string | null>(null);

  const amountPaise = useMemo(() => Math.floor((ratePerHourPaisa * duration) / 60), [ratePerHourPaisa, duration]);

  useEffect(() => {
    if (open) {
      setStep(1);
      setDuration(60);
      setNotes('');
      setLoading(false);
      setBookingId(null);
      setOrder(null);
      setMeetingUrl(null);
    }
  }, [open]);

  const createOrder = async () => {
    try {
      setLoading(true);
      const resp = await api.post('/api/bookings', {
        lawyer_id: lawyerId,
        slot_time: slotTimeIso,
        duration_mins: duration,
        notes: notes || undefined,
      });
      setOrder(resp.data.data.order);
      setBookingId(resp.data.data.booking_id);
      setStep(3);
    } catch (err) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create order';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const openCheckout = async () => {
    try {
      if (!order || !bookingId) return;
      setLoading(true);
      await loadRazorpay();

      const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!key) {
        toast.error('Missing VITE_RAZORPAY_KEY_ID');
        return;
      }

      const rz = new window.Razorpay({
        key,
        amount: order.amount,
        currency: order.currency,
        name: 'NextGenLegal',
        description: 'Consultation booking',
        order_id: order.id,
        handler: async (response: any) => {
          try {
            const confirmResp = await api.post('/api/bookings/confirm', {
              booking_id: bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setMeetingUrl(confirmResp.data.data.meeting_url);
            setStep(4);
            toast.success('Booking confirmed');
          } catch (e) {
            toast.error('Payment confirmed but booking confirmation failed');
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        theme: { color: '#4f46e5' },
      });

      rz.open();
    } catch (err) {
      toast.error('Failed to open checkout');
    } finally {
      setLoading(false);
    }
  };

  const calendarUrl = useMemo(() => {
    if (!meetingUrl) return null;
    return googleCalendarUrl({
      title: `NextGenLegal Consultation with ${lawyerName}`,
      startIso: slotTimeIso,
      durationMins: duration,
      details: `Meeting link: ${meetingUrl}`,
    });
  }, [meetingUrl, lawyerName, slotTimeIso, duration]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] max-w-[calc(100vw-2rem)]">
        <SheetHeader>
          <SheetTitle>Booking</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <div className="font-semibold text-gray-900">{lawyerName}</div>
                <div className="mt-1">Slot: {new Date(slotTimeIso).toLocaleString()}</div>
              </div>
              <div>
                <Label>Duration</Label>
                <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                    <SelectItem value="90">90 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-gray-50 border rounded-2xl p-4">
                <div className="text-sm text-gray-600">Price summary</div>
                <div className="text-xl font-bold text-gray-900 mt-1">₹{formatRupeesFromPaisa(amountPaise)}</div>
              </div>

              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Notes for the lawyer (optional)</Label>
                <Textarea className="mt-2" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Briefly describe your issue…" />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={createOrder} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Proceed to pay'}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-gray-50 border rounded-2xl p-4">
                <div className="text-sm text-gray-600">Order created</div>
                <div className="text-xs text-gray-500 mt-1">Complete payment to confirm.</div>
              </div>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={openCheckout} disabled={loading}>
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Opening…
                  </span>
                ) : (
                  'Pay with Razorpay'
                )}
              </Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  Success
                </div>
                <div className="text-sm text-emerald-700 mt-2">Your booking is confirmed.</div>
                {meetingUrl ? (
                  <a className="text-sm text-indigo-700 font-semibold mt-3 block break-all" href={meetingUrl} target="_blank" rel="noreferrer">
                    {meetingUrl}
                  </a>
                ) : null}
              </div>

              <div className="flex gap-2">
                {calendarUrl ? (
                  <Button
                    variant="outline"
                    className="flex-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    onClick={() => window.open(calendarUrl, '_blank')}
                  >
                    <CalendarPlus className="w-4 h-4 mr-2" />
                    Add to calendar
                  </Button>
                ) : null}
                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

