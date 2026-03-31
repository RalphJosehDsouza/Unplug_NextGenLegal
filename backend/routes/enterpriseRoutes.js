import { Router } from 'express';
import { EnterpriseLead } from '../models/index.js';

const router = Router();

// Public endpoint — no auth required
router.post('/contact', async (req, res, next) => {
  try {
    const { company_name, contact_name, email, phone, employee_count, message } = req.body;
    if (!company_name || !contact_name || !email) {
      return next({ statusCode: 400, message: 'company_name, contact_name, and email are required' });
    }
    const lead = await EnterpriseLead.create({
      company_name, contact_name, email, phone,
      employee_count: parseInt(employee_count) || null,
      message,
    });
    res.status(201).json({ success: true, data: { id: lead.id }, message: 'Thank you! We will contact you within 24 hours.' });
  } catch (err) { next(err); }
});

export default router;
