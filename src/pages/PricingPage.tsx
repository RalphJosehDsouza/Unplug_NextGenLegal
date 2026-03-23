import { Pricing } from '../sections/Pricing';

interface PricingPageProps {
  onRegister: () => void;
}

export function PricingPage({ onRegister }: PricingPageProps) {
  return (
    <div className="pt-20">
      <Pricing onSelectPlan={onRegister} />
    </div>
  );
}
