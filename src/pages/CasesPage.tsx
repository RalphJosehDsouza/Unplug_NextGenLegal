import { useState, useEffect } from 'react';
import { Upload, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getLawyerCases, uploadCaseFile, type LegalCase } from '../features/cases/CaseFileManager';
import { toast } from 'sonner';

export function CasesPage({ user }: { user: any }) {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    const data = await getLawyerCases();
    setCases(data);
    setLoading(false);
  };

  const handleFileUpload = async (caseId: string, fileId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.info('Uploading file...');
    const result = await uploadCaseFile(caseId, fileId, file);
    if (result) {
      toast.success('File uploaded successfully!');
      loadCases(); // reload
    }
  };

  if (!user || user.role !== 'lawyer') {
    return (
      <div className="min-h-screen pt-24 px-4 text-center">
        Access Denied. Only lawyers can view case files.
      </div>
    );
  }

  if (loading) return <div className="min-h-screen pt-24 px-4 text-center">Loading cases...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Case File Management</h1>
            <p className="text-gray-600">Track required documents and client case files.</p>
          </div>
          <Button className="bg-red-600 hover:bg-red-700 text-white">
            + New Case
          </Button>
        </div>

        <div className="space-y-6">
          {cases.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{c.clientName}</h3>
                  <p className="text-sm text-gray-500">{c.caseType} • ID: {c.id}</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                  {c.status.toUpperCase()}
                </span>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Required Documents</h4>
                <div className="space-y-3">
                  {c.requiredFiles.map((f) => (
                    <div key={f.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        {f.status === 'uploaded' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-amber-500" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{f.name}</p>
                          <p className="text-xs text-gray-500">Type: {f.type}</p>
                        </div>
                      </div>

                      <div>
                        {f.status === 'uploaded' ? (
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-4 h-4" /> 
                            {new Date(f.uploadDate!).toLocaleDateString()}
                          </span>
                        ) : (
                          <div className="relative">
                            <input 
                              type="file" 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={(e) => handleFileUpload(c.id, f.id, e)}
                            />
                            <Button variant="outline" size="sm" className="pointer-events-none">
                              <Upload className="w-4 h-4 mr-2" /> Upload
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
