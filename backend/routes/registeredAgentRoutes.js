import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireTier } from '../middleware/tierMiddleware.js';
import { RegisteredAgent } from '../models/index.js';

const router = Router();

const AGENT_ADDRESSES = {
  maharashtra: 'NextGenLegal Registered Office, 4th Floor, Hiranandani Business Park, Powai, Mumbai 400076, Maharashtra',
  delhi: 'NextGenLegal Registered Office, B-12, Connaught Place, New Delhi 110001',
  karnataka: 'NextGenLegal Registered Office, 2nd Floor, Brigade Gateway, Rajajinagar, Bengaluru 560055, Karnataka',
  default: 'NextGenLegal Registered Office, Regus Business Centre, BKC, Mumbai 400051, Maharashtra',
};

router.post('/signup', authMiddleware, requireTier('business'), async (req, res, next) => {
  try {
    const { business_name, entity_type, registration_number, registered_state, notifications_email } = req.body;
    if (!business_name || !registered_state || !notifications_email) {
      return next({ statusCode: 400, message: 'business_name, registered_state, and notifications_email are required' });
    }
    const existing = await RegisteredAgent.findOne({ where: { user_id: req.user.id, status: 'active' } });
    if (existing) return next({ statusCode: 409, message: 'You already have an active registered agent' });

    const stateKey = registered_state.toLowerCase().replace(/\s/g, '');
    const agent_address = AGENT_ADDRESSES[stateKey] || AGENT_ADDRESSES.default;

    const agent = await RegisteredAgent.create({
      user_id: req.user.id,
      business_name, entity_type, registration_number,
      registered_state, agent_address, notifications_email,
      status: 'active',
    });
    res.status(201).json({ success: true, data: agent });
  } catch (err) { next(err); }
});

router.get('/status', authMiddleware, async (req, res, next) => {
  try {
    const agent = await RegisteredAgent.findOne({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: agent || null });
  } catch (err) { next(err); }
});

router.put('/update', authMiddleware, async (req, res, next) => {
  try {
    const agent = await RegisteredAgent.findOne({ where: { user_id: req.user.id, status: 'active' } });
    if (!agent) return next({ statusCode: 404, message: 'No active registered agent found' });
    const { notifications_email } = req.body;
    if (notifications_email) await agent.update({ notifications_email });
    res.json({ success: true, data: agent });
  } catch (err) { next(err); }
});

export default router;
