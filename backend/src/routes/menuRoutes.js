import express from 'express';
import { menuController } from '../controllers/menuController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', menuController.getMenu);
router.get('/categories', menuController.getCategories);
router.get('/:id', menuController.getItem);

// Owner-protected routes
router.post('/', authenticate, requireRole('OWNER'), menuController.createItem);
router.put('/:id', authenticate, requireRole('OWNER'), menuController.updateItem);
router.delete('/:id', authenticate, requireRole('OWNER'), menuController.deleteItem);

export default router;
