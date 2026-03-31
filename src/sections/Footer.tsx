import { 
  Scale, 
  Mail, 
  Phone, 
  MapPin,
  Twitter,
  Linkedin,
  Facebook,
  Instagram
} from 'lucide-react';
import { Link } from 'react-router-dom';

const footerLinks = {
  product: [
    { label: 'Features', href: '/' },
    { label: 'Find a Lawyer', href: '/lawyers' },
    { label: 'Document Studio', href: '/documents' },
    { label: 'Compliance', href: '/compliance' },
    { label: 'Legal Notice', href: '/legal-notice' },
  ],
  company: [
    { label: 'About Us', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Press', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  resources: [
    { label: 'BNS Law Mapper', href: '/law-mapper' },
    { label: 'eCourts Tracker', href: '/ecourts' },
    { label: 'RTI Assistant', href: '/rti' },
    { label: 'AI Doc Review', href: '/doc-review' },
    { label: 'Legal Templates', href: '/documents' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
    { label: 'Disclaimer', href: '#' },
  ],
};

const socialLinks = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: '#', label: 'Instagram' },
];

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16 lg:py-20">
          <div className="grid lg:grid-cols-6 gap-12">
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">NextGenLegal</span>
              </Link>
              <p className="text-gray-400 mb-6 max-w-sm">
                Democratizing legal services across India through technology. 
                Affordable, accessible, and AI-powered legal solutions for everyone.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-400">
                  <Mail className="w-5 h-5" />
                  <span>support@nextgenlegal.in</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <Phone className="w-5 h-5" />
                  <span>+91 1800-123-4567</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <MapPin className="w-5 h-5" />
                  <span>Mumbai, Maharashtra, India</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('/') ? (
                      <Link to={link.href} className="text-gray-400 hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} className="text-gray-400 hover:text-white transition-colors">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-gray-400 hover:text-white transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('/') ? (
                        <Link to={link.href} className="text-gray-400 hover:text-white transition-colors">
                          {link.label}
                        </Link>
                      ) : (
                        <a href={link.href} className="text-gray-400 hover:text-white transition-colors">
                          {link.label}
                        </a>
                      )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-gray-400 hover:text-white transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="py-6 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © 2024 NextGenLegal. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="py-6 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center">
            Disclaimer: NextGenLegal is a technology platform that connects users with legal professionals 
            and provides automated document generation tools. We are not a law firm and do not provide 
            legal advice. The information provided on this platform is for general informational purposes only. 
            Always consult with a qualified legal professional for specific legal matters.
          </p>
        </div>
      </div>
    </footer>
  );
}
