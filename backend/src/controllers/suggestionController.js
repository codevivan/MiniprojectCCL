import { v4 as uuidv4 } from 'uuid';
import { suggestionRepo } from '../repositories/suggestionRepo.js';
import { logger } from '../middleware/logger.js';

export const suggestionController = {
  async submitSuggestion(req, res) {
    try {
      const student = req.user;
      const { category, subject, description, rating } = req.body;

      if (!category || !subject || !description) {
        return res.status(400).json({
          success: false,
          error: 'Category, subject, and description are required.'
        });
      }

      const suggestionId = `sug_${uuidv4().replace(/-/g, '').slice(0, 10)}`;
      const newSuggestion = await suggestionRepo.create({
        suggestionId,
        studentId: student.userId,
        studentName: student.name,
        studentEmail: student.email,
        category,
        subject,
        description,
        rating
      });

      logger.info(`New student suggestion submitted by ${student.name} (${student.email}): [${category}] ${subject}`);

      return res.status(201).json({
        success: true,
        message: 'Thank you! Your suggestion has been submitted to the canteen management.',
        suggestion: newSuggestion
      });
    } catch (err) {
      logger.error('Failed to submit suggestion:', { error: err.message });
      return res.status(500).json({ success: false, error: 'Failed to submit suggestion.' });
    }
  },

  async getMySuggestions(req, res) {
    try {
      const suggestions = await suggestionRepo.getStudentSuggestions(req.user.userId);
      return res.json({
        success: true,
        count: suggestions.length,
        suggestions
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to fetch your suggestions.' });
    }
  },

  async getAllSuggestions(req, res) {
    try {
      const { status, category } = req.query;
      const suggestions = await suggestionRepo.getAll({ status, category });
      return res.json({
        success: true,
        count: suggestions.length,
        suggestions
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to fetch suggestions.' });
    }
  },

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, adminResponse } = req.body;

      if (!['NEW', 'REVIEWED', 'IMPLEMENTED'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status. Must be NEW, REVIEWED, or IMPLEMENTED.'
        });
      }

      const updated = await suggestionRepo.updateStatus(id, status, adminResponse);
      logger.info(`Owner updated suggestion ${id} to ${status}`);

      return res.json({
        success: true,
        message: 'Suggestion status updated.',
        suggestion: updated
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to update suggestion status.' });
    }
  }
};
