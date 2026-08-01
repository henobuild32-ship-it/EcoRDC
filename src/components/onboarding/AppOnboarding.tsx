'use client';

import { useAppStore } from '@/lib/store';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { clientOnboardingSteps } from '@/components/onboarding/clientSteps';
import { vendorOnboardingSteps } from '@/components/onboarding/vendorSteps';

const ONBOARDING_FLAG = 'ecordc_onboarding_v1_seen';

export function AppOnboarding() {
  const { user, showOnboarding, setShowOnboarding } = useAppStore();

  const role = user?.role === 'VENDOR' ? 'VENDOR' : user?.role === 'CLIENT' ? 'CLIENT' : null;
  if (!role || !showOnboarding) return null;

  const steps = role === 'VENDOR' ? vendorOnboardingSteps : clientOnboardingSteps;
  const key = role === 'VENDOR' ? `${ONBOARDING_FLAG}_VENDOR` : `${ONBOARDING_FLAG}_CLIENT`;

  const handleDone = () => {
    try { localStorage.setItem(key, '1'); } catch {}
    setShowOnboarding(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Mark as seen whenever the dialog is dismissed (X, Passer or finish),
      // otherwise the trigger would immediately reopen it.
      try { localStorage.setItem(key, '1'); } catch {}
    }
    setShowOnboarding(open);
  };

  return (
    <OnboardingWizard
      open={showOnboarding}
      onOpenChange={handleOpenChange}
      onSkip={handleDone}
      onComplete={handleDone}
      role={role}
      steps={steps}
      title={role === 'VENDOR' ? 'Bienvenue, vendeur !' : 'Bienvenue sur EcoRDC'}
      subtitle={role === 'VENDOR' ? 'Découvrez chaque fonctionnalité de votre espace vendeur' : 'Découvrez chaque fonctionnalité de l\'application'}
    />
  );
}
