import { 
  GetCommand, 
  PutCommand, 
  ScanCommand, 
  UpdateCommand, 
  DeleteCommand 
} from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from './dynamoClient.js';
import { config } from '../config/env.js';

const TABLE_NAME = config.aws.tables.menu;

export const menuRepo = {
  async getAll({ category, availableOnly = false, search = '' } = {}) {
    const command = new ScanCommand({
      TableName: TABLE_NAME
    });

    const res = await dynamoDb.send(command);
    let items = res.Items || [];

    const normCat = category ? category.toString().trim().toUpperCase() : '';
    if (normCat && normCat !== 'ALL' && normCat !== 'UNDEFINED' && normCat !== 'NULL') {
      items = items.filter(it => {
        const itemCat = (it.category || '').toUpperCase().trim();
        if (normCat === 'CHAAT' || normCat === 'CHAT') {
          return itemCat === 'CHAAT' || itemCat === 'CHAT';
        }
        if (normCat === 'BEVERAGE' || normCat === 'BEVERAGES') {
          return itemCat === 'BEVERAGES' || itemCat === 'BEVERAGE';
        }
        if (normCat === 'DESSERT' || normCat === 'DESSERTS') {
          return itemCat === 'DESSERTS' || itemCat === 'DESSERT';
        }
        if (normCat === 'FAST FOOD' || normCat === 'FASTFOOD') {
          return itemCat === 'FAST FOOD' || itemCat === 'FASTFOOD';
        }
        return itemCat === normCat;
      });
    }

    if (availableOnly) {
      items = items.filter(it => it.isAvailable === true);
    }

    const cleanSearch = search ? search.toString().trim() : '';
    if (cleanSearch && cleanSearch !== 'undefined' && cleanSearch !== 'null') {
      const q = cleanSearch.toLowerCase();
      items = items.filter(it => 
        (it.name && it.name.toLowerCase().includes(q)) || 
        (it.description && it.description.toLowerCase().includes(q)) ||
        (it.category && it.category.toLowerCase().includes(q))
      );
    }

    // Sort by name or category
    return items.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getById(itemId) {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { itemId }
    });
    const res = await dynamoDb.send(command);
    return res.Item || null;
  },

  async create(item) {
    const now = new Date().toISOString();
    const newItem = {
      itemId: item.itemId,
      name: item.name.trim(),
      description: item.description ? item.description.trim() : '',
      category: item.category.toUpperCase().trim(),
      price: Number(item.price),
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable !== undefined ? Boolean(item.isAvailable) : true,
      prepTimeMinutes: item.prepTimeMinutes ? Number(item.prepTimeMinutes) : 10,
      createdAt: now,
      updatedAt: now
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: newItem
    });

    await dynamoDb.send(command);
    return newItem;
  },

  async update(itemId, updates) {
    const existing = await this.getById(itemId);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      price: updates.price !== undefined ? Number(updates.price) : existing.price,
      prepTimeMinutes: updates.prepTimeMinutes !== undefined ? Number(updates.prepTimeMinutes) : existing.prepTimeMinutes,
      isAvailable: updates.isAvailable !== undefined ? Boolean(updates.isAvailable) : existing.isAvailable,
      updatedAt: new Date().toISOString()
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: updated
    });

    await dynamoDb.send(command);
    return updated;
  },

  async delete(itemId) {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { itemId }
    });
    await dynamoDb.send(command);
    return true;
  },

  async getCategories() {
    const all = await this.getAll();
    const categories = new Set(all.map(it => it.category));
    return Array.from(categories);
  }
};
