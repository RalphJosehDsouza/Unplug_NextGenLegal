import { Hero } from '../sections/Hero';
import { Features } from '../sections/Features';

interface LandingPageProps {
  onRegister: () => void;
}

export function LandingPage({ onRegister }: LandingPageProps) {
  return (
    <>
      <Hero onGetStarted={onRegister} />
      <Features />
    </>
  );
}
