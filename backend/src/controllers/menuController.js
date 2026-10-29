import { v4 as uuidv4 } from 'uuid';
import { menuRepo } from '../repositories/menuRepo.js';
import { logger } from '../middleware/logger.js';

export const menuController = {
  async getMenu(req, res) {
    try {
      const { category, availableOnly, search } = req.query || {};
      const cleanCategory = (category && category !== 'undefined' && category !== 'null' && category.toUpperCase() !== 'ALL')
        ? category.trim()
        : undefined;

      const cleanSearch = (search && search !== 'undefined' && search !== 'null')
        ? search.trim()
        : '';

      const items = await menuRepo.getAll({
        category: cleanCategory,
        availableOnly: availableOnly === 'true',
        search: cleanSearch
      });

      return res.json({
        success: true,
        count: items.length,
        items
      });
    } catch (err) {
      logger.error('Failed to fetch menu:', { error: err.message });
      return res.status(500).json({ success: false, error: 'Failed to fetch menu items.' });
    }
  },

  async getCategories(req, res) {
    try {
      const categories = await menuRepo.getCategories();
      return res.json({
        success: true,
        categories
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to fetch menu categories.' });
    }
  },

  async getItem(req, res) {
    try {
      const { id } = req.params;
      const item = await menuRepo.getById(id);
      if (!item) {
        return res.status(404).json({ success: false, error: 'Menu item not found.' });
      }
      return res.json({ success: true, item });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to fetch menu item.' });
    }
  },

  async createItem(req, res) {
    try {
      const { name, description, category, price, imageUrl, isAvailable, prepTimeMinutes } = req.body;

      if (!name || !category || price === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Item name, category, and price are required.'
        });
      }

      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({
          success: false,
          error: 'Price must be a valid non-negative number.'
        });
      }

      const itemId = `item_${uuidv4().replace(/-/g, '').slice(0, 10)}`;
      const newItem = await menuRepo.create({
        itemId,
        name,
        description,
        category,
        price: numPrice,
        imageUrl,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        prepTimeMinutes: prepTimeMinutes ? Number(prepTimeMinutes) : 10
      });

      logger.info(`Owner created new menu item: ${newItem.name} (₹${newItem.price})`);

      return res.status(201).json({
        success: true,
        message: 'Menu item created successfully.',
        item: newItem
      });
    } catch (err) {
      logger.error('Failed to create menu item:', { error: err.message });
      return res.status(500).json({ success: false, error: 'Failed to create menu item.' });
    }
  },

  async updateItem(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const existing = await menuRepo.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Item not found.' });
      }

      const updated = await menuRepo.update(id, updates);
      logger.info(`Owner updated menu item: ${updated.name}`);

      return res.json({
        success: true,
        message: 'Menu item updated successfully.',
        item: updated
      });
    } catch (err) {
      logger.error('Failed to update menu item:', { error: err.message });
      return res.status(500).json({ success: false, error: 'Failed to update menu item.' });
    }
  },

  async deleteItem(req, res) {
    try {
      const { id } = req.params;
      const existing = await menuRepo.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Item not found.' });
      }

      await menuRepo.delete(id);
      logger.info(`Owner deleted menu item: ${id} (${existing.name})`);

      return res.json({
        success: true,
        message: 'Menu item deleted successfully.'
      });
    } catch (err) {
      logger.error('Failed to delete menu item:', { error: err.message });
      return res.status(500).json({ success: false, error: 'Failed to delete menu item.' });
    }
  }
};
