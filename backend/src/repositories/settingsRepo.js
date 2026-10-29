import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from './dynamoClient.js';
import { config } from '../config/env.js';

const TABLE_NAME = config.aws.tables.settings;
const GENERAL_SETTINGS_KEY = 'GENERAL_CONFIG';

const DEFAULT_SETTINGS = {
  settingKey: GENERAL_SETTINGS_KEY,
  canteenName: 'CampusBite College Canteen',
  tagline: 'Order Smart. Skip the Queue.',
  openingHours: '08:00 AM - 06:00 PM',
  isTemporarilyClosed: false,
  announcement: 'Welcome to CampusBite! Freshly prepared breakfast, lunch & snacks ready on your schedule.',
  isOrderingAvailable: true,
  taxRatePercent: 0,
  currencySymbol: '₹',
  contactEmail: 'canteen@college.edu',
  updatedAt: new Date().toISOString()
};

export const settingsRepo = {
  async getSettings() {
    try {
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { settingKey: GENERAL_SETTINGS_KEY }
      });
      const res = await dynamoDb.send(command);
      if (res && res.Item) {
        return res.Item;
      }
    } catch (err) {
      console.warn('[SettingsRepo] Could not fetch settings, returning defaults:', err.message);
    }

    // Direct put without calling getSettings
    try {
      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: DEFAULT_SETTINGS
      });
      await dynamoDb.send(command);
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  },

  async updateSettings(newSettings) {
    let current = DEFAULT_SETTINGS;
    try {
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { settingKey: GENERAL_SETTINGS_KEY }
      });
      const res = await dynamoDb.send(command);
      if (res && res.Item) {
        current = res.Item;
      }
    } catch {
      // ignore
    }

    const updated = {
      ...current,
      ...newSettings,
      settingKey: GENERAL_SETTINGS_KEY,
      isTemporarilyClosed: newSettings.isTemporarilyClosed !== undefined 
        ? Boolean(newSettings.isTemporarilyClosed) 
        : (current.isTemporarilyClosed !== undefined ? Boolean(current.isTemporarilyClosed) : false),
      isOrderingAvailable: newSettings.isOrderingAvailable !== undefined 
        ? Boolean(newSettings.isOrderingAvailable) 
        : (current.isOrderingAvailable !== undefined ? Boolean(current.isOrderingAvailable) : true),
      updatedAt: new Date().toISOString()
    };

    const putCmd = new PutCommand({
      TableName: TABLE_NAME,
      Item: updated
    });

    await dynamoDb.send(putCmd);
    return updated;
  }
};
