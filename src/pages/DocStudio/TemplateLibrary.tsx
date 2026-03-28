import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

import api from '@/api/axios';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import { templatesConfig, type TemplateConfig } from './templates.config';

const whatYouNeedById: Record<TemplateConfig['id'], string[]> = {
  nda: ['Both party names & addresses', 'Purpose', 'Duration'],
  rental_agreement: ['Landlord & tenant details', 'Property address', 'Rent + deposit', 'Start date & duration'],
  partnership_deed: ['Firm name', 'Partner details', 'Capital contributions', 'Profit ratio', 'Start date & city'],
  employment_contract: ['Employer & employee', 'Designation & department', 'Salary', 'Notice period', 'Start date & city'],
  affidavit: ['Deponent details', 'Statement text', 'Date & city', 'Notary/attesting name'],
};

export function TemplateLibrary() {
  const navigate = useNavigate();
  const userPlan = useAuthStore((s) => s.user?.plan) || 'freemium';

  const [docsCount, setDocsCount] = useState<number | null>(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  const templates = useMemo(() => templatesConfig, []);

  useEffect(() => {
    const loadDocsCount = async () => {
      setIsLoadingDocs(true);
      try {
        const resp = await api.get('/api/docs');
        const docs = resp?.data?.data?.documents || [];
        setDocsCount(docs.length);
      } catch {
        setDocsCount(0);
      } finally {
        setIsLoadingDocs(false);
      }
    };

    loadDocsCount();
  }, []);

  const isFreemium = userPlan === 'freemium';
  const reachedLimit = isFreemium && typeof docsCount === 'number' && docsCount >= 3;

  const handleGenerate = (templateId: TemplateConfig['id']) => {
    if (reachedLimit) {
      toast.info('Upgrade to Pro to generate more documents.');
      navigate('/dashboard');
      return;
    }
    navigate(`/doc-studio/generate/${templateId}`);
  };

  return (
    <section className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full mb-4">
            Document Studio
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Generate legal documents with <span className="text-indigo-600">clarity</span>
          </h2>
          <p className="text-gray-600">
            Pick a template, fill required fields, and get a protected PDF ready to download.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {templates.map((tpl, idx) => {
            const Icon = tpl.icon;
            const locked = reachedLimit;

            return (
              <div
                key={tpl.id}
                className={`relative group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 ${
                  idx % 2 === 0 ? '' : ''
                }`}
              >
                {locked && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100">
                      <Lock className="w-3.5 h-3.5" />
                      Locked
                    </Badge>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    Fast
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">{tpl.label}</h3>
                <p className="text-sm text-gray-600 mb-4">{tpl.description}</p>

                <div className="mb-5">
                  <div className="text-xs font-semibold text-gray-500 mb-2">What you'll need</div>
                  <ul className="space-y-2">
                    {whatYouNeedById[tpl.id].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => handleGenerate(tpl.id)}
                  disabled={isLoadingDocs}
                >
                  {locked ? (
                    <span className="inline-flex items-center gap-2">
                      Upgrade to Pro <ArrowRight className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Generate <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="text-center text-xs text-gray-500">
          {isFreemium ? (
            <>
              Freemium limit: <b>3 documents</b>.{' '}
              {typeof docsCount === 'number' ? (
                <>
                  You have <b>{docsCount}</b> generated.
                </>
              ) : (
                'Loading your documents...'
              )}
            </>
          ) : (
            <>Your plan includes unlimited document generation.</>
          )}
        </div>
      </div>
    </section>
  );
}

