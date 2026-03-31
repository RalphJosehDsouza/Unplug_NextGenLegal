import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';

import { lawMapperEntries, type LawMapperEntry, type LawMapperChangeType } from '@/data/bnsMapperData';

import { Badge } from '@/components/ui/badge';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const oldActOptions = ['all', 'IPC 1860', 'CrPC 1973', 'Indian Evidence Act'] as const;
type OldActFilter = (typeof oldActOptions)[number];

const changeTypeOptions: Array<'all' | LawMapperChangeType> = ['all', 'substituted', 'amended', 'repealed', 'clarified', 'new', 'procedural'];

function changeTypeTone(changeType: LawMapperChangeType) {
  switch (changeType) {
    case 'substituted':
      return 'bg-red-50 text-red-800 border-red-100';
    case 'amended':
      return 'bg-amber-50 text-amber-800 border-amber-100';
    case 'repealed':
      return 'bg-red-50 text-red-800 border-red-100';
    case 'clarified':
      return 'bg-emerald-50 text-emerald-800 border-emerald-100';
    case 'new':
      return 'bg-red-50 text-red-800 border-red-100';
    case 'procedural':
      return 'bg-gray-50 text-gray-800 border-gray-100';
    default:
      return 'bg-gray-50 text-gray-800 border-gray-100';
  }
}

function renderSectionLabel(entry: LawMapperEntry) {
  return `${entry.old_act.split(' ')[0]} ${entry.old_section} → ${entry.new_act.split(' ')[0]} ${entry.new_section}`;
}

export function LawMapperPage() {
  const [query, setQuery] = useState('');
  const [oldAct, setOldAct] = useState<OldActFilter>('all');
  const [changeType, setChangeType] = useState<'all' | LawMapperChangeType>('all');

  useEffect(() => {
    const title = 'BNS / BNSS Mapper | NextGenLegal';
    const desc = 'Search old IPC/CrPC/Evidence sections and view the closest BNS/BNSS/BSA crosswalk (with key changes).';
    document.title = title;

    // Best-effort meta description.
    const existing = document.querySelector('meta[name="description"]');
    if (existing) existing.setAttribute('content', desc);
    else {
      const tag = document.createElement('meta');
      tag.setAttribute('name', 'description');
      tag.setAttribute('content', desc);
      document.head.appendChild(tag);
    }

    const faqQuestions = lawMapperEntries.slice(0, 10).map((e) => ({
      question: `What is the BNS/BNSS mapping for ${e.old_act} ${e.old_section}?`,
      answer: `This mapper shows a crosswalk row for ${e.old_act} ${e.old_section} to ${e.new_act} ${e.new_section}. Key changes are listed under “Key changes”.`,
    }));

    const scriptId = 'law-mapper-faq-jsonld';
    const prev = document.getElementById(scriptId);
    if (prev) prev.remove();

    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqQuestions.map((q) => ({
        '@type': 'Question',
        name: q.question,
        acceptedAnswer: { '@type': 'Answer', text: q.answer },
      })),
    });
    document.head.appendChild(script);

    return () => {
      const s = document.getElementById(scriptId);
      if (s) s.remove();
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lawMapperEntries.filter((e) => {
      if (oldAct !== 'all' && e.old_act !== oldAct) return false;
      if (changeType !== 'all' && e.change_type !== changeType) return false;

      if (!q) return true;

      const hay = [
        e.old_act,
        e.old_section,
        e.old_title,
        e.old_summary,
        e.new_act,
        e.new_section,
        e.new_title,
        e.new_summary,
        ...e.key_changes,
      ]
        .join(' ')
        .toLowerCase();

      return hay.includes(q);
    });
  }, [query, oldAct, changeType]);

  return (
    <section className="pt-24 pb-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">BNS / BNSS / BSA Mapper</h1>
            <p className="text-gray-600 mt-2 max-w-2xl">
              Search old IPC / CrPC / Evidence Act provisions and view the closest BNS / BNSS / BSA crosswalk with key changes.
            </p>
            <div className="mt-3 text-sm text-gray-500">
              Note: verify the exact mapping against official schedules before relying on it.
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-6">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search: section number, title keywords (e.g. 420, cruelty, evidence)…"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <Select value={oldAct} onValueChange={(v) => setOldAct(v as OldActFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Old Act" />
                </SelectTrigger>
                <SelectContent>
                  {oldActOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt === 'all' ? 'All old acts' : opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-3">
              <Select value={changeType} onValueChange={(v) => setChangeType(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Change type" />
                </SelectTrigger>
                <SelectContent>
                  {changeTypeOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt === 'all' ? 'All change types' : opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <div>
              Results: <b className="text-gray-900">{filtered.length}</b>
            </div>
            <div className="text-gray-500">Tip: try “IPC 420” or “CrPC search”.</div>
          </div>
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <Card className="p-6 text-center text-sm text-gray-600">No matches found. Try another keyword or section number.</Card>
          ) : (
            filtered.slice(0, 60).map((entry) => (
              <Card key={entry.id} className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-red-50 text-red-800 border-red-100" variant="outline">
                        Old
                      </Badge>
                      <div className="font-semibold text-gray-900">{entry.old_act}</div>
                    </div>
                    <div className="text-sm text-gray-700 mb-1">
                      <b>{entry.old_section}</b> • {entry.old_title}
                    </div>
                    <div className="text-xs text-gray-600 leading-relaxed">{entry.old_summary}</div>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="text-gray-500 font-medium mb-2">→</div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={changeTypeTone(entry.change_type)} variant="secondary">
                        {entry.change_type}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 text-center">{renderSectionLabel(entry)}</div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2 justify-end md:justify-start">
                      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-100" variant="outline">
                        New
                      </Badge>
                      <div className="font-semibold text-gray-900">{entry.new_act}</div>
                    </div>
                    <div className="text-sm text-gray-700 mb-1">
                      <b>{entry.new_section}</b> • {entry.new_title}
                    </div>
                    <div className="text-xs text-gray-600 leading-relaxed">{entry.new_summary}</div>
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-red-700 font-medium flex items-center gap-2">
                    Key changes <ChevronRight className="w-4 h-4" />
                  </summary>
                  <div className="mt-3 space-y-2">
                    {entry.key_changes.map((kc, idx) => (
                      <div key={idx} className="text-sm text-gray-700">
                        • {kc}
                      </div>
                    ))}
                  </div>
                </details>
              </Card>
            ))
          )}
        </div>

        {filtered.length > 60 ? (
          <div className="mt-6 text-center text-xs text-gray-500">
            Showing first 60 results. Refine your search to narrow further.
          </div>
        ) : null}
      </div>
    </section>
  );
}

