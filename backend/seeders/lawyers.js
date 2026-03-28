import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const now = () => new Date();

function uuid() {
  return crypto.randomUUID();
}

const LAWYERS = [
  {
    email: 'adv.aisha.singh@nextgenlegal.in',
    full_name: 'Adv. Aisha Singh',
    phone: '9810012345',
    city: 'New Delhi',
    state: 'Delhi',
    bar_council_id: 'DL/BC/2016/20419',
    specialization: ['corporate', 'partnership_deed', 'employment_contract'],
    languages: ['English', 'Hindi'],
    rate_inr: 12000,
    bio: 'Corporate counsel focusing on partnerships, employment structuring, and compliance-ready contracting.',
    calendly_url: 'https://calendly.com/adv-aisha-singh/consult',
  },
  {
    email: 'adv.rahul.sharma@nextgenlegal.in',
    full_name: 'Adv. Rahul Sharma',
    phone: '9872210198',
    city: 'Mumbai',
    state: 'Maharashtra',
    bar_council_id: 'MH/BC/2012/11307',
    specialization: ['property', 'rental_agreement'],
    languages: ['English', 'Hindi', 'Marathi'],
    rate_inr: 9000,
    bio: 'Property and tenancy specialist advising landlords and tenants on documentation, disputes, and recoveries.',
    calendly_url: 'https://calendly.com/rahul-sharma/legal',
  },
  {
    email: 'adv.neha.kapoor@nextgenlegal.in',
    full_name: 'Adv. Neha Kapoor',
    phone: '9920023344',
    city: 'Pune',
    state: 'Maharashtra',
    bar_council_id: 'MH/BC/2018/30192',
    specialization: ['family', 'affidavit', 'power_of_attorney'],
    languages: ['English', 'Hindi', 'Marathi'],
    rate_inr: 8500,
    bio: 'Family law practitioner with a focus on affidavits, POA documentation, and dispute-friendly settlements.',
    calendly_url: 'https://calendly.com/neha-kapoor/appointment',
  },
  {
    email: 'adv.vikram.patil@nextgenlegal.in',
    full_name: 'Adv. Vikram Patil',
    phone: '9004123771',
    city: 'Nagpur',
    state: 'Maharashtra',
    bar_council_id: 'MH/BC/2014/15980',
    specialization: ['criminal', 'affidavit'],
    languages: ['English', 'Hindi', 'Marathi'],
    rate_inr: 10000,
    bio: 'Criminal defence counsel handling FIRs, anticipatory matters, and affidavit-based submissions.',
    calendly_url: 'https://calendly.com/vikram-patil/consult',
  },
  {
    email: 'adv.sneha.joshi@nextgenlegal.in',
    full_name: 'Adv. Sneha Joshi',
    phone: '9445018872',
    city: 'Bengaluru',
    state: 'Karnataka',
    bar_council_id: 'KA/BC/2017/88451',
    specialization: ['GST', 'corporate', 'employment_contract'],
    languages: ['English', 'Kannada', 'Hindi'],
    rate_inr: 14000,
    bio: 'GST and corporate advisory with practical structuring for invoicing, compliance timelines, and audits.',
    calendly_url: 'https://calendly.com/sneha-joshi/gst-corporate',
  },
  {
    email: 'adv.omar.khan@nextgenlegal.in',
    full_name: 'Adv. Omar Khan',
    phone: '9123445566',
    city: 'Hyderabad',
    state: 'Telangana',
    bar_council_id: 'TS/BC/2013/45011',
    specialization: ['property', 'nda', 'power_of_attorney'],
    languages: ['English', 'Hindi', 'Telugu'],
    rate_inr: 11000,
    bio: 'Cross-city contract drafting with emphasis on NDAs and POA documentation for transactions.',
    calendly_url: 'https://calendly.com/omar-khan/transactions',
  },
  {
    email: 'adv.soumya.menon@nextgenlegal.in',
    full_name: 'Adv. Soumya Menon',
    phone: '7012348899',
    city: 'Mysuru',
    state: 'Karnataka',
    bar_council_id: 'KA/BC/2015/61320',
    specialization: ['family', 'rental_agreement', 'affidavit'],
    languages: ['English', 'Kannada', 'Malayalam'],
    rate_inr: 7500,
    bio: 'Family and tenancy counsel helping clients with amicable resolutions and robust affidavits.',
    calendly_url: 'https://calendly.com/soumya-menon/legal',
  },
  {
    email: 'adv.charan.reddy@nextgenlegal.in',
    full_name: 'Adv. Charan Reddy',
    phone: '9988776655',
    city: 'Chennai',
    state: 'Tamil Nadu',
    bar_council_id: 'TN/BC/2011/22109',
    specialization: ['GST', 'partnership_deed', 'corporate'],
    languages: ['English', 'Hindi', 'Tamil'],
    rate_inr: 13000,
    bio: 'GST-focused corporate counsel supporting partnerships, filings, and documentation audits.',
    calendly_url: 'https://calendly.com/charan-reddy/gst',
  },
  {
    email: 'adv.priya.deshmukh@nextgenlegal.in',
    full_name: 'Adv. Priya Deshmukh',
    phone: '9090904545',
    city: 'Kolkata',
    state: 'West Bengal',
    bar_council_id: 'WB/BC/2019/78412',
    specialization: ['nda', 'employment_contract', 'corporate'],
    languages: ['English', 'Hindi', 'Bengali'],
    rate_inr: 10500,
    bio: 'Contract drafting specialist for NDAs and employment agreements with practical negotiation support.',
    calendly_url: 'https://calendly.com/priya-deshmukh/contracts',
  },
  {
    email: 'adv.arpit.batra@nextgenlegal.in',
    full_name: 'Adv. Arpit Batra',
    phone: '9600011223',
    city: 'Gurugram',
    state: 'Haryana',
    bar_council_id: 'HR/BC/2020/33008',
    specialization: ['criminal', 'affidavit', 'power_of_attorney'],
    languages: ['English', 'Hindi'],
    rate_inr: 9500,
    bio: 'Defence and documentation counsel handling affidavits and POA filings for time-sensitive matters.',
    calendly_url: 'https://calendly.com/arpit-batra/consult',
  },
];

export async function up(queryInterface, Sequelize) {
  const passwordHash = await bcrypt.hash('ChangeMe123!', 12);

  const usersRows = [];
  const lawyersRows = [];

  const createdAt = now();

  for (const l of LAWYERS) {
    const userId = uuid();
    const lawyerId = uuid();

    usersRows.push({
      id: userId,
      email: l.email,
      password_hash: passwordHash,
      full_name: l.full_name,
      phone: l.phone,
      role: 'lawyer',
      preferred_lang: 'en',
      aadhaar_verified: false,
      google_id: null,
      created_at: createdAt,
    });

    lawyersRows.push({
      id: lawyerId,
      user_id: userId,
      bar_council_id: l.bar_council_id,
      specialization: l.specialization,
      languages: l.languages,
      state: l.state,
      city: l.city,
      rate_per_hour: l.rate_inr * 100, // INR to paisa
      bio: l.bio,
      verified: true,
      calendly_url: l.calendly_url,
      created_at: createdAt,
    });
  }

  await queryInterface.bulkInsert('users', usersRows);
  await queryInterface.bulkInsert('lawyers', lawyersRows);
}

export async function down(queryInterface, Sequelize) {
  const emails = LAWYERS.map((l) => l.email);

  // Find the user IDs first so we can clean up lawyers deterministically.
  const [rows] = await queryInterface.sequelize.query(
    `SELECT id FROM users WHERE email = ANY(:emails)`,
    { replacements: { emails } },
  );

  const userIds = (rows || []).map((r) => r.id);

  if (userIds.length > 0) {
    await queryInterface.bulkDelete('lawyers', { user_id: userIds });
  }

  await queryInterface.bulkDelete('users', { email: emails });
}

export default { up, down };

