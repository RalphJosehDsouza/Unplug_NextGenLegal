import cron from 'node-cron';

import { TrackedCase } from '../models/index.js';
import { refreshTrackedCaseAndNotify } from '../controllers/ecourtsController.js';

export function startEcourtsTrackerCron() {
  cron.schedule(
    '0 7 * * *',
    async () => {
      try {
        const tracked = await TrackedCase.findAll();
        for (const trackedCase of tracked) {
          try {
            await refreshTrackedCaseAndNotify({ trackedCase });
          } catch {
            // Keep cron running if a single case fails.
          }
        }
      } catch {
        // Keep cron alive.
      }
    },
    { timezone: 'Asia/Kolkata' },
  );
}

