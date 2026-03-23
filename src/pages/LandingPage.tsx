import { Hero } from '../sections/Hero';
import { Features } from '../sections/Features';
import { Pricing } from '../sections/Pricing';

interface LandingPageProps {
  onRegister: () => void;
}

export function LandingPage({ onRegister }: LandingPageProps) {
  return (
    <>
      <Hero onGetStarted={onRegister} />
      <Features />
      {/* We can show a simplified pricing here or the full one. For now, full. */}
      <Pricing onSelectPlan={onRegister} />
    </>
  );
}
