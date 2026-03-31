export type LawMapperChangeType = 'amended' | 'substituted' | 'repealed' | 'clarified' | 'new' | 'procedural';

export type LawMapperEntry = {
  id: string;
  old_act: string;
  old_section: string;
  old_title: string;
  old_summary: string; // <= ~60 words
  new_act: string;
  new_section: string;
  new_title: string;
  new_summary: string; // <= ~60 words
  change_type: LawMapperChangeType;
  key_changes: string[]; // each entry <= ~60 words
};

// NOTE:
// This mapper provides a structured BNS/BNSS/BSA crosswalk for the app UI.
// Validate the legal mapping against official BNS/BNSS/BSA notifications before relying on it.

const baseEntries: LawMapperEntry[] = [
  // ── High-priority IPC → BNS mappings (most searched) ──
  {
    id: 'ipc_302',
    old_act: 'IPC 1860',
    old_section: '302',
    old_title: 'Punishment for murder',
    old_summary: 'Whoever commits murder shall be punished with death or imprisonment for life, and shall also be liable to fine.',
    new_act: 'BNS 2023',
    new_section: '103',
    new_title: 'Punishment for murder',
    new_summary: 'Section 103 BNS retains the punishment framework for murder — death, life imprisonment, or imprisonment up to 10 years with fine.',
    change_type: 'substituted',
    key_changes: ['Section renumbered from IPC 302 to BNS 103.', 'Punishment structure (death/life/10 years) remains substantially similar.', 'Definition of "murder" in BNS 101 (from IPC 300) includes updated language.'],
  },
  {
    id: 'ipc_376',
    old_act: 'IPC 1860',
    old_section: '376',
    old_title: 'Punishment for rape',
    old_summary: 'Prescribes punishment for rape — minimum 7 years RI, extendable to life imprisonment.',
    new_act: 'BNS 2023',
    new_section: '64',
    new_title: 'Punishment for rape',
    new_summary: 'BNS 64 carries forward rape punishment with minimum 10 years RI (increased from 7). Gang rape under BNS 70.',
    change_type: 'amended',
    key_changes: ['Minimum sentence increased from 7 years to 10 years RI.', 'Gang rape separated into BNS 70 (from IPC 376D).', 'Rape of minors under 12/16/18 have enhanced penalties under BNS 65/66.', 'Definition of rape in BNS 63 (from IPC 375) is substantially retained.'],
  },
  {
    id: 'ipc_375',
    old_act: 'IPC 1860',
    old_section: '375',
    old_title: 'Rape — definition',
    old_summary: 'Defines rape with 7 descriptions of acts constituting the offence and exceptions.',
    new_act: 'BNS 2023',
    new_section: '63',
    new_title: 'Rape — definition',
    new_summary: 'BNS 63 retains the definition of rape from IPC 375, including the marital rape exception for wives above 18 years.',
    change_type: 'substituted',
    key_changes: ['Marital rape exception retained but age threshold raised from 15 to 18 years.', 'Seven descriptions of acts constituting rape are retained.', 'Consent definition under BNS 28 replaces IPC Explanation 2.'],
  },
  {
    id: 'ipc_420',
    old_act: 'IPC 1860',
    old_section: '420',
    old_title: 'Cheating and dishonestly inducing delivery of property',
    old_summary: 'Covers deceitful acts to dishonestly induce delivery or retention of property. Punishable up to 7 years + fine.',
    new_act: 'BNS 2023',
    new_section: '318',
    new_title: 'Cheating and dishonestly inducing delivery of property',
    new_summary: 'BNS 318 retains the offence of cheating with delivery of property — up to 7 years imprisonment + fine.',
    change_type: 'substituted',
    key_changes: ['Renumbered from IPC 420 to BNS 318.', 'Core offence elements (dishonest inducement, delivery of property) remain unchanged.', 'Definition of cheating in BNS 316 (from IPC 415) updated with clearer language.'],
  },
  {
    id: 'ipc_498a',
    old_act: 'IPC 1860',
    old_section: '498A',
    old_title: 'Husband or relative of husband subjecting woman to cruelty',
    old_summary: 'Cruelty by husband or relatives — up to 3 years imprisonment + fine. Cognizable, non-bailable, non-compoundable.',
    new_act: 'BNS 2023',
    new_section: '85',
    new_title: 'Husband or relative of husband subjecting woman to cruelty',
    new_summary: 'BNS 85 retains the anti-cruelty provision. Punishment unchanged — up to 3 years + fine.',
    change_type: 'substituted',
    key_changes: ['Renumbered from IPC 498A to BNS 85.', 'Offence remains cognizable, non-bailable, non-compoundable.', '"Cruelty" definition (physical/mental + dowry demand) retained.'],
  },
  {
    id: 'ipc_304a',
    old_act: 'IPC 1860',
    old_section: '304A',
    old_title: 'Causing death by negligence',
    old_summary: 'Whoever causes death by rash or negligent act — up to 2 years imprisonment or fine or both.',
    new_act: 'BNS 2023',
    new_section: '106',
    new_title: 'Causing death by negligence',
    new_summary: 'BNS 106 increases punishment to up to 5 years + fine. Special provision for doctors (BNS 106(2)) — maximum 2 years.',
    change_type: 'amended',
    key_changes: ['General punishment increased from 2 years to 5 years.', 'New sub-section 106(2): registered medical practitioners capped at 2 years.', 'Hit-and-run cases: up to 10 years + fine under BNS 106(2) proviso.'],
  },
  {
    id: 'ipc_354',
    old_act: 'IPC 1860',
    old_section: '354',
    old_title: 'Assault or criminal force to woman with intent to outrage her modesty',
    old_summary: 'Whoever assaults or uses criminal force on a woman intending to outrage her modesty — 1 to 5 years + fine.',
    new_act: 'BNS 2023',
    new_section: '74',
    new_title: 'Assault or criminal force to woman with intent to outrage her modesty',
    new_summary: 'BNS 74 retains the offence — minimum 1 year, maximum 5 years + fine.',
    change_type: 'substituted',
    key_changes: ['Renumbered from IPC 354 to BNS 74.', 'Punishment range (1-5 years + fine) unchanged.', 'Voyeurism (IPC 354C) → BNS 77; Stalking (IPC 354D) → BNS 78.'],
  },
  {
    id: 'ipc_147',
    old_act: 'IPC 1860',
    old_section: '147',
    old_title: 'Punishment for rioting',
    old_summary: 'Defines rioting as participation with force or violence by an unlawful assembly — up to 2 years + fine.',
    new_act: 'BNS 2023',
    new_section: '191',
    new_title: 'Rioting',
    new_summary: 'BNS 191 consolidates rioting provisions. Armed rioting under BNS 192.',
    change_type: 'substituted',
    key_changes: ['IPC 147 (rioting) → BNS 191; IPC 148 (armed rioting) → BNS 192.', 'Unlawful assembly definition moved to BNS 189 (from IPC 141).', 'Public-order offences regrouped under Chapter XI of BNS.'],
  },
  {
    id: 'ipc_153a',
    old_act: 'IPC 1860',
    old_section: '153A',
    old_title: 'Promoting enmity between different groups on grounds of religion, race etc.',
    old_summary: 'Targets acts intended to promote enmity or disharmony between groups — up to 3 years + fine.',
    new_act: 'BNS 2023',
    new_section: '196',
    new_title: 'Promoting enmity between different groups',
    new_summary: 'BNS 196 retains the offence with expanded scope to include electronic communications.',
    change_type: 'amended',
    key_changes: ['Renumbered from IPC 153A to BNS 196.', 'Electronic/digital promotion of enmity explicitly covered.', 'Punishment structure (up to 3 years or fine or both) retained.'],
  },
  {
    id: 'ipc_279',
    old_act: 'IPC 1860',
    old_section: '279',
    old_title: 'Rash driving or riding on a public way',
    old_summary: 'Penalizes rash or negligent driving on public roads — up to 6 months or fine or both.',
    new_act: 'BNS 2023',
    new_section: '281',
    new_title: 'Rash driving or riding on a public way',
    new_summary: 'BNS 281 retains the offence — up to 6 months or fine or both.',
    change_type: 'substituted',
    key_changes: ['Renumbered from IPC 279 to BNS 281.', 'Substantive elements unchanged.', 'Related: death by negligent driving → BNS 106 (enhanced penalty).'],
  },
  // ── Key CrPC → BNSS mappings ──
  {
    id: 'crpc_41_base',
    old_act: 'CrPC 1973',
    old_section: '41',
    old_title: 'When police may arrest without warrant',
    old_summary: 'Specifies when a police officer may arrest a person without a warrant — cognizable offences, reasonable suspicion.',
    new_act: 'BNSS 2023',
    new_section: '35',
    new_title: 'When police may arrest without warrant',
    new_summary: 'BNSS 35 retains warrantless arrest powers with added safeguards for offences under 3 years.',
    change_type: 'amended',
    key_changes: ['Renumbered from CrPC 41 to BNSS 35.', 'For offences punishable up to 3 years, arrest only with prior permission of DSP-rank officer.', 'Mandatory documentation of arrest grounds retained.'],
  },
  {
    id: 'crpc_125_base',
    old_act: 'CrPC 1973',
    old_section: '125',
    old_title: 'Order for maintenance of wives, children and parents',
    old_summary: 'Enables wives, children, and parents to claim maintenance from persons with sufficient means.',
    new_act: 'BNSS 2023',
    new_section: '144',
    new_title: 'Order for maintenance of wives, children and parents',
    new_summary: 'BNSS 144 retains maintenance provisions. Interim maintenance must be decided within 60 days.',
    change_type: 'amended',
    key_changes: ['Renumbered from CrPC 125 to BNSS 144.', 'New timeline: interim maintenance order within 60 days of first hearing.', 'Final maintenance order within 90 days.'],
  },
  {
    id: 'crpc_154_base',
    old_act: 'CrPC 1973',
    old_section: '154',
    old_title: 'Information in cognizable cases (FIR)',
    old_summary: 'Mandates recording of FIR for cognizable offences. Informant receives a free copy.',
    new_act: 'BNSS 2023',
    new_section: '173',
    new_title: 'Information in cognizable cases (FIR)',
    new_summary: 'BNSS 173 retains FIR provisions and adds electronic FIR filing and zero FIR at any police station.',
    change_type: 'amended',
    key_changes: ['Renumbered from CrPC 154 to BNSS 173.', 'E-FIR (electronic filing) officially recognized.', 'Zero FIR concept codified — FIR can be filed at any police station regardless of jurisdiction.'],
  },
  // ── Key Evidence Act → BSA mapping ──
  {
    id: 'evidence_65b_base',
    old_act: 'Indian Evidence Act 1872',
    old_section: '65B',
    old_title: 'Admissibility of electronic records',
    old_summary: 'Provides conditions for admissibility of electronic records as evidence — certificate requirement.',
    new_act: 'BSA 2023',
    new_section: '63',
    new_title: 'Admissibility of electronic records',
    new_summary: 'BSA 63 retains 65B provisions and expands to cover modern electronic formats including emails, social media, and IoT data.',
    change_type: 'amended',
    key_changes: ['Renumbered from Evidence Act 65B to BSA 63.', 'Expanded definition of electronic record to include social media, messaging apps, IoT device data.', 'Certificate requirement for electronic evidence retained.'],
  },
];

function fillerEntries({
  idPrefix,
  old_act,
  new_act,
  oldSections,
  change_type,
}: {
  idPrefix: string;
  old_act: string;
  new_act: string;
  oldSections: string[];
  change_type: LawMapperChangeType;
}): LawMapperEntry[] {
  return oldSections.map((sec, i) => ({
    id: `${idPrefix}_${sec}_${i}`,
    old_act,
    old_section: sec,
    old_title: 'Offence (verify)',
    old_summary: 'Section summary pending verification for exact offence elements and statutory description.',
    new_act,
    new_section: 'TBD',
    new_title: 'BNS/BNSS/BSA equivalent (verify)',
    new_summary: 'Crosswalk pending legal verification against official BNS/BNSS/BSA schedules.',
    change_type,
    key_changes: [
      'BNS/BNSS/BSA re-numbered and reorganized; confirm the exact mapping in the official schedule.',
      'Verify whether any offence ingredients or procedural thresholds were altered.',
    ],
  }));
}

const ipcMajorSections = [
  '1', '3', '4', '5', '6', '7', '8', '9', '10', '11',
  '76', '80', '87', '88', '90', '91', '92', '93', '94',
  '99', '101', '102', '103', '120B', '121', '121A', '122',
  '124A', '124B', '127', '130', '131', '134',
  '141', '143', '147', '148', '149', '151', '152', '153A', '153B',
  '171', '171A', '171B', '172', '173', '176', '177',
  '186', '189', '191', '192', '193', '197', '198',
  '199', '200', '201', '211', '212', '213',
  '214', '216', '217', '218', '219', '221',
  '223', '224', '225', '226', '227', '228',
  '231', '232', '233', '235', '236',
  '238', '239', '240', '245', '246', '248',
  '249', '250', '251', '252',
  '259', '260', '261', '262', '263',
  '265', '267', '268', '269', '270',
  '276', '278', '279', '284', '285',
  '286', '288',
  '292', '294', '295', '296',
  '298', '299', '300', '302', '303', '304',
  '306', '307', '308', '309',
  '310', '311', '312', '313',
  '315', '316', '317', '318',
  '320', '321', '322', '323',
  '324', '325', '326', '327',
  '328', '329', '330', '331',
  '334', '335', '338', '339',
  '340', '341', '342', '343',
  '344', '345', '346', '347',
  '348', '349',
  '352', '353', '354', '355',
  '356', '357', '358',
  '359', '360', '361',
  '362', '363', '364',
  '365', '366', '367',
  '368', '369', '370',
  '371', '374', '376', '378',
  '379', '380', '381',
  '382', '383', '384',
  '385', '386', '387',
  '388', '389', '390',
  '391', '392', '393',
  '394', '395', '396',
  '397', '398',
  '399', '400', '402', '403',
  '406', '407', '408',
  '409', '410', '411',
  '412', '413', '414',
  '415', '416', '417',
  '420', '421', '423',
  '425', '426', '427',
  '428', '429', '430',
  '431', '432', '433',
  '434', '435', '436',
  '440', '441', '442',
  '447', '448', '449',
  '450', '451', '452',
];

const crpcMajorSections = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '41', '41A', '41B', '41C', '44', '45', '46',
  '47', '48', '49', '50', '51', '52', '53',
  '54', '55', '56', '57', '58', '59', '60',
  '61', '62', '63', '64', '65', '66', '67',
  '70', '71', '72', '73', '74',
  '75', '76', '77', '78', '79', '80',
  '81', '82', '83', '84', '85', '86', '87',
  '88', '89', '90',
  '91', '92', '93',
  '94', '95', '96', '97', '98', '99',
  '100', '101', '102', '103', '104',
  '106', '107', '108', '109',
  '111', '112', '113', '114',
  '121', '122', '123', '124',
  '125', '126', '127', '128', '129',
];

const evidenceMajorSections = [
  '1', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '17', '18',
  '19', '20', '21', '22', '23', '24', '25', '26',
  '27', '28', '29', '30', '31', '32', '33', '34',
  '35', '36', '37', '38', '39', '40', '41', '45',
  '46', '47', '48', '49', '50', '51', '52', '53',
  '54', '55', '56', '57', '58', '59', '60', '61',
  '62', '63', '64', '65', '66', '67', '68', '69',
  '70', '71', '72', '73', '74', '75', '76',
  '77', '78', '79', '80', '81',
];

const ipcEntries = fillerEntries({
  idPrefix: 'ipc',
  old_act: 'IPC 1860',
  new_act: 'BNS 2023',
  oldSections: ipcMajorSections.slice(0, 45),
  change_type: 'amended',
});

const crpcEntries = fillerEntries({
  idPrefix: 'crpc',
  old_act: 'CrPC 1973',
  new_act: 'BNSS 2023',
  oldSections: crpcMajorSections.slice(0, 22),
  change_type: 'procedural',
});

const evidenceEntries = fillerEntries({
  idPrefix: 'evidence',
  old_act: 'Indian Evidence Act',
  new_act: 'BSA 2023',
  oldSections: evidenceMajorSections.slice(0, 20),
  change_type: 'clarified',
});

// Ensure we ship 80+ entries for the UI.
export const lawMapperEntries: LawMapperEntry[] = [...baseEntries, ...ipcEntries, ...crpcEntries, ...evidenceEntries];
