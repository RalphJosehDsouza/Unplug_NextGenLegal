import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  ArrowUpRight, 
  HelpCircle, 
  Wallet,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const INITIAL_PAGE = 1;

function formatINR(paise: number) {
  return (paise / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
}

function maskName(name?: string) {
  if (!name) return '***';
  const len = name.length;
  if (len <= 3) return `***${name}`;
  return `***${name.slice(-3)}`;
}

export function Earnings() {
  const user = useAuthStore((s) => s.user);
  const reloadAuth = useAuthStore((s) => s.setUser);
  const lawyerProfile = user?.lawyer || { payout_balance_paise: 0, total_earned_paise: 0 };

  if (user?.role !== 'lawyer') return null;
  
  const [page, setPage] = useState(INITIAL_PAGE);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const queryClient = useQueryClient();

  // Queries
  const { data: stats } = useQuery({
    queryKey: ['payout-stats'],
    queryFn: async () => {
      const res = await api.get('/api/payouts/stats');
      return res.data?.data;
    },
    staleTime: 60 * 1000,
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['earnings', page],
    queryFn: async () => {
      const res = await api.get(`/api/payouts/earnings?page=${page}&limit=10`);
      return res.data?.data;
    },
    staleTime: 60 * 1000,
  });

  // Withdraw Mutation
  const withdrawMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/payouts/withdraw');
      // trigger auth reload so payout_balance goes to 0
      const meResp = await api.get('/api/auth/me');
      if (meResp?.data?.data) {
        reloadAuth(meResp.data.data);
      }
    },
    onSuccess: () => {
      setWithdrawOpen(false);
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
      queryClient.invalidateQueries({ queryKey: ['payout-stats'] });
      toast.success(`Withdrawal successful. Funds sent to your bank. NEFT transfer takes 1–2 business days.`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Withdrawal failed. Please try again.');
    }
  });

  const balancePaise = lawyerProfile?.payout_balance_paise || 0;
  const canWithdraw = balancePaise >= 10000;

  const bookings = historyData?.bookings || [];
  const totalPages = historyData?.totalPages || 1;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Earnings Dashboard</h1>
        <p className="mt-2 text-sm text-gray-500">
          Track your consultation payouts, manage escrows, and initiate withdrawals.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Available Balance */}
        <Card className="border-red-100 shadow-sm relative overflow-hidden bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-red-900 flex items-center justify-between">
              Available Balance
              <Wallet className="h-4 w-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {formatINR(balancePaise)}
            </div>
            <div className="mt-4">
              <Button 
                onClick={() => setWithdrawOpen(true)}
                disabled={!canWithdraw || withdrawMutation.isPending}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                Withdraw
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* In Escrow */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center justify-between">
              In Escrow
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-amber-500 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Released automatically after consultation confirmation.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">
              {formatINR(stats?.in_escrow_paise || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Pending clearance</p>
          </CardContent>
        </Card>

        {/* Total Earned */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center justify-between">
              Total Earned
              <ArrowUpRight className="h-4 w-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {formatINR(lawyerProfile?.total_earned_paise || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Lifetime earnings</p>
          </CardContent>
        </Card>

        {/* This Month */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center justify-between">
              This Month
              <Calendar className="h-4 w-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {formatINR(stats?.this_month_released_paise || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Released in current month</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Earnings History</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Consultation Fee</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Platform Fee</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Your Earnings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {historyLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading records...</td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No earnings history found</td>
                </tr>
              ) : (
                bookings.map((bk: any) => {
                  let badgeColor = 'bg-gray-100 text-gray-800';
                  let badgeText = 'Unknown';

                  if (bk.payout_status === 'in_escrow') {
                    badgeColor = 'bg-amber-100 text-amber-800';
                    badgeText = 'In escrow';
                  } else if (bk.payout_status === 'released') {
                    badgeColor = 'bg-green-100 text-green-800';
                    badgeText = 'Paid out';
                  } else if (bk.payout_status === 'disputed') {
                    badgeColor = 'bg-red-100 text-red-800';
                    badgeText = 'Under review';
                  } else if (bk.payout_status === 'refunded') {
                    badgeColor = 'bg-gray-100 text-gray-600';
                    badgeText = 'Refunded';
                  }

                  return (
                    <tr key={bk.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(bk.slot_time), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {`Client ${maskName(bk.client_full_name)}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{bk.duration_mins} mins</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatINR(bk.amount_paise)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500 text-right">{`-${formatINR(bk.platform_commission_paise)}`}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600 text-right">
                        {formatINR(bk.lawyer_payout_paise)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className={'border-0 ' + badgeColor}>{badgeText}</Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bounds */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Page <span className="font-medium text-gray-900">{page}</span> of <span className="font-medium text-gray-900">{totalPages}</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{`Withdraw ${formatINR(balancePaise)}?`}</DialogTitle>
            <DialogDescription>
              You are about to withdraw your available balance of {formatINR(balancePaise)} to your verified bank account.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 bg-red-50 p-3 rounded-lg border border-red-100">
              Note: NEFT transfers typically take 1–2 business days to reflect in your account.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>Cancel</Button>
            <Button 
              className="bg-red-600 hover:bg-red-700" 
              onClick={() => withdrawMutation.mutate()}
              disabled={withdrawMutation.isPending}
            >
              {withdrawMutation.isPending ? 'Processing...' : `Confirm Withdrawal`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
