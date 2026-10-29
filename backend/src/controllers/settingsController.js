import { settingsRepo } from '../repositories/settingsRepo.js';
import { logger } from '../middleware/logger.js';

export const settingsController = {
  async getSettings(req, res) {
    try {
      const settings = await settingsRepo.getSettings();
      return res.json({ success: true, settings });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to retrieve canteen settings.' });
    }
  },

  async updateSettings(req, res) {
    try {
      const updates = req.body;
      const updated = await settingsRepo.updateSettings(updates);
      logger.info('Owner updated canteen operational settings');
      return res.json({
        success: true,
        message: 'Canteen settings updated successfully.',
        settings: updated
      });
    } catch (err) {
      logger.error('Failed to update canteen settings:', { error: err.message });
      return res.status(500).json({ success: false, error: 'Failed to update settings.' });
    }
  }
};
