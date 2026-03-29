const CRIMINAL_CASE_TYPE_ID = '6fe8e0c1-4dbd-40d8-9688-8e727c443bea';
const DIVORCE_CASE_TYPE_ID = 'c4e87af9-0d54-4ee8-9fce-c7bf1a9a7216';
const CIVIL_CASE_TYPE_ID = 'ec8e7f44-8550-4458-b74c-ec389f4ca8d7';
const PROPERTY_CASE_TYPE_ID = '7df9f373-3707-478a-8a41-5fba5649ab17';
const CORPORATE_CASE_TYPE_ID = '846ba513-9af0-4957-a90f-4a039ec7e687';

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('case_type_required_documents', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.literal('uuid_generate_v4()'),
    },
    case_type_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'case_types', key: 'id' },
      onDelete: 'CASCADE',
    },
    code: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    label: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    allowed_mime: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: ['application/pdf'],
    },
    required: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    sort_order: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()'),
    },
  });

  await queryInterface.addIndex('case_type_required_documents', ['case_type_id', 'sort_order'], {
    name: 'case_type_required_docs_case_type_sort_idx',
  });

  await queryInterface.addIndex('case_type_required_documents', ['case_type_id', 'code'], {
    unique: true,
    name: 'case_type_required_docs_case_type_code_uniq',
  });

  await queryInterface.bulkInsert('case_type_required_documents', [
    {
      case_type_id: CRIMINAL_CASE_TYPE_ID,
      code: 'defendant_history',
      label: 'Defendant history',
      description: 'Prior legal or background history of the accused.',
      allowed_mime: ['application/pdf'],
      required: true,
      sort_order: 1,
      created_at: new Date(),
    },
    {
      case_type_id: CRIMINAL_CASE_TYPE_ID,
      code: 'accusation_summary',
      label: 'Accusation summary',
      description: 'Detailed summary of alleged offense and sections invoked.',
      allowed_mime: ['application/pdf'],
      required: true,
      sort_order: 2,
      created_at: new Date(),
    },
    {
      case_type_id: CRIMINAL_CASE_TYPE_ID,
      code: 'accused_pan',
      label: 'PAN of accused',
      description: 'PAN document for identity verification.',
      allowed_mime: ['application/pdf', 'image/png', 'image/jpeg'],
      required: true,
      sort_order: 3,
      created_at: new Date(),
    },
    {
      case_type_id: CRIMINAL_CASE_TYPE_ID,
      code: 'supporting_evidence',
      label: 'Supporting evidence dossier',
      description: 'Primary evidence packet for the hearing.',
      allowed_mime: ['application/pdf'],
      required: true,
      sort_order: 4,
      created_at: new Date(),
    },
    {
      case_type_id: DIVORCE_CASE_TYPE_ID,
      code: 'marriage_certificate',
      label: 'Marriage certificate',
      description: 'Official marriage registration or certificate copy.',
      allowed_mime: ['application/pdf', 'image/png', 'image/jpeg'],
      required: true,
      sort_order: 1,
      created_at: new Date(),
    },
    {
      case_type_id: DIVORCE_CASE_TYPE_ID,
      code: 'grounds_affidavit',
      label: 'Grounds affidavit',
      description: 'Affidavit describing grounds for divorce petition.',
      allowed_mime: ['application/pdf'],
      required: true,
      sort_order: 2,
      created_at: new Date(),
    },
    {
      case_type_id: DIVORCE_CASE_TYPE_ID,
      code: 'financial_disclosure',
      label: 'Financial disclosure',
      description: 'Income/assets statement for settlement consideration.',
      allowed_mime: ['application/pdf'],
      required: true,
      sort_order: 3,
      created_at: new Date(),
    },
    {
      case_type_id: CIVIL_CASE_TYPE_ID,
      code: 'plaint_document',
      label: 'Plaint / petition',
      description: 'Main civil petition/plaint for filing.',
      allowed_mime: ['application/pdf'],
      required: true,
      sort_order: 1,
      created_at: new Date(),
    },
    {
      case_type_id: CIVIL_CASE_TYPE_ID,
      code: 'cause_of_action_note',
      label: 'Cause of action note',
      description: 'Chronology and material facts supporting claim.',
      allowed_mime: ['application/pdf'],
      required: true,
      sort_order: 2,
      created_at: new Date(),
    },
    {
      case_type_id: CIVIL_CASE_TYPE_ID,
      code: 'supporting_annexures',
      label: 'Supporting annexures',
      description: 'Contract, notice, correspondence, and exhibits.',
      allowed_mime: ['application/pdf'],
      required: true,
      sort_order: 3,
      created_at: new Date(),
    },
    {
      case_type_id: PROPERTY_CASE_TYPE_ID,
      code: 'title_deed',
      label: 'Title deed documents',
      description: 'Ownership and title chain records.',
      allowed_mime: ['application/pdf'],
      required: true,
      sort_order: 1,
      created_at: new Date(),
    },
    {
      case_type_id: PROPERTY_CASE_TYPE_ID,
      code: 'encumbrance_certificate',
      label: 'Encumbrance certificate',
      description: 'EC and lien details for the property.',
      allowed_mime: ['application/pdf'],
      required: true,
      sort_order: 2,
      created_at: new Date(),
    },
    {
      case_type_id: PROPERTY_CASE_TYPE_ID,
      code: 'site_plan',
      label: 'Property site plan',
      description: 'Approved map/site plan where applicable.',
      allowed_mime: ['application/pdf', 'image/png', 'image/jpeg'],
      required: true,
      sort_order: 3,
      created_at: new Date(),
    },
    {
      case_type_id: CORPORATE_CASE_TYPE_ID,
      code: 'board_resolution',
      label: 'Board resolution',
      description: 'Resolution authorizing legal action.',
      allowed_mime: ['application/pdf'],
      required: true,
      sort_order: 1,
      created_at: new Date(),
    },
    {
      case_type_id: CORPORATE_CASE_TYPE_ID,
      code: 'incorporation_docs',
      label: 'Incorporation documents',
      description: 'COI, MOA, AOA and registration records.',
      allowed_mime: ['application/pdf'],
      required: true,
      sort_order: 2,
      created_at: new Date(),
    },
    {
      case_type_id: CORPORATE_CASE_TYPE_ID,
      code: 'compliance_record',
      label: 'Compliance record',
      description: 'Recent statutory compliance summary relevant to matter.',
      allowed_mime: ['application/pdf'],
      required: true,
      sort_order: 3,
      created_at: new Date(),
    },
  ]);
}

export async function down(queryInterface) {
  await queryInterface.removeIndex('case_type_required_documents', 'case_type_required_docs_case_type_code_uniq');
  await queryInterface.removeIndex('case_type_required_documents', 'case_type_required_docs_case_type_sort_idx');
  await queryInterface.dropTable('case_type_required_documents');
}

export default { up, down };
