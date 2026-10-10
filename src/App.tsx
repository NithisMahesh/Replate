/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SurplusLinkProvider, useSurplusLink } from './context/SurplusLinkContext';
import { ToastProvider } from './components/shared/Toast';
import { TopBar } from './components/shared/TopBar';
import { ClusterOverviewBar } from './components/shared/ClusterOverviewBar';
import { LandingPage } from './pages/LandingPage';
import { ProviderLoginPage } from './pages/ProviderLoginPage';
import { NgoLoginPage } from './pages/NgoLoginPage';
import { ProviderShell } from './components/ProviderShell';
import { NgoShell } from './components/NgoShell';

// Strict Route Guard enforcing role-based separation
interface ProtectedRouteProps {
  allowedRole: 'provider' | 'ngo';
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRole, children }) => {
  const { session } = useSurplusLink();

  // If not authenticated, redirect to role's login page
  if (!session) {
    return <Navigate to={allowedRole === 'provider' ? '/login/provider' : '/login/ngo'} replace />;
  }

  // If authenticated but wrong role, prevent access and redirect to authorized interface
  if (session.role !== allowedRole) {
    return <Navigate to={session.role === 'provider' ? '/provider' : '/ngo'} replace />;
  }

  return <>{children}</>;
};

// Authenticated Provider Layout
const ProviderAppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <TopBar />
      <ClusterOverviewBar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ProviderShell />
      </main>
      <footer className="border-t border-slate-200 bg-white py-4 text-center">
        <p className="text-xs text-slate-500 max-w-7xl mx-auto px-4 leading-normal">
          Distance savings and travel durations are estimates calculated via OSRM road network routing in Madurai, Tamil Nadu.
        </p>
      </footer>
    </div>
  );
};

// Authenticated NGO Layout (desktop-first dashboard)
const NgoAppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <TopBar />
      <ClusterOverviewBar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <NgoShell />
      </main>
      <footer className="border-t border-slate-200 bg-white py-4 text-center">
        <p className="text-xs text-slate-500 max-w-7xl mx-auto px-4 leading-normal">
          Distance savings and travel durations are estimates calculated via OSRM road network routing in Madurai, Tamil Nadu.
        </p>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <SurplusLinkProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* 1. Landing Gateway Page */}
            <Route path="/" element={<LandingPage />} />

            {/* 2. Distinct Authentication Login Pages */}
            <Route path="/login/provider" element={<ProviderLoginPage />} />
            <Route path="/login/ngo" element={<NgoLoginPage />} />

            {/* 3. Protected Provider Application (mobile-first) */}
            <Route
              path="/provider/*"
              element={
                <ProtectedRoute allowedRole="provider">
                  <ProviderAppLayout />
                </ProtectedRoute>
              }
            />

            {/* 4. Protected NGO Application (desktop-first dashboard with sidebar) */}
            <Route
              path="/ngo/*"
              element={
                <ProtectedRoute allowedRole="ngo">
                  <NgoAppLayout />
                </ProtectedRoute>
              }
            />

            {/* 5. Catch-all: Redirect unknown routes to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </SurplusLinkProvider>
  );
}
