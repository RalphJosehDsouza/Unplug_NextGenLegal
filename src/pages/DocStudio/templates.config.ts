import type { LucideIcon } from 'lucide-react';
import { FileText, Shield, FileSignature, BriefcaseBusiness, Scale, Home, Heart, Users, Landmark, ScrollText, Receipt, KeyRound } from 'lucide-react';

export type TemplateFieldType = 'text' | 'date' | 'number' | 'textarea' | 'select';

export type TemplateField = {
  name: string;
  label: string;
  type: TemplateFieldType;
  placeholder?: string;
  required: boolean;
  options?: string[];
};

export type TemplateCategory = 'business' | 'real_estate' | 'family' | 'personal';

export type TemplateConfig = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  category: TemplateCategory;
  govtFeeNote?: string;
  fields: TemplateField[];
};

export const templatesConfig: TemplateConfig[] = [
  // ── BUSINESS & CONTRACTS ──
  {
    id: 'nda',
    label: 'NDA',
    description: 'Protect your confidential information with a legally usable NDA draft.',
    icon: Shield,
    category: 'business',
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
    id: 'partnership_deed',
    label: 'Partnership Deed',
    description: 'Draft a partnership deed with clear capital and profit sharing terms.',
    icon: FileSignature,
    category: 'business',
    fields: [
      { name: 'firm_name', label: 'Firm Name', type: 'text', required: true, placeholder: 'e.g., Veritas Legal Partners' },
      { name: 'partner_1_name', label: 'Partner 1 Name', type: 'text', required: true, placeholder: 'Partner 1 name' },
      { name: 'partner_1_address', label: 'Partner 1 Address', type: 'textarea', required: true, placeholder: 'Address for Partner 1' },
      { name: 'partner_2_name', label: 'Partner 2 Name', type: 'text', required: true, placeholder: 'Partner 2 name' },
      { name: 'partner_2_address', label: 'Partner 2 Address', type: 'textarea', required: true, placeholder: 'Address for Partner 2' },
      { name: 'business_nature', label: 'Business Nature', type: 'textarea', required: true, placeholder: 'e.g., IT services and consulting' },
      { name: 'capital_contribution_1', label: 'Capital (Partner 1)', type: 'number', required: true, placeholder: 'e.g., 500000' },
      { name: 'capital_contribution_2', label: 'Capital (Partner 2)', type: 'number', required: true, placeholder: 'e.g., 300000' },
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
    category: 'business',
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

  // ── REAL ESTATE ──
  {
    id: 'rental_agreement',
    label: 'Rental / Lease Agreement',
    description: 'Create a structured rental agreement for residential property in India.',
    icon: Home,
    category: 'real_estate',
    govtFeeNote: 'Stamp duty: ₹100–₹500 depending on state (paid separately)',
    fields: [
      { name: 'landlord_name', label: 'Landlord Name', type: 'text', required: true, placeholder: 'e.g., Anil Verma' },
      { name: 'tenant_name', label: 'Tenant Name', type: 'text', required: true, placeholder: 'e.g., Priya Mehta' },
      { name: 'property_address', label: 'Property Address', type: 'textarea', required: true, placeholder: 'Complete property address' },
      { name: 'property_type', label: 'Property Type', type: 'text', required: true, placeholder: 'e.g., 2BHK Flat' },
      { name: 'monthly_rent', label: 'Monthly Rent (₹)', type: 'number', required: true, placeholder: 'e.g., 15000' },
      { name: 'security_deposit', label: 'Security Deposit (₹)', type: 'number', required: true, placeholder: 'e.g., 60000' },
      { name: 'lease_start_date', label: 'Lease Start Date', type: 'date', required: true, placeholder: '' },
      { name: 'lease_end_date', label: 'Lease End Date', type: 'date', required: true, placeholder: '' },
      { name: 'lock_in_period_months', label: 'Lock-in Period (months)', type: 'number', required: false, placeholder: 'e.g., 6' },
      { name: 'maintenance_charges', label: 'Maintenance Charges (₹)', type: 'number', required: false, placeholder: 'e.g., 2000' },
    ],
  },
  {
    id: 'leave_license',
    label: 'Leave & License Agreement',
    description: 'Standard leave and license agreement for Maharashtra and other states.',
    icon: KeyRound,
    category: 'real_estate',
    govtFeeNote: 'Maharashtra e-registration available',
    fields: [
      { name: 'licensor_name', label: 'Licensor Name', type: 'text', required: true, placeholder: 'Property owner name' },
      { name: 'licensee_name', label: 'Licensee Name', type: 'text', required: true, placeholder: 'Occupant name' },
      { name: 'property_address', label: 'Property Address', type: 'textarea', required: true, placeholder: 'Full address' },
      { name: 'monthly_compensation', label: 'Monthly License Fee (₹)', type: 'number', required: true, placeholder: 'e.g., 20000' },
      { name: 'deposit_amount', label: 'Deposit Amount (₹)', type: 'number', required: true, placeholder: 'e.g., 100000' },
      { name: 'license_period_months', label: 'License Period (months)', type: 'number', required: true, placeholder: 'e.g., 11' },
      { name: 'purpose', label: 'Purpose', type: 'text', required: true, placeholder: 'e.g., Residential use' },
      { name: 'notice_period_days', label: 'Notice Period (days)', type: 'number', required: false, placeholder: 'e.g., 30' },
    ],
  },
  {
    id: 'sale_deed',
    label: 'Sale Deed',
    description: 'Transfer ownership of immovable property with a legally structured sale deed.',
    icon: Landmark,
    category: 'real_estate',
    govtFeeNote: 'Stamp duty: 3-7% of property value (state-specific, paid at registrar)',
    fields: [
      { name: 'seller_name', label: 'Seller Name', type: 'text', required: true, placeholder: 'Seller full name' },
      { name: 'buyer_name', label: 'Buyer Name', type: 'text', required: true, placeholder: 'Buyer full name' },
      { name: 'property_description', label: 'Property Description', type: 'textarea', required: true, placeholder: 'Flat/plot details, survey number, area' },
      { name: 'property_area_sqft', label: 'Area (sq ft)', type: 'number', required: true, placeholder: 'e.g., 1200' },
      { name: 'sale_consideration', label: 'Sale Price (₹)', type: 'number', required: true, placeholder: 'e.g., 5000000' },
      { name: 'advance_paid', label: 'Advance Paid (₹)', type: 'number', required: false, placeholder: 'e.g., 500000' },
      { name: 'possession_date', label: 'Possession Date', type: 'date', required: true, placeholder: '' },
    ],
  },
  {
    id: 'gift_deed',
    label: 'Gift Deed',
    description: 'Transfer property as a gift to family members or others.',
    icon: Heart,
    category: 'real_estate',
    govtFeeNote: 'Blood relatives: ₹1,000–₹5,000 flat. Non-relatives: same as sale deed rates.',
    fields: [
      { name: 'donor_name', label: 'Donor Name', type: 'text', required: true, placeholder: 'Donor full name' },
      { name: 'donee_name', label: 'Donee Name', type: 'text', required: true, placeholder: 'Recipient full name' },
      { name: 'relationship', label: 'Relationship', type: 'text', required: true, placeholder: 'e.g., Father to Son' },
      { name: 'property_description', label: 'Property Description', type: 'textarea', required: true, placeholder: 'Property details' },
      { name: 'property_value', label: 'Property Value (₹)', type: 'number', required: true, placeholder: 'e.g., 3000000' },
      { name: 'reason_for_gift', label: 'Reason for Gift', type: 'textarea', required: false, placeholder: 'e.g., Love and affection' },
    ],
  },
  {
    id: 'eviction_notice',
    label: 'Eviction Notice',
    description: 'Serve a legal eviction notice to a tenant for non-payment or breach.',
    icon: ScrollText,
    category: 'real_estate',
    fields: [
      { name: 'landlord_name', label: 'Landlord Name', type: 'text', required: true, placeholder: 'Landlord full name' },
      { name: 'tenant_name', label: 'Tenant Name', type: 'text', required: true, placeholder: 'Tenant full name' },
      { name: 'property_address', label: 'Property Address', type: 'textarea', required: true, placeholder: 'Full address' },
      { name: 'reason_for_eviction', label: 'Reason for Eviction', type: 'textarea', required: true, placeholder: 'e.g., Non-payment of rent for 3 months' },
      { name: 'notice_period_days', label: 'Notice Period (days)', type: 'number', required: true, placeholder: 'e.g., 30' },
      { name: 'outstanding_rent_amount', label: 'Outstanding Rent (₹)', type: 'number', required: false, placeholder: 'e.g., 45000' },
      { name: 'vacate_by_date', label: 'Vacate By Date', type: 'date', required: true, placeholder: '' },
    ],
  },
  {
    id: 'rent_receipt',
    label: 'Rent Receipt',
    description: 'Generate rent receipts for tax exemption under Section 10(13A).',
    icon: Receipt,
    category: 'real_estate',
    fields: [
      { name: 'landlord_name', label: 'Landlord Name', type: 'text', required: true, placeholder: 'Landlord name' },
      { name: 'tenant_name', label: 'Tenant Name', type: 'text', required: true, placeholder: 'Tenant name' },
      { name: 'property_address', label: 'Property Address', type: 'textarea', required: true, placeholder: 'Full address' },
      { name: 'rent_amount', label: 'Rent Amount (₹)', type: 'number', required: true, placeholder: 'e.g., 15000' },
      { name: 'payment_date', label: 'Payment Date', type: 'date', required: true, placeholder: '' },
      { name: 'payment_mode', label: 'Payment Mode', type: 'text', required: true, placeholder: 'e.g., UPI / Bank Transfer / Cash' },
      { name: 'period_from', label: 'Period From', type: 'date', required: true, placeholder: '' },
      { name: 'period_to', label: 'Period To', type: 'date', required: true, placeholder: '' },
    ],
  },

  // ── FAMILY & PERSONAL ──
  {
    id: 'will_testament',
    label: 'Last Will & Testament',
    description: 'Draft a legally structured will for distribution of assets.',
    icon: ScrollText,
    category: 'family',
    govtFeeNote: 'Registration stamp: ₹200–₹1,000. Probate optional since Dec 2025.',
    fields: [
      { name: 'testator_name', label: 'Testator Name', type: 'text', required: true, placeholder: 'Your full name' },
      { name: 'testator_address', label: 'Testator Address', type: 'textarea', required: true, placeholder: 'Your full address' },
      { name: 'testator_age', label: 'Age', type: 'number', required: true, placeholder: 'e.g., 55' },
      { name: 'beneficiaries', label: 'Beneficiaries & Shares', type: 'textarea', required: true, placeholder: 'e.g., Son Rahul - 50%, Daughter Priya - 50%' },
      { name: 'executor_name', label: 'Executor Name', type: 'text', required: true, placeholder: 'Person to execute your will' },
      { name: 'executor_address', label: 'Executor Address', type: 'textarea', required: true, placeholder: 'Executor address' },
      { name: 'specific_bequests', label: 'Specific Bequests', type: 'textarea', required: false, placeholder: 'e.g., Gold jewelry to daughter, Car to son' },
      { name: 'witness_1_name', label: 'Witness 1 Name', type: 'text', required: true, placeholder: 'Witness 1' },
      { name: 'witness_2_name', label: 'Witness 2 Name', type: 'text', required: true, placeholder: 'Witness 2' },
    ],
  },
  {
    id: 'divorce_petition',
    label: 'Divorce Petition',
    description: 'Draft a divorce petition under Hindu Marriage Act or Special Marriage Act.',
    icon: Users,
    category: 'family',
    govtFeeNote: 'Court fee: ₹100. Consider hiring a family lawyer for filing.',
    fields: [
      { name: 'petitioner_name', label: 'Petitioner Name', type: 'text', required: true, placeholder: 'Petitioner full name' },
      { name: 'respondent_name', label: 'Respondent Name', type: 'text', required: true, placeholder: 'Respondent full name' },
      { name: 'marriage_date', label: 'Marriage Date', type: 'date', required: true, placeholder: '' },
      { name: 'marriage_place', label: 'Marriage Place', type: 'text', required: true, placeholder: 'e.g., Mumbai' },
      { name: 'children_details', label: 'Children Details', type: 'textarea', required: false, placeholder: 'Names, ages of children' },
      { name: 'grounds_for_divorce', label: 'Grounds for Divorce', type: 'textarea', required: true, placeholder: 'Legal grounds' },
      { name: 'maintenance_request', label: 'Maintenance Request', type: 'textarea', required: false, placeholder: 'If applicable' },
      { name: 'court_name', label: 'Court Name', type: 'text', required: true, placeholder: 'e.g., Family Court, Mumbai' },
    ],
  },
  {
    id: 'mutual_divorce',
    label: 'Mutual Divorce Agreement',
    description: 'Draft a mutual consent divorce agreement under Section 13B.',
    icon: Users,
    category: 'family',
    fields: [
      { name: 'husband_name', label: 'Husband Name', type: 'text', required: true, placeholder: 'Husband full name' },
      { name: 'wife_name', label: 'Wife Name', type: 'text', required: true, placeholder: 'Wife full name' },
      { name: 'marriage_date', label: 'Marriage Date', type: 'date', required: true, placeholder: '' },
      { name: 'separation_date', label: 'Separation Date', type: 'date', required: true, placeholder: '' },
      { name: 'alimony_amount', label: 'Alimony Amount (₹)', type: 'number', required: false, placeholder: 'e.g., 500000' },
      { name: 'child_custody_arrangement', label: 'Child Custody', type: 'textarea', required: false, placeholder: 'Custody terms' },
      { name: 'property_division_details', label: 'Property Division', type: 'textarea', required: false, placeholder: 'How property is divided' },
    ],
  },
  {
    id: 'child_custody',
    label: 'Child Custody Agreement',
    description: 'Draft a custody and visitation agreement for separated parents.',
    icon: Heart,
    category: 'family',
    fields: [
      { name: 'mother_name', label: 'Mother Name', type: 'text', required: true, placeholder: 'Mother full name' },
      { name: 'father_name', label: 'Father Name', type: 'text', required: true, placeholder: 'Father full name' },
      { name: 'child_name', label: 'Child Name', type: 'text', required: true, placeholder: 'Child full name' },
      { name: 'child_dob', label: 'Child Date of Birth', type: 'date', required: true, placeholder: '' },
      { name: 'custody_type', label: 'Custody Type', type: 'text', required: true, placeholder: 'Sole / Joint / Shared' },
      { name: 'primary_custodian', label: 'Primary Custodian', type: 'text', required: true, placeholder: 'e.g., Mother' },
      { name: 'visitation_schedule', label: 'Visitation Schedule', type: 'textarea', required: true, placeholder: 'e.g., Every weekend, alternate holidays' },
      { name: 'child_support_monthly', label: 'Monthly Child Support (₹)', type: 'number', required: false, placeholder: 'e.g., 20000' },
    ],
  },
  {
    id: 'general_poa',
    label: 'General Power of Attorney',
    description: 'Authorize someone to act on your behalf in legal and financial matters.',
    icon: FileSignature,
    category: 'personal',
    fields: [
      { name: 'principal_name', label: 'Principal (Your Name)', type: 'text', required: true, placeholder: 'Your full name' },
      { name: 'principal_address', label: 'Principal Address', type: 'textarea', required: true, placeholder: 'Your full address' },
      { name: 'agent_name', label: 'Agent Name', type: 'text', required: true, placeholder: 'Person you are authorizing' },
      { name: 'agent_address', label: 'Agent Address', type: 'textarea', required: true, placeholder: 'Agent address' },
      { name: 'powers_description', label: 'Powers Granted', type: 'textarea', required: true, placeholder: 'Describe powers being granted' },
      { name: 'effective_date', label: 'Effective Date', type: 'date', required: true, placeholder: '' },
      { name: 'duration', label: 'Duration', type: 'text', required: false, placeholder: 'e.g., 2 years or Until revoked' },
    ],
  },
  {
    id: 'general_affidavit',
    label: 'Affidavit',
    description: 'Draft an affidavit with a structured statement and attestation section.',
    icon: Scale,
    category: 'personal',
    fields: [
      { name: 'deponent_name', label: 'Deponent Name', type: 'text', required: true, placeholder: 'e.g., Kiran Patel' },
      { name: 'deponent_age', label: 'Deponent Age', type: 'number', required: true, placeholder: 'e.g., 38' },
      { name: 'deponent_address', label: 'Deponent Address', type: 'textarea', required: true, placeholder: 'Full address' },
      { name: 'purpose', label: 'Purpose', type: 'text', required: true, placeholder: 'e.g., Name change, Address proof' },
      { name: 'statement_text', label: 'Statement', type: 'textarea', required: true, placeholder: 'State your facts clearly' },
      { name: 'notary_location', label: 'Notary Location', type: 'text', required: true, placeholder: 'e.g., Pune, Maharashtra' },
      { name: 'date', label: 'Date', type: 'date', required: true, placeholder: '' },
    ],
  },
  {
    id: 'adoption_deed',
    label: 'Adoption Deed',
    description: 'Legal document for adoption proceedings under Indian law.',
    icon: Heart,
    category: 'family',
    fields: [
      { name: 'adoptive_parent_name', label: 'Adoptive Parent Name', type: 'text', required: true, placeholder: 'Adoptive parent full name' },
      { name: 'adoptive_parent_address', label: 'Adoptive Parent Address', type: 'textarea', required: true, placeholder: 'Full address' },
      { name: 'biological_parent_name', label: 'Biological Parent Name', type: 'text', required: false, placeholder: 'If known' },
      { name: 'child_name', label: 'Child Name', type: 'text', required: true, placeholder: 'Child full name' },
      { name: 'child_age', label: 'Child Age', type: 'number', required: true, placeholder: 'e.g., 5' },
      { name: 'child_gender', label: 'Child Gender', type: 'text', required: true, placeholder: 'e.g., Male / Female' },
      { name: 'consent_details', label: 'Consent Details', type: 'textarea', required: true, placeholder: 'Who consented and how' },
    ],
  },
];

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  business: 'Business & Contracts',
  real_estate: 'Real Estate',
  family: 'Family & Personal',
  personal: 'Personal',
};
