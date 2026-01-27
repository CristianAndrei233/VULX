import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CreateProject } from './pages/CreateProject';
import { ProjectDetails } from './pages/ProjectDetails';
import { Onboarding } from './pages/onboarding';
import { Billing } from './pages/Billing';

function App() {
  const isOnboardingComplete = localStorage.getItem('vulx-onboarding-complete') === 'true';

  return (
    <BrowserRouter>
      <Routes>
        {/* Onboarding route */}
        <Route
          path="/onboarding"
          element={isOnboardingComplete ? <Navigate to="/" replace /> : <Onboarding />}
        />

        {/* Main app routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="new" element={<CreateProject />} />
          <Route path="projects/:id" element={<ProjectDetails />} />
          <Route path="billing" element={<Billing />} />
        </Route>

        {/* Redirect to onboarding if not complete */}
        <Route
          path="*"
          element={isOnboardingComplete ? <Navigate to="/" replace /> : <Navigate to="/onboarding" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
