import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Pencil, Trash2, Plus, AlertTriangle } from 'lucide-react';

import api from '@/api/axios';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type TaskStatus = 'pending' | 'notified' | 'completed' | 'overdue';

type ComplianceTask = {
  id: string;
  task_type: string;
  label: string;
  due_date: string;
  status: TaskStatus;
  notes?: string | null;
  external_ref?: string | null;
  daysUntilDue: number;
};

type GroupedTasks = Record<TaskStatus, ComplianceTask[]>;

function taskTypeBadge(taskType: string) {
  const t = taskType.toLowerCase();
  if (t.includes('gst')) return { cls: 'bg-red-50 text-red-800 border-red-100', label: 'GST' };
  if (t.includes('rera')) return { cls: 'bg-purple-50 text-purple-800 border-purple-100', label: 'RERA' };
  if (t.includes('contract')) return { cls: 'bg-amber-50 text-amber-800 border-amber-100', label: 'Contract' };
  if (t.includes('mca')) return { cls: 'bg-teal-50 text-teal-800 border-teal-100', label: 'MCA' };
  return { cls: 'bg-gray-50 text-gray-700 border-gray-100', label: 'Custom' };
}

function dueChip(daysUntilDue: number) {
  if (daysUntilDue < 0) {
    const d = Math.abs(daysUntilDue);
    return { cls: 'bg-red-50 text-red-700 border-red-100', label: d === 1 ? '1 day overdue' : `${d} days overdue` };
  }
  if (daysUntilDue === 0) return { cls: 'bg-orange-50 text-orange-800 border-orange-100', label: 'Due today' };
  if (daysUntilDue < 7) return { cls: 'bg-orange-50 text-orange-800 border-orange-100', label: '<7 days' };
  if (daysUntilDue <= 30) return { cls: 'bg-yellow-50 text-yellow-800 border-yellow-100', label: '7–30 days' };
  return { cls: 'bg-emerald-50 text-emerald-800 border-emerald-100', label: '>30 days' };
}

function formatDue(dateOnly: string) {
  const d = new Date(dateOnly + 'T00:00:00');
  return format(d, 'dd MMM yyyy');
}

function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const selected = value ? new Date(value + 'T00:00:00') : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground')}>
          {value ? format(selected!, 'dd/MM/yyyy') : 'Pick a date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            if (!d) return;
            onChange(format(d, 'yyyy-MM-dd'));
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

const TASK_TYPES = [
  { id: 'gst_return_monthly', label: 'GST Return (Monthly)' },
  { id: 'gst_return_quarterly', label: 'GST Return (Quarterly)' },
  { id: 'rera_registration', label: 'RERA Renewal' },
  { id: 'mca_annual_return', label: 'MCA Annual Return' },
  { id: 'contract_expiry', label: 'Employment Contract Expiry' },
  { id: 'custom', label: 'Custom' },
];

function defaultLabelForType(type: string) {
  const found = TASK_TYPES.find((t) => t.id === type);
  return found?.label || 'Compliance Task';
}

export function ComplianceDashboard() {
  const [addOpen, setAddOpen] = useState(false);
  const [editTask, setEditTask] = useState<ComplianceTask | null>(null);

  const [form, setForm] = useState({
    task_type: 'gst_return_monthly',
    label: '',
    due_date: '',
    external_ref: '',
    notes: '',
  });

  const statsQuery = useQuery({
    queryKey: ['compliance-stats'],
    queryFn: async () => (await api.get('/api/compliance/stats')).data.data,
    staleTime: 60 * 1000,
  });

  const tasksQuery = useQuery({
    queryKey: ['compliance-tasks'],
    queryFn: async () => (await api.get('/api/compliance')).data.data.tasks as GroupedTasks,
    staleTime: 30 * 1000,
  });

  const grouped = tasksQuery.data || { pending: [], notified: [], completed: [], overdue: [] };

  const openAdd = () => {
    setEditTask(null);
    setForm({
      task_type: 'gst_return_monthly',
      label: defaultLabelForType('gst_return_monthly'),
      due_date: '',
      external_ref: '',
      notes: '',
    });
    setAddOpen(true);
  };

  const openEdit = (t: ComplianceTask) => {
    setEditTask(t);
    setForm({
      task_type: t.task_type,
      label: t.label,
      due_date: t.due_date,
      external_ref: t.external_ref || '',
      notes: t.notes || '',
    });
    setAddOpen(true);
  };

  const submit = async () => {
    try {
      if (!form.label.trim()) {
        toast.error('Label is required');
        return;
      }

      if (!editTask) {
        await api.post('/api/compliance', {
          task_type: form.task_type,
          label: form.label,
          due_date: form.due_date || undefined,
          external_ref: form.external_ref || undefined,
          notes: form.notes || undefined,
        });
        toast.success('Task created');
      } else {
        await api.patch(`/api/compliance/${editTask.id}`, {
          task_type: form.task_type,
          label: form.label,
          due_date: form.due_date,
          external_ref: form.external_ref || null,
          notes: form.notes || null,
        });
        toast.success('Task updated');
      }

      setAddOpen(false);
      await tasksQuery.refetch();
      await statsQuery.refetch();
    } catch (err) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed';
      toast.error(message);
    }
  };

  const markComplete = async (t: ComplianceTask) => {
    try {
      await api.patch(`/api/compliance/${t.id}`, { status: 'completed' });
      toast.success('Marked complete');
      await tasksQuery.refetch();
      await statsQuery.refetch();
    } catch (err) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed';
      toast.error(message);
    }
  };

  const remove = async (t: ComplianceTask) => {
    try {
      await api.delete(`/api/compliance/${t.id}`);
      toast.success('Deleted');
      await tasksQuery.refetch();
      await statsQuery.refetch();
    } catch (err) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed';
      toast.error(message);
    }
  };

  const columns: { id: TaskStatus; title: string; tone: string }[] = [
    { id: 'pending', title: 'Pending', tone: 'bg-gray-100 text-gray-800' },
    { id: 'notified', title: 'Notified', tone: 'bg-red-100 text-red-800' },
    { id: 'completed', title: 'Completed', tone: 'bg-emerald-100 text-emerald-800' },
    { id: 'overdue', title: 'Overdue', tone: 'bg-red-100 text-red-800' },
  ];

  const stats = statsQuery.data || { pending: 0, overdue: 0, due_this_week: 0, completed: 0 };

  return (
    <section className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Compliance</h2>
            <p className="text-gray-600 mt-1">Track upcoming filings and deadlines.</p>
          </div>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add task
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border rounded-2xl p-4">
            <div className="text-xs text-gray-500">Pending</div>
            <div className="text-xl font-bold text-gray-900">{stats.pending}</div>
          </div>
          <div className="bg-white border rounded-2xl p-4">
            <div className="text-xs text-gray-500">Overdue</div>
            <div className="text-xl font-bold text-red-600">{stats.overdue}</div>
          </div>
          <div className="bg-white border rounded-2xl p-4">
            <div className="text-xs text-gray-500">Due this week</div>
            <div className="text-xl font-bold text-orange-600">{stats.due_this_week}</div>
          </div>
          <div className="bg-white border rounded-2xl p-4">
            <div className="text-xs text-gray-500">Completed</div>
            <div className="text-xl font-bold text-emerald-600">{stats.completed}</div>
          </div>
        </div>

        {tasksQuery.isLoading ? (
          <div className="grid lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border rounded-2xl p-4">
                <Skeleton className="h-5 w-2/3 mb-3" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-4">
            {columns.map((col) => (
              <div key={col.id} className="bg-white border rounded-2xl p-4 flex flex-col min-h-[480px]">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-gray-900">{col.title}</div>
                  <Badge variant="secondary" className={col.tone}>
                    {grouped[col.id].length}
                  </Badge>
                </div>
                <div className="space-y-3 overflow-y-auto pr-1">
                  {grouped[col.id].map((t) => {
                    const tt = taskTypeBadge(t.task_type);
                    const due = dueChip(t.daysUntilDue);
                    return (
                      <div key={t.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="font-semibold text-gray-900">{t.label}</div>
                          {t.daysUntilDue < 0 ? <AlertTriangle className="w-4 h-4 text-red-600" /> : null}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          <Badge variant="secondary" className={tt.cls}>
                            {tt.label}
                          </Badge>
                          <Badge variant="secondary" className={due.cls}>
                            {t.daysUntilDue < 0 ? 'Overdue' : due.label}
                          </Badge>
                        </div>

                        <div className="text-sm text-gray-600 mt-3">
                          Due: <b>{formatDue(t.due_date)}</b>
                        </div>
                        {t.external_ref ? (
                          <div className="text-xs text-gray-500 mt-2">{t.external_ref}</div>
                        ) : null}

                        <div className="flex items-center gap-2 mt-4">
                          {t.status !== 'completed' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              onClick={() => markComplete(t)}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Mark Complete
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() => openEdit(t)}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() => remove(t)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTask ? 'Edit task' : 'Add compliance task'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Task type</Label>
              <Select
                value={form.task_type}
                onValueChange={(v) => {
                  setForm((s) => ({ ...s, task_type: v, label: s.label || defaultLabelForType(v) }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Label</Label>
              <Input value={form.label} onChange={(e) => setForm((s) => ({ ...s, label: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Due date</Label>
              <DatePicker value={form.due_date} onChange={(v) => setForm((s) => ({ ...s, due_date: v }))} />
              <div className="text-xs text-gray-500">Auto-filled for GST/MCA if omitted; required for RERA/Contract.</div>
            </div>

            <div className="space-y-2">
              <Label>Reference number</Label>
              <Input
                value={form.external_ref}
                onChange={(e) => setForm((s) => ({ ...s, external_ref: e.target.value }))}
                placeholder="GSTIN / RERA No. / Contract Name"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
            </div>

            <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={submit}>
              {editTask ? 'Save changes' : 'Create task'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

