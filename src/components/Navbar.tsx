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
  Shield,
  Home,
  Building2,
  Wallet,
  ChevronDown,
  Stamp,
  Search,
  Palette,
  MessageSquare,
  FileSearch,
  Map,
  Gavel,
  Bell as BellIcon,
  Sparkles,
  Receipt,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationBell } from '@/components/NotificationBell';
import type { AuthUser } from '@/store/authStore';

interface NavbarProps {
  isLoggedIn: boolean;
  user: AuthUser | null;
  onLogin: () => void;
  onLogout: () => void;
}

type NavDropdown = {
  label: string;
  items: { id: string; label: string; icon: any }[];
};

export function Navbar({ isLoggedIn, user, onLogin, onLogout }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
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
    setMobileExpanded(null);
  };

  const isLawyer = user?.role === 'lawyer';

  // --- CLIENT NAV ---
  const clientDropdowns: NavDropdown[] = [
    {
      label: 'Documents',
      items: [
        { id: '/documents', label: 'Template Library', icon: FileText },
        { id: '/my-documents', label: 'My Documents', icon: FileText },
        { id: '/doc-review', label: 'Doc Review', icon: FileSearch },
      ],
    },
    {
      label: 'Business',
      items: [
        { id: '/business-registration', label: 'Company Registration', icon: Building2 },
        { id: '/trademark', label: 'Trademark Filing', icon: Stamp },
        { id: '/business-name-generator', label: 'Name Generator', icon: Sparkles },
        { id: '/logo-maker', label: 'Logo Maker', icon: Palette },
        { id: '/registered-agent', label: 'Registered Agent', icon: ShieldCheck },
      ],
    },
    {
      label: 'Legal Tools',
      items: [
        { id: '/contract-audit', label: 'Contract Audit', icon: Search },
        { id: '/chat', label: 'AI Chat Assistant', icon: MessageSquare },
        { id: '/rti', label: 'RTI Assistant', icon: Receipt },
        { id: '/law-mapper', label: 'Law Mapper', icon: Map },
        { id: '/ecourts', label: 'eCourts Tracking', icon: Gavel },
        { id: '/legal-notice', label: 'Legal Notice', icon: BellIcon },
      ],
    },
  ];

  const clientLinks = [
    { id: '/lawyers', label: 'Find a Lawyer' },
    { id: '/my-bookings', label: 'My Bookings' },
    { id: '/compliance', label: 'Compliance' },
    { id: '/pricing', label: 'Pricing' },
  ];

  // --- LAWYER NAV ---
  const lawyerLinks = [
    { id: '/dashboard', label: 'Dashboard', icon: Home },
    { id: '/my-bookings', label: 'My Bookings', icon: Briefcase },
    { id: '/lawyers/earnings', label: 'Earnings', icon: Wallet },
    { id: '/lawyers/kyc', label: 'KYC', icon: Shield },
    { id: '/courthouse', label: 'Courthouse', icon: Building2 },
    { id: '/compliance', label: 'Compliance', icon: Shield },
  ];

  // --- NOT LOGGED IN NAV ---
  const publicLinks = [
    { id: '/', label: 'Home' },
    { id: '/enterprise', label: 'Enterprise' },
    { id: '/pricing', label: 'Pricing' },
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
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">NextGenLegal</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {!isLoggedIn && publicLinks.map((link) => (
              <Link
                key={link.id}
                to={link.id}
                className={`${location.pathname === link.id ? 'text-red-600 font-semibold' : 'text-gray-600 hover:text-gray-900'} font-medium transition-colors text-sm`}
              >
                {link.label}
              </Link>
            ))}

            {isLoggedIn && !isLawyer && (
              <>
                {/* Dropdown menus */}
                {clientDropdowns.map((dd) => (
                  <DropdownMenu key={dd.label}>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                        {dd.label} <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {dd.items.map((item) => (
                        <DropdownMenuItem key={item.id} className="cursor-pointer" onClick={() => navigate(item.id)}>
                          <item.icon className="w-4 h-4 mr-2 text-gray-500" />
                          {item.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ))}

                {/* Flat links */}
                {clientLinks.map((link) => (
                  <Link
                    key={link.id}
                    to={link.id}
                    className={`${location.pathname === link.id ? 'text-red-600 font-semibold' : 'text-gray-600 hover:text-gray-900'} font-medium transition-colors text-sm`}
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            )}

            {isLoggedIn && isLawyer && lawyerLinks.map((link) => (
              <Link
                key={link.id}
                to={link.id}
                className={`${location.pathname === link.id ? 'text-red-600 font-semibold' : 'text-gray-600 hover:text-gray-900'} font-medium transition-colors text-sm`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden lg:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                {isLawyer && (
                  <Button
                    onClick={() => navigate('/courthouse')}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                  >
                    <Building2 className="w-4 h-4 mr-1" />
                    CourtHouse
                  </Button>
                )}
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2" size="sm">
                      <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-red-600" />
                      </div>
                      <span className="font-medium text-sm">{user?.full_name?.split(' ')[0] || 'User'}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/dashboard')}>
                      <Home className="w-4 h-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/my-documents')}>
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
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={onLogin} className="font-medium" size="sm">
                  Log in
                </Button>
                <Button onClick={() => navigate('/register')} className="bg-red-600 hover:bg-red-700 text-white font-medium" size="sm">
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
          <div className="lg:hidden bg-white border-t border-gray-100 py-4 max-h-[80vh] overflow-y-auto">
            <div className="flex flex-col gap-1">
              {!isLoggedIn && publicLinks.map((link) => (
                <Link
                  key={link.id}
                  to={link.id}
                  onClick={handleLinkClick}
                  className={`px-4 py-3 rounded-lg font-medium ${location.pathname === link.id ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {link.label}
                </Link>
              ))}

              {isLoggedIn && !isLawyer && (
                <>
                  {/* Accordion dropdowns for mobile */}
                  {clientDropdowns.map((dd) => (
                    <div key={dd.label}>
                      <button
                        onClick={() => setMobileExpanded(mobileExpanded === dd.label ? null : dd.label)}
                        className="flex items-center justify-between w-full px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 rounded-lg"
                      >
                        {dd.label}
                        <ChevronDown className={`w-4 h-4 transition-transform ${mobileExpanded === dd.label ? 'rotate-180' : ''}`} />
                      </button>
                      {mobileExpanded === dd.label && (
                        <div className="ml-4 border-l-2 border-red-200 pl-3 space-y-1">
                          {dd.items.map((item) => (
                            <Link
                              key={item.id}
                              to={item.id}
                              onClick={handleLinkClick}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${location.pathname === item.id ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                              <item.icon className="w-4 h-4" />
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {clientLinks.map((link) => (
                    <Link
                      key={link.id}
                      to={link.id}
                      onClick={handleLinkClick}
                      className={`px-4 py-3 rounded-lg font-medium ${location.pathname === link.id ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </>
              )}

              {isLoggedIn && isLawyer && lawyerLinks.map((link) => (
                <Link
                  key={link.id}
                  to={link.id}
                  onClick={handleLinkClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${location.pathname === link.id ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              ))}

              {/* Auth section */}
              <div className="border-t border-gray-100 mt-2 pt-2 px-4">
                {isLoggedIn ? (
                  <>
                    <div className="py-2"><NotificationBell /></div>
                    <Link to="/dashboard" onClick={handleLinkClick} className="flex items-center gap-3 py-3 text-gray-700 font-medium w-full">
                      <Home className="w-5 h-5" /> Dashboard
                    </Link>
                    <button
                      onClick={() => { handleLinkClick(); onLogout(); }}
                      className="flex items-center gap-3 py-3 text-red-600 font-medium w-full"
                    >
                      <LogOut className="w-5 h-5" /> Logout
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" onClick={() => { handleLinkClick(); onLogin(); }} className="w-full">
                      Log in
                    </Button>
                    <Button onClick={() => { handleLinkClick(); navigate('/register'); }} className="w-full bg-red-600 hover:bg-red-700 text-white">
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
