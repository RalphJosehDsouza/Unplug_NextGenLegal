import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Building, ShieldCheck, CreditCard, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';

export function KYC() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Queries
  const { data: statusResp } = useQuery({
    queryKey: ['lawyer-kyc-status'],
    queryFn: async () => {
      const res = await api.get('/api/kyc/status');
      return res.data?.data;
    },
    staleTime: 0,
  });

  const kycStatus = statusResp?.kyc_status;
  
  useEffect(() => {
    if (kycStatus) {
      if (kycStatus === 'verified') setCurrentStep(3);
      else if (kycStatus === 'submitted') setCurrentStep(2);
      else setCurrentStep(1);
    }
    setLoadingInitial(false);
  }, [kycStatus]);

  // Forms
  const { register: registerStep1, handleSubmit: handleSubmitStep1 } = useForm();
  const { register: registerStep2, handleSubmit: handleSubmitStep2, watch } = useForm();

  // Mutations
  const initiateMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/api/kyc/initiate', {
        pan: data.pan,
        street1: data.street1,
        city: data.city,
        state: data.state,
        postal_code: data.pincode,
        dob: data.dob
      });
    },
    onSuccess: () => {
      toast.success('KYC Profile Created! Proceeding to Bank details.');
      queryClient.invalidateQueries({ queryKey: ['lawyer-kyc-status'] });
      setCurrentStep(2);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Verification failed. Please try again.');
    }
  });

  const bankMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.account_number !== data.confirm_account) {
        throw new Error('Account numbers do not match');
      }
      await api.post('/api/kyc/bank-account', {
        name: data.account_name,
        ifsc: data.ifsc,
        account_number: data.account_number
      });
      // reload auth so payout states might update if requested
      const meResp = await api.get('/api/auth/me');
      if (meResp?.data?.data) setUser(meResp.data.data);
    },
    onSuccess: () => {
      toast.success('Bank Account Linked Successfully!');
      queryClient.invalidateQueries({ queryKey: ['lawyer-kyc-status'] });
      setCurrentStep(3);
    },
    onError: (err: any) => {
      // Catch manual throws
      const msg = err.response?.data?.message || err.message || 'Linking failed';
      toast.error(msg);
    }
  });

  if (loadingInitial) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <ShieldCheck className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h1 className="text-3xl font-extrabold text-gray-900">Payment Setup & KYC</h1>
        <p className="mt-2 text-gray-600 max-w-lg mx-auto">
          Complete your profile and link your bank account to start receiving consultation payouts directly via NEFT.
        </p>
      </div>

      {/* Stepper Logic */}
      <div className="flex items-center justify-center mb-10 overflow-hidden">
        <div className={`flex flex-col items-center ${currentStep >= 1 ? 'text-red-600' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 rounded-full flex justify-center items-center border-2 ${currentStep >= 1 ? 'border-red-600 bg-red-50' : 'border-gray-300'}`}>
            <Building className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold mt-2">Identity</span>
        </div>
        <div className={`w-16 h-0.5 ${currentStep >= 2 ? 'bg-red-600' : 'bg-gray-200'} mx-4 mt-[-20px]`} />
        
        <div className={`flex flex-col items-center ${currentStep >= 2 ? 'text-red-600' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 rounded-full flex justify-center items-center border-2 ${currentStep >= 2 ? 'border-red-600 bg-red-50' : 'border-gray-300'}`}>
            <CreditCard className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold mt-2">Bank</span>
        </div>
        <div className={`w-16 h-0.5 ${currentStep >= 3 ? 'bg-red-600' : 'bg-gray-200'} mx-4 mt-[-20px]`} />
        
        <div className={`flex flex-col items-center ${currentStep >= 3 ? 'text-red-600' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 rounded-full flex justify-center items-center border-2 ${currentStep >= 3 ? 'border-red-600 bg-red-50' : 'border-gray-300'}`}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold mt-2">Verified</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 p-8 sm:p-10">
        {currentStep === 1 && (
          <form onSubmit={handleSubmitStep1((d) => initiateMutation.mutate(d))} className="space-y-6 animate-in slide-in-from-bottom-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Personal Details</h3>
              <p className="text-sm text-gray-500">Must match your authoritative legal records tightly to avoid escrow delays.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                <Input {...registerStep1('pan', { required: true })} placeholder="ABCDE1234F" className="uppercase" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <Input type="date" {...registerStep1('dob', { required: true })} />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-md font-bold text-gray-800 mb-4">Location Validation</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <Input {...registerStep1('street1', { required: true })} placeholder="123 Legal Chambers" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <Input {...registerStep1('city', { required: true })} placeholder="Mumbai" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <Input {...registerStep1('state', { required: true })} placeholder="Maharashtra" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <Input {...registerStep1('pincode', { required: true, maxLength: 6 })} placeholder="400001" type="number" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-5">
              <Button type="submit" disabled={initiateMutation.isPending} className="bg-red-600 hover:bg-red-700">
                {initiateMutation.isPending ? 'Verifying...' : 'Next Step'}
                {!initiateMutation.isPending && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </form>
        )}

        {currentStep === 2 && (
          <form onSubmit={handleSubmitStep2((d) => bankMutation.mutate(d))} className="space-y-6 animate-in slide-in-from-right-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Secure Bank Linkage</h3>
              <p className="text-sm text-gray-500 focus:outline-none">Provide NEFT compatible accounts strictly supporting direct INR payload routing.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                <Input {...registerStep2('account_name', { required: true })} placeholder="As per bank records" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                <Input {...registerStep2('ifsc', { required: true, minLength: 11, maxLength: 11 })} placeholder="HDFC0001234" className="uppercase" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <Input type="password" {...registerStep2('account_number', { required: true })} placeholder="••••••••••••" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Account Number</label>
                <Input type="text" {...registerStep2('confirm_account', { required: true })} placeholder="..." />
                {watch('account_number') !== watch('confirm_account') && watch('confirm_account') && (
                   <span className="text-xs text-red-500 mt-1 block">Account numbers do not match</span>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-5 border-t border-gray-100">
              <Button variant="ghost" onClick={() => setCurrentStep(1)} disabled={bankMutation.isPending}>Back</Button>
              <Button type="submit" disabled={bankMutation.isPending} className="bg-red-600 hover:bg-red-700">
                {bankMutation.isPending ? 'Linking...' : 'Complete Linking'}
              </Button>
            </div>
          </form>
        )}

        {currentStep === 3 && (
          <div className="text-center py-10 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Complete!</h2>
            <p className="text-gray-500 max-w-sm mx-auto mb-8">
              Your bank account has been successfully verified. You can now receive consultation payouts cleanly.
            </p>
            <Button onClick={() => navigate('/lawyers/earnings')} className="bg-red-600 hover:bg-red-700">
              View Earnings Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
