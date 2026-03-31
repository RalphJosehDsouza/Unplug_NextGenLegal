import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { templatesConfig, CATEGORY_LABELS, type TemplateCategory } from './templates.config';

const ALL_CATEGORIES: Array<'all' | TemplateCategory> = ['all', 'business', 'real_estate', 'family', 'personal'];

export function TemplateLibrary() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<'all' | TemplateCategory>('all');

  const templates = useMemo(() => {
    if (activeCategory === 'all') return templatesConfig;
    return templatesConfig.filter(t => t.category === activeCategory);
  }, [activeCategory]);

  const handleGenerate = (templateId: string) => {
    navigate(`/doc-studio/generate/${templateId}`);
  };

  return (
    <section className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <span className="inline-block px-4 py-1.5 bg-red-100 text-red-700 text-sm font-semibold rounded-full mb-4">
            Document Studio
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Generate legal documents with <span className="text-red-600">clarity</span>
          </h2>
          <p className="text-gray-600">
            Pick a template, fill required fields, and get a protected PDF powered by Gemini AI — ready to download.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'All Templates' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Template count */}
        <p className="text-center text-sm text-gray-500 mb-6">
          Showing {templates.length} template{templates.length !== 1 ? 's' : ''}
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {templates.map((tpl) => {
            const Icon = tpl.icon;
            return (
              <div
                key={tpl.id}
                className="relative group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-red-200 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-700">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    <span className="px-2 py-0.5 bg-red-50 rounded-full text-xs">
                      {CATEGORY_LABELS[tpl.category]}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">{tpl.label}</h3>
                <p className="text-sm text-gray-600 mb-4">{tpl.description}</p>

                {tpl.govtFeeNote && (
                  <div className="flex items-start gap-2 mb-4 p-2 bg-amber-50 rounded-lg border border-amber-200">
                    <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-amber-700">{tpl.govtFeeNote}</span>
                  </div>
                )}

                <div className="mb-5">
                  <div className="text-xs font-semibold text-gray-500 mb-2">
                    {tpl.fields.filter(f => f.required).length} fields required
                  </div>
                </div>

                <Button
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => handleGenerate(tpl.id)}
                >
                  <span className="inline-flex items-center gap-2">
                    Generate <ArrowRight className="w-4 h-4" />
                  </span>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
