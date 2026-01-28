import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { EnvironmentProvider } from './context/EnvironmentContext';
import { RequireAuth } from './components/RequireAuth';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CreateProject } from './pages/CreateProject';
import { ProjectDetails } from './pages/ProjectDetails';
import { ProjectSettings } from './pages/ProjectSettings';
import { Billing } from './pages/Billing';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/AdminDashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ScanConfig } from './pages/ScanConfig';
import { ScanResults } from './pages/ScanResults';
import { CLITerminal } from './pages/CLITerminal';
import { Integrations } from './pages/Integrations';
import { Remediation } from './pages/Remediation';
import { Trends } from './pages/Trends';
import { CustomRules } from './pages/CustomRules';

function App() {
  return (
    <EnvironmentProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route path="/" element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }>
              <Route index element={<Dashboard />} />
              <Route path="new" element={<CreateProject />} />
              <Route path="projects/:id" element={<ProjectDetails />} />
              <Route path="projects/:id/settings" element={<ProjectSettings />} />
              <Route path="billing" element={<Billing />} />
              <Route path="profile" element={<Profile />} />
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="integrations" element={<Integrations />} />
              <Route path="remediation" element={<Remediation />} />
              <Route path="trends" element={<Trends />} />
              <Route path="rules" element={<CustomRules />} />

              {/* Scan Routes */}
              <Route path="scan/new" element={<ScanConfig />} />
              <Route path="scan/quick" element={<ScanConfig />} />
              <Route path="scan/:projectId/config" element={<ScanConfig />} />
              <Route path="scans/:scanId" element={<ScanResults />} />
              <Route path="scans" element={<ScanResults />} />
              <Route path="cli" element={<CLITerminal />} />
              <Route path="reports" element={<ScanResults />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </EnvironmentProvider>
  );
}

export default App;
