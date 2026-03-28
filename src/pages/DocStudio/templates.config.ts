import type { LucideIcon } from 'lucide-react';
import { FileText, Shield, FileSignature, BriefcaseBusiness, Scale } from 'lucide-react';

export type TemplateFieldType = 'text' | 'date' | 'number' | 'textarea';

export type TemplateField = {
  name: string;
  label: string;
  type: TemplateFieldType;
  placeholder?: string;
  required: boolean;
};

export type TemplateConfig = {
  id: 'nda' | 'rental_agreement' | 'partnership_deed' | 'employment_contract' | 'affidavit';
  label: string;
  description: string;
  icon: LucideIcon;
  fields: TemplateField[];
};

export const templatesConfig: TemplateConfig[] = [
  {
    id: 'nda',
    label: 'NDA',
    description: 'Protect your confidential information with a legally usable NDA draft.',
    icon: Shield,
    fields: [
      { name: 'date', label: 'Date', type: 'date', required: true, placeholder: 'Select date' },
      { name: 'party_a_name', label: 'Party A Name', type: 'text', required: true, placeholder: 'e.g., Raj Kumar' },
      { name: 'party_a_address', label: 'Party A Address', type: 'textarea', required: true, placeholder: 'Full address of Party A' },
      { name: 'party_b_name', label: 'Party B Name', type: 'text', required: true, placeholder: 'e.g., Neha Sharma' },
      { name: 'party_b_address', label: 'Party B Address', type: 'textarea', required: true, placeholder: 'Full address of Party B' },
      { name: 'purpose', label: 'Purpose', type: 'textarea', required: true, placeholder: 'Brief purpose of disclosure' },
      { name: 'duration_months', label: 'Duration (months)', type: 'number', required: true, placeholder: 'e.g., 12' },
      { name: 'jurisdiction', label: 'Jurisdiction', type: 'text', required: false, placeholder: 'Default: Mumbai, Maharashtra' },
    ],
  },
  {
    id: 'rental_agreement',
    label: 'Rental Agreement',
    description: 'Create a structured rental agreement for residential property in India.',
    icon: FileText,
    fields: [
      { name: 'landlord_name', label: 'Landlord Name', type: 'text', required: true, placeholder: 'e.g., Anil Verma' },
      { name: 'landlord_address', label: 'Landlord Address', type: 'textarea', required: true, placeholder: 'Full address of landlord' },
      { name: 'tenant_name', label: 'Tenant Name', type: 'text', required: true, placeholder: 'e.g., Priya Mehta' },
      { name: 'tenant_address', label: 'Tenant Address', type: 'textarea', required: true, placeholder: 'Full address of tenant' },
      { name: 'property_address', label: 'Property Address', type: 'textarea', required: true, placeholder: 'Complete property address' },
      { name: 'monthly_rent_words', label: 'Monthly Rent (in words)', type: 'text', required: true, placeholder: 'e.g., Twelve Thousand Only' },
      { name: 'monthly_rent_figures', label: 'Monthly Rent (figures)', type: 'number', required: true, placeholder: 'e.g., 12000' },
      { name: 'deposit_amount', label: 'Deposit Amount', type: 'number', required: true, placeholder: 'e.g., 60000' },
      { name: 'start_date', label: 'Start Date', type: 'date', required: true, placeholder: 'Select start date' },
      { name: 'duration_months', label: 'Duration (months)', type: 'number', required: true, placeholder: 'e.g., 11' },
      { name: 'city', label: 'City', type: 'text', required: true, placeholder: 'e.g., Mumbai' },
    ],
  },
  {
    id: 'partnership_deed',
    label: 'Partnership Deed',
    description: 'Draft a partnership deed with clear capital and profit sharing terms.',
    icon: FileSignature,
    fields: [
      { name: 'firm_name', label: 'Firm Name', type: 'text', required: true, placeholder: 'e.g., Veritas Legal Partners' },
      { name: 'partner_1_name', label: 'Partner 1 Name', type: 'text', required: true, placeholder: 'Partner 1 name' },
      { name: 'partner_1_address', label: 'Partner 1 Address', type: 'textarea', required: true, placeholder: 'Address for Partner 1' },
      { name: 'partner_2_name', label: 'Partner 2 Name', type: 'text', required: true, placeholder: 'Partner 2 name' },
      { name: 'partner_2_address', label: 'Partner 2 Address', type: 'textarea', required: true, placeholder: 'Address for Partner 2' },
      { name: 'business_nature', label: 'Business Nature', type: 'textarea', required: true, placeholder: 'e.g., IT services and consulting' },
      { name: 'capital_contribution_1', label: 'Capital Contribution (Partner 1)', type: 'number', required: true, placeholder: 'e.g., 500000' },
      { name: 'capital_contribution_2', label: 'Capital Contribution (Partner 2)', type: 'number', required: true, placeholder: 'e.g., 300000' },
      { name: 'profit_ratio', label: 'Profit Ratio', type: 'text', required: true, placeholder: 'e.g., 60:40' },
      { name: 'start_date', label: 'Start Date', type: 'date', required: true, placeholder: 'Select start date' },
      { name: 'city', label: 'City', type: 'text', required: true, placeholder: 'e.g., Delhi' },
    ],
  },
  {
    id: 'employment_contract',
    label: 'Employment Contract',
    description: 'Create an employment agreement covering key terms and notice period.',
    icon: BriefcaseBusiness,
    fields: [
      { name: 'employer_name', label: 'Employer Name', type: 'text', required: true, placeholder: 'e.g., NextGen Legal Pvt Ltd' },
      { name: 'employee_name', label: 'Employee Name', type: 'text', required: true, placeholder: 'e.g., Ananya Singh' },
      { name: 'designation', label: 'Designation', type: 'text', required: true, placeholder: 'e.g., Legal Associate' },
      { name: 'department', label: 'Department', type: 'text', required: true, placeholder: 'e.g., Compliance' },
      { name: 'start_date', label: 'Start Date', type: 'date', required: true, placeholder: 'Select start date' },
      { name: 'salary_words', label: 'Salary (in words)', type: 'text', required: true, placeholder: 'e.g., Fifty Thousand Only' },
      { name: 'salary_figures', label: 'Salary (figures)', type: 'number', required: true, placeholder: 'e.g., 50000' },
      { name: 'notice_period_days', label: 'Notice Period (days)', type: 'number', required: true, placeholder: 'e.g., 30' },
      { name: 'city', label: 'City', type: 'text', required: true, placeholder: 'e.g., Bengaluru' },
    ],
  },
  {
    id: 'affidavit',
    label: 'Affidavit',
    description: 'Draft an affidavit with a structured statement and attestation section.',
    icon: Scale,
    fields: [
      { name: 'deponent_name', label: 'Deponent Name', type: 'text', required: true, placeholder: 'e.g., Kiran Patel' },
      { name: 'deponent_age', label: 'Deponent Age', type: 'number', required: true, placeholder: 'e.g., 38' },
      { name: 'deponent_address', label: 'Deponent Address', type: 'textarea', required: true, placeholder: 'Full address of deponent' },
      { name: 'statement_text', label: 'Statement Text', type: 'textarea', required: true, placeholder: 'State your facts clearly' },
      { name: 'date', label: 'Date', type: 'date', required: true, placeholder: 'Select date' },
      { name: 'city', label: 'City', type: 'text', required: true, placeholder: 'e.g., Pune' },
      { name: 'notary_name', label: 'Notary/Attesting Authority Name', type: 'text', required: true, placeholder: 'Name' },
    ],
  },
];

