import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  Star, 
  Languages, 
  Briefcase,
  Filter,
  ChevronDown,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { hireLawyer } from '../features/hiring/HiringService';

// Mock lawyer data
const lawyers = [
  {
    id: 1,
    name: 'Adv. Rajesh Sharma',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80',
    specialization: ['Property Law', 'Civil Litigation'],
    languages: ['Hindi', 'English'],
    state: 'Maharashtra',
    city: 'Mumbai',
    rate_per_hour: 2500,
    rating: 4.9,
    reviews: 127,
    experience: 15,
    verified: true,
    bio: 'Expert in property disputes, rental agreements, and civil matters with 15+ years of experience.',
  },
  {
    id: 2,
    name: 'Adv. Priya Patel',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80',
    specialization: ['Corporate Law', 'Startup Advisory'],
    languages: ['English', 'Gujarati', 'Hindi'],
    state: 'Gujarat',
    city: 'Ahmedabad',
    rate_per_hour: 3500,
    rating: 4.8,
    reviews: 89,
    experience: 12,
    verified: true,
    bio: 'Specialized in company registration, funding agreements, and startup compliance.',
  },
  {
    id: 3,
    name: 'Adv. Karthik Iyer',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
    specialization: ['Tax Law', 'GST Compliance'],
    languages: ['Tamil', 'English', 'Hindi'],
    state: 'Tamil Nadu',
    city: 'Chennai',
    rate_per_hour: 2000,
    rating: 4.7,
    reviews: 156,
    experience: 10,
    verified: true,
    bio: 'GST expert helping businesses with tax filing, audits, and compliance matters.',
  },
  {
    id: 4,
    name: 'Adv. Sunita Reddy',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80',
    specialization: ['Family Law', 'Divorce'],
    languages: ['Telugu', 'English', 'Hindi'],
    state: 'Telangana',
    city: 'Hyderabad',
    rate_per_hour: 1800,
    rating: 4.9,
    reviews: 203,
    experience: 14,
    verified: true,
    bio: 'Compassionate family lawyer handling divorce, custody, and matrimonial disputes.',
  },
  {
    id: 5,
    name: 'Adv. Amit Kumar',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    specialization: ['Criminal Law', 'Bail Matters'],
    languages: ['Hindi', 'English'],
    state: 'Delhi',
    city: 'New Delhi',
    rate_per_hour: 4000,
    rating: 4.8,
    reviews: 178,
    experience: 18,
    verified: true,
    bio: 'Criminal defense attorney with expertise in bail applications and trial proceedings.',
  },
  {
    id: 6,
    name: 'Adv. Meera Nair',
    image: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=200&q=80',
    specialization: ['Labour Law', 'Employment'],
    languages: ['Malayalam', 'English', 'Hindi'],
    state: 'Kerala',
    city: 'Kochi',
    rate_per_hour: 2200,
    rating: 4.6,
    reviews: 94,
    experience: 11,
    verified: true,
    bio: 'Employment law specialist handling workplace disputes, terminations, and compliance.',
  },
];

const specializations = [
  'All',
  'Property Law',
  'Corporate Law',
  'Tax Law',
  'Family Law',
  'Criminal Law',
  'Labour Law',
  'Startup Advisory',
  'GST Compliance',
];

const states = [
  'All',
  'Maharashtra',
  'Gujarat',
  'Tamil Nadu',
  'Telangana',
  'Delhi',
  'Kerala',
  'Karnataka',
  'West Bengal',
];

const languages = [
  'All',
  'Hindi',
  'English',
  'Marathi',
  'Gujarati',
  'Tamil',
  'Telugu',
  'Malayalam',
  'Kannada',
  'Bengali',
];

export function LawyerDirectory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedLang, setSelectedLang] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState<any>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingHours, setBookingHours] = useState(1);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const filteredLawyers = lawyers.filter(lawyer => {
    const matchesSearch = lawyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lawyer.specialization.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSpec = selectedSpec === 'All' || lawyer.specialization.includes(selectedSpec);
    const matchesState = selectedState === 'All' || lawyer.state === selectedState;
    const matchesLang = selectedLang === 'All' || lawyer.languages.includes(selectedLang);
    return matchesSearch && matchesSpec && matchesState && matchesLang;
  });

  const handleBookConsultation = (lawyer: any) => {
    setSelectedLawyer(lawyer);
    setBookingHours(1);
    setBookingSuccess(null);
    setIsBookingOpen(true);
  };

  const processHiring = async () => {
    if (!selectedLawyer) return;
    setIsProcessing(true);
    
    try {
      const response = await hireLawyer({
        lawyerId: selectedLawyer.id,
        lawyerName: selectedLawyer.name,
        ratePerHour: selectedLawyer.rate_per_hour,
        hours: bookingHours
      });
      
      if (response.success) {
        setBookingSuccess(response);
      }
    } catch (e) {
      console.error(e);
      alert('Error processing payment');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section 
      id="lawyers" 
      ref={sectionRef}
      className="py-20 lg:py-32 bg-gray-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center max-w-3xl mx-auto mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full mb-4">
            Lawyer Directory
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Find the Right <span className="text-indigo-600">Legal Expert</span>
          </h2>
          <p className="text-lg text-gray-600">
            Browse our network of verified lawyers across India. Filter by specialization, 
            location, and language to find your perfect match.
          </p>
        </div>

        {/* Search and Filters */}
        <div className={`mb-8 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by name or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 text-base rounded-xl border-gray-200"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>

            {/* Desktop Filters */}
            <div className="hidden lg:flex gap-3">
              <select
                value={selectedSpec}
                onChange={(e) => setSelectedSpec(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {specializations.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {languages.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="lg:hidden mt-4 grid gap-3">
              <select
                value={selectedSpec}
                onChange={(e) => setSelectedSpec(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white"
              >
                {specializations.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white"
              >
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white"
              >
                {languages.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className={`mb-6 text-gray-600 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          Showing {filteredLawyers.length} lawyer{filteredLawyers.length !== 1 ? 's' : ''}
        </div>

        {/* Lawyers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLawyers.map((lawyer, index) => (
            <div
              key={lawyer.id}
              className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${200 + index * 100}ms` }}
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <img
                  src={lawyer.image}
                  alt={lawyer.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{lawyer.name}</h3>
                    {lawyer.verified && (
                      <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-semibold text-sm">{lawyer.rating}</span>
                    <span className="text-gray-400 text-sm">({lawyer.reviews} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {lawyer.city}, {lawyer.state}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Briefcase className="w-4 h-4" />
                  {lawyer.experience} years experience
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Languages className="w-4 h-4" />
                  {lawyer.languages.join(', ')}
                </div>
              </div>

              {/* Specializations */}
              <div className="flex flex-wrap gap-2 mb-4">
                {lawyer.specialization.map((spec) => (
                  <Badge key={spec} variant="secondary" className="bg-gray-100 text-gray-700">
                    {spec}
                  </Badge>
                ))}
              </div>

              {/* Rate & CTA */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                  <span className="text-2xl font-bold text-gray-900">₹{lawyer.rate_per_hour}</span>
                  <span className="text-gray-500 text-sm">/hour</span>
                </div>
                <Button 
                  onClick={() => handleBookConsultation(lawyer)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredLawyers.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No lawyers found</h3>
            <p className="text-gray-600">Try adjusting your filters or search query</p>
          </div>
        )}

        {/* Booking Dialog */}
        <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Book Consultation</DialogTitle>
            </DialogHeader>
            {selectedLawyer && !bookingSuccess && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <img
                    src={selectedLawyer.image}
                    alt={selectedLawyer.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold">{selectedLawyer.name}</h4>
                    <p className="text-sm text-gray-600">₹{selectedLawyer.rate_per_hour}/hour</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Hours to book</label>
                  <Input 
                    type="number" 
                    min={1} 
                    value={bookingHours} 
                    onChange={(e) => setBookingHours(Number(e.target.value) || 1)} 
                  />
                  <div className="flex justify-between font-semibold p-2 border-t mt-2">
                    <span>Total Amount</span>
                    <span>₹{selectedLawyer.rate_per_hour * bookingHours}</span>
                  </div>
                  <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={processHiring}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing Payment...' : 'Hire & Pay'}
                  </Button>
                </div>
              </div>
            )}
            
            {bookingSuccess && (
              <div className="space-y-4 p-4 text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Successfully Hired!</h3>
                <p className="text-gray-600">{bookingSuccess.message}</p>
                <div className="bg-gray-50 p-4 rounded-xl text-left text-sm mt-4 space-y-2">
                  <div className="flex justify-between"><span>Transaction ID:</span> <strong>{bookingSuccess.transactionId}</strong></div>
                  <div className="flex justify-between"><span>Total Paid:</span> <strong>₹{bookingSuccess.totalAmount}</strong></div>
                  <div className="flex justify-between text-gray-400"><span>Platform Commission Recorded:</span> <span>₹{bookingSuccess.commission}</span></div>
                </div>
                <Button 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4"
                  onClick={() => setIsBookingOpen(false)}
                >
                  Close
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
