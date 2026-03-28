import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  CheckCircle2,
  Calendar as CalendarIcon,
  Loader2,
  Lock,
  Sparkles,
} from 'lucide-react';

import api from '@/api/axios';
import { useAuthStore } from '@/store/authStore';
import { templatesConfig, type TemplateConfig, type TemplateField } from './templates.config';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

import { cn } from '@/lib/utils';

type FormState = Record<string, string>;

function DatePickerField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const selectedDate = value ? new Date(value + 'T00:00:00') : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground')}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-indigo-600" />
          {value ? format(selectedDate!, 'dd/MM/yyyy') : <span>{placeholder || 'Pick a date'}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(d) => {
            if (!d) return;
            const yyyyMmDd = format(d, 'yyyy-MM-dd');
            onChange(yyyyMmDd);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function FieldInput({
  field,
  value,
  onValueChange,
}: {
  field: TemplateField;
  value: string;
  onValueChange: (v: string) => void;
}) {
  if (field.type === 'textarea') {
    return (
      <Textarea
        placeholder={field.placeholder || ''}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="min-h-[120px]"
      />
    );
  }

  if (field.type === 'date') {
    return (
      <DatePickerField value={value} onChange={onValueChange} placeholder={field.placeholder || 'Select date'} />
    );
  }

  return (
    <Input
      type={field.type === 'number' ? 'number' : 'text'}
      placeholder={field.placeholder || ''}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    />
  );
}

export function GenerateDocument() {
  const navigate = useNavigate();
  const { template_name } = useParams();

  const template = useMemo<TemplateConfig | undefined>(() => {
    const id = String(template_name || '');
    return templatesConfig.find((t) => t.id === id);
  }, [template_name]);

  const plan = useAuthStore((s) => s.user?.plan) || 'freemium';

  const [title, setTitle] = useState('');
  const [formState, setFormState] = useState<FormState>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const requiredFields = template?.fields.filter((f) => f.required) || [];

  const filledState = useMemo(() => {
    const filled: Record<string, boolean> = {};
    if (!template) return filled;
    for (const f of template.fields) {
      const v = String(formState[f.name] ?? '').trim();
      filled[f.name] = v.length > 0;
    }
    return filled;
  }, [formState, template]);

  if (!template) {
    return (
      <div className="pt-24 px-4">
        <div className="max-w-2xl mx-auto bg-white border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-gray-900">Template not found</h2>
          <p className="text-gray-600 mt-2">Please choose a template from the library.</p>
          <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => navigate('/documents')}>
            Back to templates
          </Button>
        </div>
      </div>
    );
  }

  const TemplateIcon = template.icon;

  const canGenerate = requiredFields.every((f) => String(formState[f.name] ?? '').trim().length > 0) && title.trim().length > 0;

  const onGenerate = async () => {
    if (!canGenerate) {
      toast.error('Please fill all required fields.');
      return;
    }

    try {
      setIsGenerating(true);
      const fieldsPayload = template.fields.reduce<Record<string, string>>((acc, f) => {
        const raw = String(formState[f.name] ?? '');
        acc[f.name] = raw;
        return acc;
      }, {});

      const resp = await api.post('/api/docs/generate', {
        doc_type: template.id,
        title: title.trim(),
        fields: fieldsPayload,
      });

      const docId = resp?.data?.data?.doc_id;
      toast.success('Document generated successfully.');
      navigate('/my-documents', { state: { docId } });
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to generate document';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold mb-3">
              <TemplateIcon className="w-4 h-4" />
              {template.label} Studio
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Generate your document</h2>
            <p className="text-gray-600">
              Your document will be ready in <b>~10 seconds</b>.
            </p>
          </div>
          {plan === 'freemium' && (
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">
              <Lock className="w-3.5 h-3.5" />
              Freemium (max 3 docs)
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="bg-white border rounded-2xl p-6">
            <div className="mb-6">
              <Label htmlFor="doc_title" className="text-sm font-medium">
                Document Title
              </Label>
              <Input
                id="doc_title"
                className="mt-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`e.g., ${template.label} - ${new Date().getFullYear()}`}
              />
            </div>

            <div className="space-y-5">
              {template.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name} className="text-sm font-medium">
                    {field.label} {field.required ? <span className="text-red-500">*</span> : null}
                  </Label>
                  <FieldInput
                    field={field}
                    value={String(formState[field.name] ?? '')}
                    onValueChange={(v) => setFormState((s) => ({ ...s, [field.name]: v }))}
                  />
                </div>
              ))}
            </div>

            <div className="mt-7">
              <Button
                onClick={onGenerate}
                disabled={!canGenerate || isGenerating}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isGenerating ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Generate Document
                  </span>
                )}
              </Button>
            </div>
          </div>

          <div className="lg:sticky top-24">
            <div className="bg-gray-50 border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900">Live preview</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">We’ll include the fields you’ve filled here.</p>

              <div className="space-y-3">
                {template.fields.map((f) => {
                  const ok = Boolean(filledState[f.name]);
                  return (
                    <div key={f.name} className="flex items-center justify-between gap-4">
                      <div className="text-sm text-gray-800">{f.label}</div>
                      <div
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          ok ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-400 border border-gray-200'
                        }`}
                      >
                        {ok ? 'Filled' : 'Missing'}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 text-sm text-gray-600 bg-white border rounded-xl p-4">
                <b>Your document will be ready</b> in around 10 seconds. Generation is performed server-side with a protected PDF output.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

