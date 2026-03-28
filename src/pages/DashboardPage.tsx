import { FileText, Users, Shield, MessageCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface DashboardPageProps {
  user: any;
}

export function DashboardPage({ user }: DashboardPageProps) {
  const isLawyer = user?.role === 'lawyer';
  const [hasSubscription, setHasSubscription] = useState(Boolean(user?.plan && user.plan !== 'freemium'));

  if (isLawyer && !hasSubscription) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 flex justify-center items-center">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Lawyer Portal Access</h2>
          <p className="text-gray-600 mb-6">Subscribe to unlock case management, automated reminders, and client secure document sharing.</p>
          <div className="text-4xl font-bold text-gray-900 mb-6">₹60<span className="text-lg text-gray-500 font-normal">/month</span></div>
          <Button onClick={() => {
              setHasSubscription(true);
              toast.success("Subscription activated successfully!");
          }} className="w-full bg-indigo-600 text-white hover:bg-indigo-700 py-6 text-lg font-semibold rounded-xl">
            Subscribe Now
          </Button>
        </div>
      </div>
    );
  }

  const quickLinks = [
    {
      title: 'Document Studio',
      description: 'Generate legal documents instantly',
      icon: FileText,
      url: '/documents',
      color: 'bg-indigo-500',
    },
    {
      title: 'Find Lawyers',
      description: 'Connect with verified legal experts',
      icon: Users,
      url: '/lawyers',
      color: 'bg-blue-500',
    },
    {
      title: 'Compliance',
      description: 'Track deadlines and filings',
      icon: Shield,
      url: '/compliance',
      color: 'bg-purple-500',
    },
    {
      title: 'AI Assistant',
      description: 'Get instant legal answers',
      icon: MessageCircle,
      url: '/chat',
      color: 'bg-emerald-500', 
    },
  ];

  if (isLawyer) {
    quickLinks.unshift({
      title: 'Cases & Files',
      description: 'Manage case documents and reminders',
      icon: FileText,
      url: '/cases',
      color: 'bg-amber-500',
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.full_name?.split(' ')[0] || 'User'}!</h1>
        <p className="text-gray-600 mb-8">What would you like to do today?</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {quickLinks.map((link) => (
            <Link 
              key={link.title} 
              to={link.url}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group flex flex-col items-start"
            >
              <div className={`w-12 h-12 ${link.color} rounded-xl flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform`}>
                <link.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{link.title}</h3>
              <p className="text-sm text-gray-500 flex-1">{link.description}</p>
              <div className="mt-4 flex items-center text-sm font-medium text-indigo-600 group-hover:gap-2 transition-all">
                Get started <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="py-8 text-center text-gray-500 border-2 border-dashed border-gray-100 rounded-xl">
            You don't have any recent activity yet.
          </div>
        </div>
      </div>
    </div>
  );
}
