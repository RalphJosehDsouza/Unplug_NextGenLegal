import { useMemo } from 'react';
import { CheckCircle2, MapPin, Star } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export type LawyerListItem = {
  id: string;
  city: string;
  state: string;
  specialization: string[];
  languages: string[];
  rate_per_hour: number; // paisa
  verified: boolean;
  user: { full_name: string | null; email: string | null };
  avg_rating?: number;
  review_count?: number;
};

function initials(name: string) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || '';
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '';
  return (a + b).toUpperCase() || 'LG';
}

function formatRupeesFromPaisa(paisa: number) {
  const rupees = Math.round((Number(paisa) || 0) / 100);
  return rupees.toLocaleString('en-IN');
}

export function LawyerCard({
  lawyer,
  onBook,
  buttonLabel,
}: {
  lawyer: LawyerListItem;
  onBook: () => void;
  buttonLabel?: string;
}) {
  const name = lawyer.user?.full_name || 'Verified Lawyer';
  const init = useMemo(() => initials(name), [name]);

  const tags = lawyer.specialization || [];
  const shown = tags.slice(0, 3);
  const more = Math.max(tags.length - shown.length, 0);

  const avg = lawyer.avg_rating || 0;
  const count = lawyer.review_count || 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600 text-white font-bold flex items-center justify-center">
            {init}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="font-bold text-gray-900">{name}</div>
              {lawyer.verified ? (
                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-100" variant="secondary">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified
                </Badge>
              ) : null}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <MapPin className="w-4 h-4" />
              {lawyer.city}, {lawyer.state}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {shown.map((s) => (
          <Badge key={s} variant="secondary" className="bg-red-50 text-red-800 border-red-100">
            {s}
          </Badge>
        ))}
        {more > 0 ? (
          <Badge variant="secondary" className="bg-gray-50 text-gray-700 border-gray-100">
            +{more} more
          </Badge>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(lawyer.languages || []).slice(0, 6).map((l) => (
          <Badge key={l} variant="secondary" className="bg-gray-50 text-gray-700 border-gray-100">
            {l}
          </Badge>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="font-semibold">{avg ? avg.toFixed(1) : '—'}</span>
          <span className="text-gray-400">({count})</span>
        </div>
        <div className="text-gray-900">
          <span className="text-lg font-bold">₹{formatRupeesFromPaisa(lawyer.rate_per_hour)}/hr</span>
        </div>
      </div>

      <Button className="w-full mt-5 bg-red-600 hover:bg-red-700 text-white" onClick={onBook}>
        {buttonLabel || 'Book Consultation'}
      </Button>
    </div>
  );
}

