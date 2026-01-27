import { useOnboarding, OnboardingProvider } from '../../context/OnboardingContext';
import { Welcome } from './Welcome';
import { Profile } from './Profile';
import { Organization } from './Organization';
import { SelectPlan } from './SelectPlan';
import { FirstProject } from './FirstProject';
import { Complete } from './Complete';

function OnboardingSteps() {
  const { currentStep } = useOnboarding();

  switch (currentStep) {
    case 'welcome':
      return <Welcome />;
    case 'profile':
      return <Profile />;
    case 'organization':
      return <Organization />;
    case 'plan':
      return <SelectPlan />;
    case 'first-project':
      return <FirstProject />;
    case 'complete':
      return <Complete />;
    default:
      return <Welcome />;
  }
}

export function Onboarding() {
  return (
    <OnboardingProvider>
      <OnboardingSteps />
    </OnboardingProvider>
  );
}

export { Welcome, Profile, Organization, SelectPlan, FirstProject, Complete };
