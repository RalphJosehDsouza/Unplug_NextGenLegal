import { Router } from 'express';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    return res.json({ success: true, data: { message: 'Docs API placeholder' } });
  } catch (err) {
    return next(err);
  }
});

export default router;

