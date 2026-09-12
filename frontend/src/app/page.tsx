import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { CtaSection } from '@/components/Landing/CtaSection';
import { FaqSection } from '@/components/Landing/FaqSection';
import { FeaturesSection } from '@/components/Landing/FeaturesSection';
import { HeroSection } from '@/components/Landing/HeroSection';
import { InsightsSection } from '@/components/Landing/InsightsSection';
import { RolesSection } from '@/components/Landing/RolesSection';
import { WorkflowSection } from '@/components/Landing/WorkflowSection';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <WorkflowSection />
      <InsightsSection />
      <RolesSection />
      <FaqSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
