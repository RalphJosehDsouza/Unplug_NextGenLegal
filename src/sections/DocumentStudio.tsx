import { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Clock, 
  Shield,
  ArrowRight,
  Sparkles,
  FileCheck,
  FileSignature
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const documentTypes = [
  {
    id: 'nda',
    name: 'Non-Disclosure Agreement',
    description: 'Protect your confidential information with a legally binding NDA.',
    icon: Shield,
    color: 'bg-blue-500',
    time: '2 min',
    fields: ['party_a_name', 'party_a_address', 'party_b_name', 'party_b_address', 'purpose', 'duration_months'],
  },
  {
    id: 'rental',
    name: 'Rental Agreement',
    description: 'Standard rental agreement for residential properties in India.',
    icon: FileText,
    color: 'bg-indigo-500',
    time: '3 min',
    fields: ['landlord_name', 'tenant_name', 'property_address', 'rent_amount', 'deposit', 'duration_months'],
  },
  {
    id: 'partnership',
    name: 'Partnership Deed',
    description: 'Formalize your business partnership with a comprehensive deed.',
    icon: FileSignature,
    color: 'bg-purple-500',
    time: '5 min',
    fields: ['firm_name', 'partner1_name', 'partner2_name', 'business_address', 'capital_contribution', 'profit_ratio'],
  },
  {
    id: 'employment',
    name: 'Employment Contract',
    description: 'Hire employees with a compliant employment agreement.',
    icon: FileCheck,
    color: 'bg-amber-500',
    time: '4 min',
    fields: ['employer_name', 'employee_name', 'designation', 'salary', 'start_date', 'probation_months'],
  },
  {
    id: 'affidavit',
    name: 'Affidavit',
    description: 'Create sworn statements for various legal purposes.',
    icon: FileText,
    color: 'bg-rose-500',
    time: '2 min',
    fields: ['deponent_name', 'deponent_address', 'statement', 'purpose'],
  },
  {
    id: 'power_of_attorney',
    name: 'Power of Attorney',
    description: 'Authorize someone to act on your behalf legally.',
    icon: Shield,
    color: 'bg-indigo-500',
    time: '3 min',
    fields: ['principal_name', 'attorney_name', 'powers_granted', 'effective_date', 'expiry_date'],
  },
];

const recentDocuments = [
  { id: 1, title: 'NDA - TechStart Solutions', type: 'nda', date: '2024-03-20', status: 'completed' },
  { id: 2, title: 'Rental Agreement - Mumbai Flat', type: 'rental', date: '2024-03-18', status: 'completed' },
  { id: 3, title: 'Employment Contract - Developer', type: 'employment', date: '2024-03-15', status: 'draft' },
];

export function DocumentStudio() {
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
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

  const handleSelectDoc = (doc: any) => {
    setSelectedDoc(doc);
    setFormData({});
    setIsFormOpen(true);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simulate document generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    setIsFormOpen(false);
    toast.success('Document generated successfully!', {
      description: 'Your document has been created and is ready for download.',
    });
  };

  const getFieldLabel = (field: string) => {
    return field.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <section 
      id="documents" 
      ref={sectionRef}
      className="py-20 lg:py-32 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full mb-4">
            Document Studio
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Generate Legal Documents in <span className="text-indigo-600">Minutes</span>
          </h2>
          <p className="text-lg text-gray-600">
            Create professionally drafted legal documents instantly. Our AI-powered 
            templates ensure compliance with Indian laws.
          </p>
        </div>

        {/* Stats Bar */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {[
            { value: '50,000+', label: 'Documents Generated' },
            { value: '< 60 sec', label: 'Average Time' },
            { value: '100%', label: 'Legally Compliant' },
            { value: '24/7', label: 'Available' },
          ].map((stat, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Document Types Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {documentTypes.map((doc, index) => (
            <div
              key={doc.id}
              onClick={() => handleSelectDoc(doc)}
              className={`group cursor-pointer bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${200 + index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${doc.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <doc.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-indigo-600 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  {doc.time}
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{doc.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{doc.description}</p>
              <div className="flex items-center text-indigo-600 font-medium text-sm group-hover:gap-2 transition-all">
                Generate
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        {/* Recent Documents */}
        <div className={`bg-gray-50 rounded-2xl p-6 lg:p-8 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Documents</h3>
            <Button variant="ghost" className="text-indigo-600">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {recentDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{doc.title}</h4>
                    <p className="text-sm text-gray-500">{doc.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={doc.status === 'completed' ? 'default' : 'secondary'}
                    className={doc.status === 'completed' ? 'bg-indigo-100 text-indigo-700' : ''}
                  >
                    {doc.status === 'completed' ? 'Completed' : 'Draft'}
                  </Badge>
                  <Button variant="ghost" size="icon">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {selectedDoc && (
                  <>
                    <div className={`w-10 h-10 ${selectedDoc.color} rounded-lg flex items-center justify-center`}>
                      <selectedDoc.icon className="w-5 h-5 text-white" />
                    </div>
                    <span>{selectedDoc.name}</span>
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            {selectedDoc && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">{selectedDoc.description}</p>
                <div className="space-y-4">
                  {selectedDoc.fields.map((field: string) => (
                    <div key={field}>
                      <Label htmlFor={field} className="text-sm font-medium">
                        {getFieldLabel(field)}
                      </Label>
                      <Input
                        id={field}
                        value={formData[field] || ''}
                        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                        placeholder={`Enter ${getFieldLabel(field).toLowerCase()}`}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    AI-powered generation
                  </div>
                </div>
                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Document
                    </>
                  )}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
