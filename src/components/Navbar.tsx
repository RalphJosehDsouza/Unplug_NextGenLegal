import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Scale, 
  Menu, 
  X, 
  User, 
  LogOut, 
  FileText, 
  Users,
  Shield,
  Home
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavbarProps {
  isLoggedIn: boolean;
  user: any;
  onLogin: () => void;
  onLogout: () => void;
}

export function Navbar({ isLoggedIn, user, onLogin, onLogout }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { id: '/', label: 'Home', icon: Home },
    ...(isLoggedIn ? [
      ...(user?.role !== 'lawyer' ? [{ id: '/lawyers', label: 'Find Lawyers', icon: Users }] : []),
      { id: '/documents', label: 'Documents', icon: FileText },
      { id: '/compliance', label: 'Compliance', icon: Shield },
    ] : [])
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || location.pathname !== '/'
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' 
          : 'bg-white/90 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" onClick={handleLinkClick}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">NextGenLegal</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.id}
                to={link.id}
                className={`${location.pathname === link.id ? 'text-indigo-600 font-semibold' : 'text-gray-600 hover:text-gray-900'} font-medium transition-colors`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden lg:flex items-center gap-4">
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="font-medium">{user?.full_name?.split(' ')[0] || 'User'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/dashboard')}>
                    <Home className="w-4 h-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/documents')}>
                    <FileText className="w-4 h-4 mr-2" />
                    My Documents
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" onClick={onLogin} className="font-medium">
                  Log in
                </Button>
                <Button onClick={() => navigate('/register')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-900" />
            ) : (
              <Menu className="w-6 h-6 text-gray-900" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 py-4">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.id}
                  to={link.id}
                  onClick={handleLinkClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${location.pathname === link.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {link.icon && <link.icon className={`w-5 h-5 ${location.pathname === link.id ? 'text-indigo-600' : ''}`} />}
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-gray-100 mt-2 pt-2 px-4">
                {isLoggedIn ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 py-3 text-gray-700 font-medium w-full"
                    >
                      <Home className="w-5 h-5" />
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        handleLinkClick();
                        onLogout();
                      }}
                      className="flex items-center gap-3 py-3 text-red-600 font-medium w-full"
                    >
                      <LogOut className="w-5 h-5" />
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" onClick={() => { handleLinkClick(); onLogin(); }} className="w-full">
                      Log in
                    </Button>
                    <Button onClick={() => { handleLinkClick(); navigate('/register'); }} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                      Get Started
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
