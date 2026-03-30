import axios from 'axios';
import { Lawyer, User } from '../models/index.js';

function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('Razorpay configuration missing');
  }
  return {
    headers: {
      Authorization: `Basic ${Buffer.from(keyId + ':' + keySecret).toString('base64')}`,
      'Content-Type': 'application/json',
    },
  };
}

export async function initiateKyc(req, res, next) {
  try {
    const userId = req.user.id;
    const { pan, street1, city, state, postal_code } = req.body;

    if (!pan || !street1 || !city || !state || !postal_code) {
      return next({ statusCode: 400, message: 'Missing required KYC fields' });
    }

    const lawyer = await Lawyer.findOne({
      where: { user_id: userId },
      include: [{ model: User, as: 'user' }],
    });

    if (!lawyer) {
      return next({ statusCode: 404, message: 'Lawyer profile not found' });
    }
    if (lawyer.kyc_status === 'verified') {
      return next({ statusCode: 400, message: 'KYC already verified' });
    }

    // Call Razorpay API: POST /v2/accounts
    try {
      const config = getRazorpayConfig();
      const payload = {
        email: lawyer.user.email,
        profile: {
          category: 'professional',
          subcategory: 'legal',
          addresses: {
            registered: {
              street1,
              city,
              state,
              postal_code,
              country: 'IN',
            },
          },
        },
        legal_info: {
          pan: pan,
        },
        type: 'route',
      };

      const { data } = await axios.post('https://api.razorpay.com/v2/accounts', payload, config);
      const accountId = data.id;

      lawyer.razorpay_linked_account_id = accountId;
      lawyer.kyc_status = 'submitted';
      await lawyer.save();

      return res.json({
        success: true,
        data: {
          account_id: accountId,
          next_step: 'add_bank_account',
        },
      });
    } catch (razorpayErr) {
      // Swallowing external errors intentionally for security.
      console.error('[kycController] Razorpay linked account error:', razorpayErr?.response?.data || razorpayErr.message);
      return next({ statusCode: 502, message: 'Payment provider error. Please try again.' });
    }
  } catch (err) {
    return next(err);
  }
}

export async function addBankAccount(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, ifsc, account_number } = req.body;

    if (!name || !ifsc || !account_number) {
      return next({ statusCode: 400, message: 'Missing required bank details' });
    }

    const lawyer = await Lawyer.findOne({
      where: { user_id: userId },
      include: [{ model: User, as: 'user' }],
    });

    if (!lawyer) {
      return next({ statusCode: 404, message: 'Lawyer profile not found' });
    }
    if (lawyer.kyc_status !== 'submitted' && lawyer.kyc_status !== 'verified') {
      return next({ statusCode: 400, message: 'Please complete KYC initiation first' });
    }

    try {
      const config = getRazorpayConfig();
      
      // 1. Create Contact
      const contactPayload = {
        name: lawyer.user.full_name || name,
        email: lawyer.user.email,
        type: 'vendor',
      };
      const contactResp = await axios.post('https://api.razorpay.com/v1/contacts', contactPayload, config);
      const contactId = contactResp.data.id;

      // 2. Create Fund Account
      const fundPayload = {
        account_type: 'bank_account',
        bank_account: {
          name,
          ifsc,
          account_number,
        },
        contact_id: contactId,
      };
      const fundAccountResp = await axios.post('https://api.razorpay.com/v1/fund_accounts', fundPayload, config);

      // 3. Best-effort: Create Route stakeholder + request product configuration.
      // These are optional for the platform payout flow we implement (payouts use fund_account_id),
      // but storing stakeholder/product ids helps align with Razorpay Route integration.
      try {
        const phoneDigits = String(lawyer.user.phone || '').replace(/\D/g, '');

        // Razorpay Route stakeholder payload expects a phone object and addresses object.
        const stakeholderPayload = {
          email: lawyer.user.email,
          percentage_ownership: 100,
          relationship: { director: false, executive: false },
          phone: {
            primary: phoneDigits,
            secondary: phoneDigits,
          },
          addresses: {
            residential: {
              street: 'N/A',
              city: lawyer.city,
              state: lawyer.state,
              postal_code: '000000',
              country: 'IN',
            },
          },
        };

        const stakeholderResp = await axios.post(
          `https://api.razorpay.com/v2/accounts/${lawyer.razorpay_linked_account_id}/stakeholders`,
          stakeholderPayload,
          config,
        );
        if (stakeholderResp?.data?.id) {
          lawyer.razorpay_stakeholder_id = stakeholderResp.data.id;
        }

        const productResp = await axios.post(
          `https://api.razorpay.com/v2/accounts/${lawyer.razorpay_linked_account_id}/products`,
          { product_name: 'route', tnc_accepted: true },
          config,
        );

        const productId = productResp?.data?.id;
        if (productId) {
          // Patch settlement account details for the requested product configuration.
          await axios.patch(
            `https://api.razorpay.com/v2/accounts/${lawyer.razorpay_linked_account_id}/products/${productId}`,
            { account_number, ifsc_code: ifsc, beneficiary_name: name },
            config,
          );
        }
      } catch (routeSetupErr) {
        // Do not block KYC completion if Route product/stakeholder setup fails.
        console.error('[kycController] Razorpay Route stakeholder/product setup failed:', routeSetupErr?.response?.data || routeSetupErr.message);
      }

      lawyer.razorpay_fund_account_id = fundAccountResp.data.id;
      lawyer.bank_account_verified = true;
      lawyer.kyc_status = 'verified';
      await lawyer.save();

      return res.json({
        success: true,
      });
    } catch (razorpayErr) {
      console.error('[kycController] Razorpay bank error:', razorpayErr?.response?.data || razorpayErr.message);
      return next({ statusCode: 502, message: 'Payment provider error. Please try again.' });
    }
  } catch (err) {
    return next(err);
  }
}

export async function getKycStatus(req, res, next) {
  try {
    const userId = req.user.id;
    const lawyer = await Lawyer.findOne({ where: { user_id: userId } });

    if (!lawyer) {
      return next({ statusCode: 404, message: 'Lawyer profile not found' });
    }

    return res.json({
      success: true,
      data: {
        kyc_status: lawyer.kyc_status,
        bank_account_verified: lawyer.bank_account_verified,
        razorpay_linked_account_id: lawyer.razorpay_linked_account_id,
      },
    });
  } catch (err) {
    return next(err);
  }
}
