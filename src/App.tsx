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
    logout();
    navigate('/');
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
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage onRegister={navigateToRegister} />} />
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
              path="/dashboard" 
              element={isLoggedIn ? <DashboardPage user={user} /> : <Navigate to="/login" replace />} 
            />
          </Routes>
        </main>

        <Footer />
        <Toaster />
      </div>
    </Layout>
  );
}

export default App;
