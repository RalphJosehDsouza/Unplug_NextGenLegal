import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal } from 'lucide-react';

import api from '@/api/axios';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';

import { LawyerCard, type LawyerListItem } from '@/components/lawyers/LawyerCard';

const SPECIALIZATIONS = [
  'Property Law',
  'Corporate Law',
  'Family Law',
  'Criminal Law',
  'GST & Taxation',
  'Labour Law',
  'Intellectual Property',
];

const LANGUAGES = ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Kannada'];

const STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
];

function rupeesToPaisa(v: number) {
  return Math.round(v * 100);
}

type ApiResponse = {
  lawyers: LawyerListItem[];
  total: number;
  page: number;
  pages: number;
};

function Filters({
  specialization,
  setSpecialization,
  languages,
  setLanguages,
  state,
  setState,
  verifiedOnly,
  setVerifiedOnly,
  price,
  setPrice,
  stars,
  setStars,
}: {
  specialization: string[];
  setSpecialization: (v: string[]) => void;
  languages: string[];
  setLanguages: (v: string[]) => void;
  state: string;
  setState: (v: string) => void;
  verifiedOnly: boolean;
  setVerifiedOnly: (v: boolean) => void;
  price: [number, number]; // rupees
  setPrice: (v: [number, number]) => void;
  stars: number[];
  setStars: (v: number[]) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <div className="font-semibold text-gray-900 mb-3">Specializations</div>
        <div className="space-y-2">
          {SPECIALIZATIONS.map((s) => {
            const checked = specialization.includes(s);
            return (
              <label key={s} className="flex items-center gap-2 text-sm text-gray-700">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => {
                    const next = Boolean(v)
                      ? Array.from(new Set([...specialization, s]))
                      : specialization.filter((x) => x !== s);
                    setSpecialization(next);
                  }}
                />
                {s}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <div className="font-semibold text-gray-900 mb-3">Languages</div>
        <div className="space-y-2">
          {LANGUAGES.map((l) => {
            const checked = languages.includes(l);
            return (
              <label key={l} className="flex items-center gap-2 text-sm text-gray-700">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => {
                    const next = Boolean(v)
                      ? Array.from(new Set([...languages, l]))
                      : languages.filter((x) => x !== l);
                    setLanguages(next);
                  }}
                />
                {l}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <div className="font-semibold text-gray-900 mb-3">State</div>
        <Select value={state} onValueChange={setState}>
          <SelectTrigger>
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All states</SelectItem>
            {STATES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="font-semibold text-gray-900 mb-3">Price range</div>
        <div className="text-sm text-gray-600 mb-3">
          ₹{price[0].toLocaleString('en-IN')}/hr – ₹{price[1].toLocaleString('en-IN')}/hr
        </div>
        <Slider
          value={[price[0], price[1]]}
          min={0}
          max={5000}
          step={100}
          onValueChange={(v) => setPrice([v[0], v[1]])}
        />
      </div>

      <div>
        <div className="font-semibold text-gray-900 mb-3">Stars (user reviews)</div>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const checked = stars.includes(star);
            return (
              <label key={star} className="flex items-center gap-2 text-sm text-gray-700">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => {
                    const next = Boolean(v)
                      ? Array.from(new Set([...stars, star])).sort((a, b) => b - a)
                      : stars.filter((x) => x !== star);
                    setStars(next);
                  }}
                />
                {star} star
              </label>
            );
          })}
        </div>
        <div className="text-xs text-gray-500 mt-2">Unrated lawyers are also shown.</div>
      </div>

      <div className="flex items-center justify-between">
        <div className="font-semibold text-gray-900">Verified only</div>
        <Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
      </div>
    </div>
  );
}

export function LawyerSearch() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const specializationFromUrl = searchParams.get('specialization');

  const [specialization, setSpecialization] = useState<string[]>(() => (specializationFromUrl ? [specializationFromUrl] : []));
  const [languages, setLanguages] = useState<string[]>([]);
  const [state, setState] = useState<string>('__all__');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [price, setPrice] = useState<[number, number]>([0, 5000]); // rupees
  const [stars, setStars] = useState<number[]>([]);

  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'rate_asc' | 'rate_desc' | 'rating'>('rate_asc');

  useEffect(() => {
    if (!specializationFromUrl) return;
    setSpecialization([specializationFromUrl]);
    setPage(1);
  }, [specializationFromUrl]);

  const query = useQuery({
    queryKey: ['lawyers', specialization, languages, state, verifiedOnly, price, stars, page, sort],
    queryFn: async () => {
      const resp = await api.get('/api/lawyers', {
        params: {
          specialization: specialization.join(','),
          language: languages.join(','),
          state: state === '__all__' ? undefined : state,
          verified_only: verifiedOnly,
          min_rate: rupeesToPaisa(price[0]),
          max_rate: rupeesToPaisa(price[1]),
          stars: stars.join(','),
          page,
          limit: 12,
          sort,
        },
      });
      return resp.data.data as ApiResponse;
    },
    staleTime: 60 * 1000,
  });

  const data = query.data;
  const lawyers = data?.lawyers || [];
  const pages = data?.pages || 1;

  const appliedCount = specialization.length + languages.length + stars.length + (state !== '__all__' ? 1 : 0);

  const reset = () => {
    setSpecialization([]);
    setLanguages([]);
    setState('__all__');
    setVerifiedOnly(true);
    setPrice([0, 5000]);
    setStars([]);
    setPage(1);
    setSort('rate_asc');
    toast.success('Filters reset');
  };

  const sidebar = (
    <div className="bg-white border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="font-bold text-gray-900 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-red-600" />
          Filters
        </div>
        <button onClick={reset} className="text-xs font-semibold text-red-600 hover:text-red-700">
          Reset
        </button>
      </div>
      <Filters
        specialization={specialization}
        setSpecialization={(v) => {
          setSpecialization(v);
          setPage(1);
        }}
        languages={languages}
        setLanguages={(v) => {
          setLanguages(v);
          setPage(1);
        }}
        state={state}
        setState={(v) => {
          setState(v);
          setPage(1);
        }}
        verifiedOnly={verifiedOnly}
        setVerifiedOnly={(v) => {
          setVerifiedOnly(v);
          setPage(1);
        }}
        price={price}
        setPrice={(v) => {
          setPrice(v);
          setPage(1);
        }}
        stars={stars}
        setStars={(v) => {
          setStars(v);
          setPage(1);
        }}
      />
    </div>
  );

  return (
    <section className="pt-20 pb-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Find Lawyers</h2>
            <p className="text-gray-600 mt-1">Browse verified legal experts and book a consultation.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2 text-sm text-gray-600">
              {appliedCount > 0 ? (
                <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                  {appliedCount} filters
                </Badge>
              ) : null}
            </div>

            <div className="lg:hidden">
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Filters</DrawerTitle>
                  </DrawerHeader>
                  <div className="px-4 pb-6">{sidebar}</div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
          <div className="hidden lg:block sticky top-24">{sidebar}</div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                {query.isLoading ? 'Loading…' : `${data?.total || lawyers.length} result(s)`}
              </div>
              <Select value={sort} onValueChange={(v) => setSort(v as any)}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rate_asc">Price (low to high)</SelectItem>
                  <SelectItem value="rate_desc">Price (high to low)</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {query.isLoading ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-white border rounded-2xl p-6">
                    <Skeleton className="h-6 w-2/3 mb-3" />
                    <Skeleton className="h-4 w-1/2 mb-5" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {lawyers.map((l) => (
                    <LawyerCard key={l.id} lawyer={l} onBook={() => navigate(`/lawyers/${l.id}`)} />
                  ))}
                </div>

                <div className="flex items-center justify-between mt-6">
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  >
                    Prev
                  </Button>
                  <div className="text-sm text-gray-600">
                    Page <b>{page}</b> of <b>{pages}</b>
                  </div>
                  <Button
                    variant="outline"
                    disabled={page >= pages}
                    onClick={() => setPage((p) => Math.min(p + 1, pages))}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

