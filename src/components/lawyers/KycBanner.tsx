import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'lucide-react';
import api from '@/api/axios';
import { useAuthStore } from '@/store/authStore';

export function KycBanner() {
  const user = useAuthStore((s) => s.user);

  const { data: statusResp } = useQuery({
    queryKey: ['lawyer-kyc-status'],
    enabled: user?.role === 'lawyer',
    queryFn: async () => {
      const resp = await api.get('/api/kyc/status');
      return resp.data?.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (user?.role !== 'lawyer') return null;

  const kycStatus = statusResp?.kyc_status;
  
  // Do not render if verified
  if (!kycStatus || kycStatus === 'verified') return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 w-full z-40 relative">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-900 font-medium">
            Your account is not set up for payouts. Clients cannot book you until you complete KYC.
          </p>
        </div>
        <Link
          to="/lawyers/kyc"
          className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-4 py-2 rounded-lg transition-colors"
        >
          Complete KYC
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
