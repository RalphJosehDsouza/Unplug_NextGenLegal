import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './sections/Footer';
import { Toaster } from '@/components/ui/sonner';
import { Layout } from './Layout';

import { LandingPage } from './pages/LandingPage';
import { LawyersPage } from './pages/LawyersPage';
import { LawyerProfilePage } from './pages/Lawyers/LawyerProfile';
import { DocumentsPage } from './pages/DocumentsPage';
import { ComplianceDashboard } from './pages/Compliance';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ChatPage } from './pages/ChatPage';
import { CasesPage } from './pages/CasesPage';
import api from '@/api/axios';
import { useAuthStore } from '@/store/authStore';
import { GenerateDocument } from './pages/DocStudio/GenerateDocument';
import { MyDocuments } from './pages/MyDocuments';
import { MyBookings } from './pages/MyBookings';
import { CourtHousePage } from './pages/CourtHousePage';
import { KycBanner } from './components/lawyers/KycBanner';
import { Earnings } from './pages/LawyerDashboard/Earnings';
import { KYC } from './pages/LawyerDashboard/KYC';
import { LegalNoticePage } from './pages/LegalNotice';
import { LawMapperPage } from './pages/LawMapper';
import { ECourtsPage } from './pages/eCourts';
import { RTIPage } from './pages/RTI';
import { DocReviewPage } from './pages/DocReview';
import { PricingPage } from './pages/PricingPage';

// New feature pages
import { BusinessRegistration } from './pages/BusinessRegistration';
import { TrademarkPage } from './pages/Trademark';
import { ContractAuditPage } from './pages/ContractAudit';
import { BusinessNameGenerator } from './pages/BusinessNameGenerator';
import { LogoMaker } from './pages/LogoMaker';
import { RegisteredAgentPage } from './pages/RegisteredAgent';
import { EnterprisePage } from './pages/Enterprise';

function App() {
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);

  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      const url = new URL(window.location.href);
      const tokenFromUrl = url.searchParams.get('accessToken');

      if (tokenFromUrl) {
        setAccessToken(tokenFromUrl);

        // Remove it from the URL after we store it once.
        url.searchParams.delete('accessToken');
        const nextUrl = `${url.pathname}${url.search ? url.search : ''}`;
        window.history.replaceState({}, '', nextUrl);
      }

      // If we have a token, load the user payload once.
      const shouldFetchMe = Boolean(tokenFromUrl || (accessToken && !user));
      if (shouldFetchMe) {
        try {
          const resp = await api.get('/api/auth/me');
          setUser(resp.data.data);
        } catch {
          setAccessToken(null);
          setUser(null);
        }
      }
    };

    hydrate()
      .catch(() => undefined)
      .finally(() => setAuthReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    api.post('/api/auth/logout').catch(() => undefined).finally(() => {
      logout();
      navigate('/');
    });
  };

  const navigateToRegister = () => {
    navigate('/register');
  };

  const navigateToLogin = () => {
    navigate('/login');
  };

  const isLoggedIn = Boolean(accessToken && user);

  if (!authReady) return null;

  return (
    <Layout>
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar 
          isLoggedIn={isLoggedIn} 
          user={user} 
          onLogin={navigateToLogin} 
          onLogout={handleLogout}
        />
        <KycBanner />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage onRegister={navigateToRegister} />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/enterprise" element={<EnterprisePage />} />
            <Route path="/lawyers" element={isLoggedIn ? (user?.role === 'lawyer' ? <Navigate to="/dashboard" replace /> : <LawyersPage />) : <Navigate to="/login" replace />} />
            <Route path="/lawyers/:id" element={isLoggedIn ? <LawyerProfilePage /> : <Navigate to="/login" replace />} />
            <Route path="/documents" element={isLoggedIn ? <DocumentsPage /> : <Navigate to="/login" replace />} />
            <Route
              path="/doc-studio/generate/:template_name"
              element={isLoggedIn ? <GenerateDocument /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/my-documents"
              element={isLoggedIn ? <MyDocuments /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/my-bookings"
              element={isLoggedIn ? <MyBookings /> : <Navigate to="/login" replace />}
            />
            <Route path="/compliance" element={isLoggedIn ? <ComplianceDashboard /> : <Navigate to="/login" replace />} />
            
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/chat" element={isLoggedIn ? <ChatPage /> : <Navigate to="/login" replace />} />
            <Route path="/cases" element={isLoggedIn ? <CasesPage user={user} /> : <Navigate to="/login" replace />} />
            <Route
              path="/courthouse"
              element={
                isLoggedIn ? (
                  user?.role === 'lawyer' ? <CourtHousePage user={user} /> : <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route path="/ecourts" element={isLoggedIn ? <ECourtsPage /> : <Navigate to="/login" replace />} />
            <Route path="/law-mapper" element={isLoggedIn ? <LawMapperPage /> : <Navigate to="/login" replace />} />
            <Route path="/rti" element={isLoggedIn ? <RTIPage /> : <Navigate to="/login" replace />} />
            <Route
              path="/doc-review"
              element={isLoggedIn ? <DocReviewPage /> : <Navigate to="/login" replace />}
            />
            
            <Route 
              path="/dashboard" 
              element={isLoggedIn ? <DashboardPage user={user} /> : <Navigate to="/login" replace />} 
            />
            <Route
              path="/legal-notice"
              element={isLoggedIn ? <LegalNoticePage /> : <Navigate to="/login" replace />}
            />
            <Route 
              path="/lawyers/earnings" 
              element={isLoggedIn && user?.role === 'lawyer' ? <Earnings /> : <Navigate to="/dashboard" replace />} 
            />
            <Route 
              path="/lawyers/kyc" 
              element={isLoggedIn && user?.role === 'lawyer' ? <KYC /> : <Navigate to="/dashboard" replace />} 
            />

            {/* New feature routes */}
            <Route path="/business-registration" element={isLoggedIn ? <BusinessRegistration /> : <Navigate to="/login" replace />} />
            <Route path="/trademark" element={isLoggedIn ? <TrademarkPage /> : <Navigate to="/login" replace />} />
            <Route path="/contract-audit" element={isLoggedIn ? <ContractAuditPage /> : <Navigate to="/login" replace />} />
            <Route path="/business-name-generator" element={isLoggedIn ? <BusinessNameGenerator /> : <Navigate to="/login" replace />} />
            <Route path="/logo-maker" element={isLoggedIn ? <LogoMaker /> : <Navigate to="/login" replace />} />
            <Route path="/registered-agent" element={isLoggedIn ? <RegisteredAgentPage /> : <Navigate to="/login" replace />} />
          </Routes>
        </main>

        <Footer />
        <Toaster />
      </div>
    </Layout>
  );
}

export default App;
