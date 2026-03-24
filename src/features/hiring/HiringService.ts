// Mock backend service for hiring process to handle commission calculation securely.
export interface HiringRequest {
  lawyerId: number;
  lawyerName: string;
  ratePerHour: number;
  hours: number;
}

export interface HiringResponse {
  success: boolean;
  transactionId: string;
  totalAmount: number;
  commission: number;
  lawyerPayout: number;
  message: string;
}

export const hireLawyer = async (request: HiringRequest): Promise<HiringResponse> => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 800));

  const COMMISSION_RATE = 0.15; // 15% platform commission
  const baseAmount = request.ratePerHour * request.hours;
  const commission = baseAmount * COMMISSION_RATE;
  const lawyerPayout = baseAmount - commission;

  return {
    success: true,
    transactionId: `txn_${Math.random().toString(36).substring(2, 9)}`,
    totalAmount: baseAmount,
    commission: commission,
    lawyerPayout: lawyerPayout,
    message: 'Payment processed and lawyer hired successfully.',
  };
};
