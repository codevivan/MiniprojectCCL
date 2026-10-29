import express from 'express';
import { suggestionController } from '../controllers/suggestionController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, requireRole('STUDENT'), suggestionController.submitSuggestion);
router.get('/my', authenticate, requireRole('STUDENT'), suggestionController.getMySuggestions);

// Owner review
router.get('/', authenticate, requireRole('OWNER'), suggestionController.getAllSuggestions);
router.patch('/:id/status', authenticate, requireRole('OWNER'), suggestionController.updateStatus);

export default router;
