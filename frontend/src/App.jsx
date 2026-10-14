import { lazy, Suspense, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Public & Landing (Instant Load)
import LandingPage from './pages/LandingPage';

// Lazy Loaded Feature & Dashboard Pages (Code Splitting)
const P3FraudDetection = lazy(() => import('./pages/P3FraudDetection'));
const P4RegistryPanel = lazy(() => import('./pages/P4RegistryPanel'));
const P4AcLandPanel = lazy(() => import('./pages/P4AcLandPanel'));
const P5CitizenVerify = lazy(() => import('./pages/P5CitizenVerify'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const QRVerifyPage = lazy(() => import('./pages/QRVerifyPage'));

// Lazy Loaded Auth & 4 Role Dashboards
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const VerifyOtpPage = lazy(() => import('./pages/VerifyOtpPage'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const RegisterOfficeDashboard = lazy(() => import('./pages/RegisterOfficeDashboard'));
const AcLandDashboard = lazy(() => import('./pages/AcLandDashboard'));
const MinistryAdminDashboard = lazy(() => import('./pages/MinistryAdminDashboard'));

// Branded Minimalist Loading Component
const PageLoader = () => (
  <div style={{
    minHeight: 'calc(100vh - 64px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    background: '#f8fafc',
  }}>
    <div style={{
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      border: '3.5px solid #dcfce7',
      borderTopColor: '#16a34a',
      animation: 'spin 0.8s linear infinite',
    }} />
    <div style={{ fontSize: '13px', fontWeight: '700', color: '#166534', letterSpacing: '0.02em' }}>
      e-ভূমি পৃষ্ঠা লোড হচ্ছে...
    </div>
  </div>
);

function App() {
  // Pre-warm serverless backend on initial mount
  useEffect(() => {
    axios.get('/').catch(() => {});
  }, []);

  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen animated-bg grid-bg">
          <Navbar />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Pages */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/verify" element={<P5CitizenVerify />} />
              <Route path="/payment/:record_id" element={<PaymentPage />} />
              <Route path="/qr-verify/:qr_code_id" element={<QRVerifyPage />} />

              {/* Protected Internal Modules */}
              <Route
                path="/p3-fraud"
                element={
                  <ProtectedRoute allowedRoles={['Register Office', 'Super Admin']}>
                    <P3FraudDetection />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/registry"
                element={
                  <ProtectedRoute allowedRoles={['Register Office', 'Super Admin']}>
                    <P4RegistryPanel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ac-land"
                element={
                  <ProtectedRoute allowedRoles={['AC Land Office', 'Super Admin']}>
                    <P4AcLandPanel />
                  </ProtectedRoute>
                }
              />

              {/* Auth Single Login & Register */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-otp" element={<VerifyOtpPage />} />

              {/* 4 Separate Dashboards Based on Role */}
              <Route
                path="/user/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['User', 'Super Admin']}>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/register-office/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['Register Office', 'Super Admin']}>
                    <RegisterOfficeDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ac-land/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['AC Land Office', 'Super Admin']}>
                    <AcLandDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['Super Admin']}>
                    <MinistryAdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
