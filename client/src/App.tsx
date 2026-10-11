import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { SignupPage } from './pages/public/SignupPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';

// Authenticated App Pages
import { DashboardPage } from './pages/app/DashboardPage';
import { CompliancePage } from './pages/app/CompliancePage';
import { TasksPage } from './pages/app/TasksPage';
import { EvidencePage } from './pages/app/EvidencePage';
import { HRCompliancePage } from './pages/app/HRCompliancePage';
import { VendorsPage } from './pages/app/VendorsPage';
import { RisksPage } from './pages/app/RisksPage';
import { FindingsPage } from './pages/app/FindingsPage';
import { PoliciesPage } from './pages/app/PoliciesPage';
import { NotificationsPage } from './pages/app/NotificationsPage';
import { ReportsPage } from './pages/app/ReportsPage';
import { TeamPage } from './pages/app/TeamPage';
import { SettingsPage } from './pages/app/SettingsPage';
import { AdminPage } from './pages/app/AdminPage';
import { ProfilePage } from './pages/app/ProfilePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#E5D3AF] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#790D16] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-stone-700">Loading TriPro Workspace...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Authenticated Workspace Routes */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/app/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="compliance" element={<CompliancePage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="evidence" element={<EvidencePage />} />
                <Route path="hr" element={<HRCompliancePage />} />
                <Route path="vendors" element={<VendorsPage />} />
                <Route path="risks" element={<RisksPage />} />
                <Route path="findings" element={<FindingsPage />} />
                <Route path="policies" element={<PoliciesPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="team" element={<TeamPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
