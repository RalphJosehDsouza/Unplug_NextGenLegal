import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './sections/Footer';
import { ChatBot } from './components/ChatBot';
import { Toaster } from '@/components/ui/sonner';

import { LandingPage } from './pages/LandingPage';
import { LawyersPage } from './pages/LawyersPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { CompliancePage } from './pages/CompliancePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ChatPage } from './pages/ChatPage';
import { CasesPage } from './pages/CasesPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = (userData: any) => {
    setIsLoggedIn(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    navigate('/');
  };

  const navigateToRegister = () => {
    navigate('/register');
  };

  const navigateToLogin = () => {
    navigate('/login');
  };

  return (
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
          <Route path="/documents" element={isLoggedIn ? <DocumentsPage /> : <Navigate to="/login" replace />} />
          <Route path="/compliance" element={isLoggedIn ? <CompliancePage user={user} /> : <Navigate to="/login" replace />} />
          
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={<RegisterPage onLogin={handleLogin} />} />
          <Route path="/chat" element={isLoggedIn ? <ChatPage /> : <Navigate to="/login" replace />} />
          <Route path="/cases" element={isLoggedIn ? <CasesPage user={user} /> : <Navigate to="/login" replace />} />
          
          <Route 
            path="/dashboard" 
            element={isLoggedIn ? <DashboardPage user={user} /> : <Navigate to="/login" replace />} 
          />
        </Routes>
      </main>

      <Footer />
      <ChatBot />
      <Toaster />
    </div>
  );
}

export default App;
