import { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Plus,
  Bell,
  FileText,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const lawyerTaskTypes = [
  { value: 'gst_return_monthly', label: 'GST Return (Monthly)', color: 'bg-blue-500' },
  { value: 'gst_return_quarterly', label: 'GST Return (Quarterly)', color: 'bg-blue-500' },
  { value: 'rera_registration', label: 'RERA Registration', color: 'bg-purple-500' },
  { value: 'contract_expiry', label: 'Contract Expiry', color: 'bg-amber-500' },
  { value: 'mca_annual_return', label: 'MCA Annual Return', color: 'bg-indigo-500' },
  { value: 'professional_tax', label: 'Professional Tax', color: 'bg-rose-500' },
  { value: 'labour_law_compliance', label: 'Labour Law Compliance', color: 'bg-indigo-500' },
  { value: 'custom', label: 'Custom Task', color: 'bg-gray-500' },
];

const citizenTaskTypes = [
  { value: 'income_tax', label: 'Income Tax Return', color: 'bg-blue-500' },
  { value: 'property_tax', label: 'Property Tax', color: 'bg-green-500' },
  { value: 'vehicle_insurance', label: 'Vehicle Insurance', color: 'bg-rose-500' },
  { value: 'passport_renewal', label: 'Passport Renewal', color: 'bg-indigo-500' },
  { value: 'custom', label: 'Custom Task', color: 'bg-gray-500' },
];

const lawyerInitialTasks = [
  { 
    id: 1, 
    type: 'gst_return_monthly', 
    label: 'GSTR-3B Filing', 
    due_date: '2024-03-20', 
    status: 'pending',
    external_ref: '27AABCU9603R1ZX',
    days_left: 3,
  },
  { 
    id: 2, 
    type: 'contract_expiry', 
    label: 'Office Lease Renewal', 
    due_date: '2024-04-15', 
    status: 'pending',
    external_ref: 'LEASE-2023-001',
    days_left: 29,
  },
  { 
    id: 3, 
    type: 'mca_annual_return', 
    label: 'Form MGT-7 Filing', 
    due_date: '2024-05-30', 
    status: 'pending',
    external_ref: 'CIN: U72200MH2021PTC123456',
    days_left: 74,
  },
  { 
    id: 4, 
    type: 'professional_tax', 
    label: 'PT Payment - March', 
    due_date: '2024-03-31', 
    status: 'completed',
    external_ref: 'PT-REG-789456',
    days_left: null,
  },
];

const citizenInitialTasks = [
  { 
    id: 1, 
    type: 'income_tax', 
    label: 'ITR-1 Filing', 
    due_date: '2024-07-31', 
    status: 'pending',
    external_ref: 'PAN: ABCDE1234F',
    days_left: 60,
  },
  { 
    id: 2, 
    type: 'property_tax', 
    label: 'Municipal Property Tax', 
    due_date: '2024-04-30', 
    status: 'pending',
    external_ref: 'PID: 987654321',
    days_left: 35,
  },
];

interface ComplianceDashboardProps {
  user?: any;
}

export function ComplianceDashboard({ user }: ComplianceDashboardProps) {
  const isCitizen = user?.role !== 'lawyer';
  const taskTypes = isCitizen ? citizenTaskTypes : lawyerTaskTypes;
  const defaultTaskType = isCitizen ? 'income_tax' : 'gst_return_monthly';
  
  const [tasks, setTasks] = useState(isCitizen ? citizenInitialTasks : lawyerInitialTasks);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    type: defaultTaskType,
    label: '',
    due_date: '',
    external_ref: '',
    notes: '',
  });
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const handleAddTask = () => {
    const daysLeft = Math.ceil((new Date(newTask.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    const task = {
      id: tasks.length + 1,
      ...newTask,
      status: 'pending',
      days_left: daysLeft,
    };
    
    setTasks([...tasks, task]);
    setIsAddTaskOpen(false);
    setNewTask({
      type: defaultTaskType,
      label: '',
      due_date: '',
      external_ref: '',
      notes: '',
    });
    toast.success('Compliance task added successfully!');
  };

  const handleCompleteTask = (taskId: number) => {
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, status: 'completed', days_left: null } : t
    ));
    toast.success('Task marked as completed!');
  };

  const getUrgencyColor = (daysLeft: number | null, status: string) => {
    if (status === 'completed') return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    if (daysLeft === null) return 'bg-gray-100 text-gray-700';
    if (daysLeft < 7) return 'bg-red-100 text-red-700 border-red-200';
    if (daysLeft < 30) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-indigo-100 text-indigo-700 border-indigo-200';
  };

  const getUrgencyIcon = (daysLeft: number | null, status: string) => {
    if (status === 'completed') return <CheckCircle2 className="w-5 h-5 text-indigo-600" />;
    if (daysLeft === null) return <Clock className="w-5 h-5 text-gray-400" />;
    if (daysLeft < 7) return <AlertTriangle className="w-5 h-5 text-red-500" />;
    if (daysLeft < 30) return <AlertCircle className="w-5 h-5 text-amber-500" />;
    return <Clock className="w-5 h-5 text-indigo-500" />;
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const urgentTasks = tasks.filter(t => t.status === 'pending' && t.days_left !== null && t.days_left < 7);

  return (
    <section 
      id="compliance" 
      ref={sectionRef}
      className="py-20 lg:py-32 bg-gray-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full mb-4">
            Compliance Monitoring
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Never Miss a <span className="text-indigo-600">Deadline</span>
          </h2>
          <p className="text-lg text-gray-600">
            Track all your legal and regulatory compliance deadlines in one place. 
            Get automated reminders via email and SMS.
          </p>
        </div>

        {/* Stats Cards */}
        <div className={`grid sm:grid-cols-3 gap-6 mb-12 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{pendingTasks.length}</span>
            </div>
            <p className="text-gray-600">Pending Tasks</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{urgentTasks.length}</span>
            </div>
            <p className="text-gray-600">Urgent (&lt; 7 days)</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{completedTasks.length}</span>
            </div>
            <p className="text-gray-600">Completed This Month</p>
          </div>
        </div>

        {/* Main Dashboard */}
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Compliance Tasks</h3>
                <p className="text-sm text-gray-500">Track and manage your legal deadlines</p>
              </div>
            </div>
            <Button 
              onClick={() => setIsAddTaskOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>

          {/* Task List */}
          <div className="divide-y divide-gray-100">
            {tasks.map((task) => {
              const taskType = taskTypes.find(t => t.value === task.type);
              return (
                <div 
                  key={task.id}
                  className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${taskType?.color || 'bg-gray-500'} bg-opacity-10`}>
                      {getUrgencyIcon(task.days_left, task.status)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">{task.label}</h4>
                        <Badge className={getUrgencyColor(task.days_left, task.status)}>
                          {task.status === 'completed' ? 'Completed' : 
                           task.days_left === null ? 'Overdue' :
                           task.days_left < 7 ? `${task.days_left} days left` :
                           task.days_left < 30 ? `${task.days_left} days left` : 
                           `${task.days_left} days left`}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due: {task.due_date}
                        </span>
                        {task.external_ref && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {task.external_ref}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {task.status !== 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCompleteTask(task.id)}
                      className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Mark Done
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Features */}
        <div className={`grid sm:grid-cols-3 gap-6 mt-12 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {[
            { 
              icon: Bell, 
              title: 'Smart Reminders', 
              description: 'Get notified 30, 7, and 1 day before deadlines' 
            },
            { 
              icon: TrendingUp, 
              title: 'Compliance Score', 
              description: 'Track your overall compliance health over time' 
            },
            { 
              icon: Shield, 
              title: 'Penalty Protection', 
              description: 'Avoid late fees and penalties with timely alerts' 
            },
          ].map((feature, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Add Task Dialog */}
        <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Compliance Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Task Type</Label>
                <select
                  value={newTask.type}
                  onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {taskTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Task Label</Label>
                <Input
                  value={newTask.label}
                  onChange={(e) => setNewTask({ ...newTask, label: e.target.value })}
                  placeholder="e.g., GSTR-3B Filing"
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Reference Number (Optional)</Label>
                <Input
                  value={newTask.external_ref}
                  onChange={(e) => setNewTask({ ...newTask, external_ref: e.target.value })}
                  placeholder="e.g., GSTIN, CIN, etc."
                />
              </div>
              <Button 
                onClick={handleAddTask}
                disabled={!newTask.label || !newTask.due_date}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
