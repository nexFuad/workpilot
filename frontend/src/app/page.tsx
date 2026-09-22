'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { CtaSection } from '@/components/Landing/CtaSection';
import { FaqSection } from '@/components/Landing/FaqSection';
import { FeaturesSection } from '@/components/Landing/FeaturesSection';
import { HeroSection } from '@/components/Landing/HeroSection';
import { InsightsSection } from '@/components/Landing/InsightsSection';
import { RolesSection } from '@/components/Landing/RolesSection';
import { WorkflowSection } from '@/components/Landing/WorkflowSection';
import { useAuth } from '@/hooks/use-auth';
import { roleDashboardPath } from '@/lib/roles';
import { AuthLoadingScreen } from '@/components/shared/AuthLoadingScreen';
import { AuthSessionErrorScreen } from '@/components/shared/AuthSessionErrorScreen';

export default function Home() {
  const router = useRouter();
  const { user, isLoading, isFetching, sessionError, retrySession } = useAuth();
  useEffect(() => {
    if (user) router.replace(roleDashboardPath[user.role]);
  }, [router, user]);

  if (sessionError && !user) {
    return <AuthSessionErrorScreen isRetrying={isFetching} onRetry={() => void retrySession()} />;
  }

  if (isLoading || user) {
    return <AuthLoadingScreen />;
  }

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
