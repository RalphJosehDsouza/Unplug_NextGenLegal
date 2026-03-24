export interface CaseFile {
  id: string;
  name: string;
  type: string; // e.g., 'ID Proof', 'FIR Copy', 'Court Order'
  status: 'uploaded' | 'missing';
  uploadDate?: string;
  url?: string;
}

export interface LegalCase {
  id: string;
  clientName: string;
  caseType: string;
  status: 'active' | 'closed';
  requiredFiles: CaseFile[];
}

// Mock Database for Cases
export let casesDb: LegalCase[] = [
  {
    id: 'case_1',
    clientName: 'Rahul Verma',
    caseType: 'Property Dispute',
    status: 'active',
    requiredFiles: [
      { id: 'f1', name: 'Property Deed', type: 'Property Document', status: 'uploaded', uploadDate: '2026-03-20', url: '#' },
      { id: 'f2', name: 'Client ID Proof', type: 'ID', status: 'missing' },
    ]
  },
  {
    id: 'case_2',
    clientName: 'Sneha Patel',
    caseType: 'Divorce Petition',
    status: 'active',
    requiredFiles: [
      { id: 'f3', name: 'Marriage Certificate', type: 'Certificate', status: 'missing' },
      { id: 'f4', name: 'Income Proof', type: 'Financial', status: 'missing' },
    ]
  }
];

export const getLawyerCases = async (): Promise<LegalCase[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...casesDb];
};

export const uploadCaseFile = async (caseId: string, fileId: string, file: File): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  casesDb = casesDb.map(c => {
    if (c.id === caseId) {
      return {
        ...c,
        requiredFiles: c.requiredFiles.map(f => {
          if (f.id === fileId) {
            return { ...f, status: 'uploaded', uploadDate: new Date().toISOString(), name: file.name };
          }
          return f;
        })
      };
    }
    return c;
  });
  
  return true;
};
