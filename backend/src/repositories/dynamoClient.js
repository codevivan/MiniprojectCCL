import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  GetCommand, 
  PutCommand, 
  UpdateCommand, 
  DeleteCommand, 
  QueryCommand, 
  ScanCommand, 
  TransactWriteCommand 
} from '@aws-sdk/lib-dynamodb';
import { docClient, isAwsConfigured } from '../config/aws.js';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const LOCAL_DB_FILE = path.join(DATA_DIR, 'dynamodb_local_data.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Local storage helper for offline / demo mode
class LocalDynamoStore {
  constructor() {
    this.data = {};
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(LOCAL_DB_FILE)) {
        const raw = fs.readFileSync(LOCAL_DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.data = {
          [config.aws.tables.users]: {},
          [config.aws.tables.menu]: {},
          [config.aws.tables.orders]: {},
          [config.aws.tables.tokens]: {},
          [config.aws.tables.payments]: {},
          [config.aws.tables.suggestions]: {},
          [config.aws.tables.settings]: {},
        };
        this.save();
      }
    } catch (err) {
      console.error('[DynamoStore] Error loading local DB file, initializing fresh:', err.message);
      this.data = {};
    }
  }

  save() {
    try {
      fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DynamoStore] Error saving local DB file:', err.message);
    }
  }

  getKeyString(keyObj) {
    return Object.entries(keyObj)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('#');
  }

  getTable(tableName) {
    if (!this.data[tableName]) {
      this.data[tableName] = {};
    }
    return this.data[tableName];
  }

  get(tableName, keyObj) {
    const table = this.getTable(tableName);
    const keyStr = this.getKeyString(keyObj);
    return table[keyStr] ? JSON.parse(JSON.stringify(table[keyStr])) : null;
  }

  put(tableName, item, conditionExp = null) {
    const table = this.getTable(tableName);
    // Find primary key attributes based on table conventions
    let keyObj = {};
    if (item.userId) keyObj = { userId: item.userId };
    else if (item.itemId) keyObj = { itemId: item.itemId };
    else if (item.orderId) keyObj = { orderId: item.orderId };
    else if (item.tokenDate && item.sequenceNumber !== undefined) {
      keyObj = { tokenDate: item.tokenDate, sequenceNumber: item.sequenceNumber };
    } else if (item.paymentId) keyObj = { paymentId: item.paymentId };
    else if (item.suggestionId) keyObj = { suggestionId: item.suggestionId };
    else if (item.settingKey) keyObj = { settingKey: item.settingKey };
    else if (item.id) keyObj = { id: item.id };
    else {
      // Fallback: use first key
      const firstKey = Object.keys(item)[0];
      keyObj = { [firstKey]: item[firstKey] };
    }

    const keyStr = this.getKeyString(keyObj);

    if (conditionExp && conditionExp.includes('attribute_not_exists')) {
      if (table[keyStr]) {
        const err = new Error('The conditional request failed: item already exists');
        err.name = 'ConditionalCheckFailedException';
        throw err;
      }
    }

    table[keyStr] = JSON.parse(JSON.stringify(item));
    this.save();
    return { Attributes: item };
  }

  update(tableName, keyObj, updateExp, expAttrNames = {}, expAttrValues = {}) {
    const table = this.getTable(tableName);
    const keyStr = this.getKeyString(keyObj);
    let item = table[keyStr] || { ...keyObj };

    // Simple parser for SET ... expressions
    if (updateExp.startsWith('SET ')) {
      const clauses = updateExp.replace('SET ', '').split(', ');
      for (const clause of clauses) {
        const [fieldPart, valPart] = clause.split('=').map(s => s.trim());
        let fieldName = fieldPart;
        if (expAttrNames && expAttrNames[fieldPart]) {
          fieldName = expAttrNames[fieldPart];
        }
        let val = expAttrValues[valPart];
        item[fieldName] = val;
      }
    }

    table[keyStr] = item;
    this.save();
    return { Attributes: item };
  }

  delete(tableName, keyObj) {
    const table = this.getTable(tableName);
    const keyStr = this.getKeyString(keyObj);
    delete table[keyStr];
    this.save();
    return {};
  }

  query(tableName, indexName, keyCondExp, expAttrValues = {}, expAttrNames = {}, filterExp = null) {
    const table = this.getTable(tableName);
    const allItems = Object.values(table);

    // Simple filter matching values
    let results = allItems.filter(item => {
      // Check KeyConditionExpression
      for (const [keyPlaceholder, val] of Object.entries(expAttrValues)) {
        const cleanPlaceholder = keyPlaceholder.replace(':', '');
        // Check if property with clean name matches value
        if (keyCondExp && keyCondExp.includes(keyPlaceholder)) {
          // Resolve attribute name if present
          let matched = false;
          for (const [propName, propVal] of Object.entries(item)) {
            if (propVal === val) {
              matched = true;
              break;
            }
          }
          if (!matched) return false;
        }
      }
      return true;
    });

    return { Items: results, Count: results.length };
  }

  scan(tableName, filterExp = null, expAttrValues = {}, expAttrNames = {}) {
    const table = this.getTable(tableName);
    let results = Object.values(table);

    if (filterExp && expAttrValues) {
      results = results.filter(item => {
        let pass = true;
        for (const [k, v] of Object.entries(expAttrValues)) {
          // Check if item has property matching value
          let found = false;
          for (const itemVal of Object.values(item)) {
            if (itemVal === v) {
              found = true;
              break;
            }
          }
          if (!found) pass = false;
        }
        return pass;
      });
    }

    return { Items: results, Count: results.length };
  }
}

const localStore = new LocalDynamoStore();
let useRealAws = Boolean(
  (process.env.USE_DYNAMODB === 'true' || 
   process.env.USE_AWS === 'true' || 
   process.env.NODE_ENV === 'production' || 
   (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)) && 
  process.env.FORCE_LOCAL_DB !== 'true'
);

if (useRealAws) {
  console.log(`[DynamoDB] AWS Cloud Mode active. Target Region: ${config.aws.region}`);
} else {
  console.log('[DynamoDB] Local Storage Mode active (College Demo & Faculty Safe). Data stored at: data/dynamodb_local_data.json');
}

export const dynamoDb = {
  isCloudMode: () => useRealAws,
  setCloudMode: (flag) => { useRealAws = flag; },

  async send(command) {
    if (useRealAws) {
      try {
        const result = await docClient.send(command);
        // Mirror mutations to local store so local file stays in sync with DynamoDB
        try {
          const name = command.constructor.name;
          if (['PutCommand', 'UpdateCommand', 'DeleteCommand', 'TransactWriteCommand'].includes(name)) {
            this.executeLocal(command);
          }
        } catch (syncErr) {
          // Non-critical local sync warning
        }
        return result;
      } catch (err) {
        console.warn(`[DynamoDB AWS Warning] ${err.name}: ${err.message}. Falling back to local store for demo resilience.`);
        // Fallback execution
        return this.executeLocal(command);
      }
    }
    return this.executeLocal(command);
  },

  executeLocal(command) {
    const name = command.constructor.name;
    const input = command.input;

    if (name === 'GetCommand') {
      const item = localStore.get(input.TableName, input.Key);
      return { Item: item };
    }
    if (name === 'PutCommand') {
      return localStore.put(input.TableName, input.Item, input.ConditionExpression);
    }
    if (name === 'UpdateCommand') {
      return localStore.update(
        input.TableName, 
        input.Key, 
        input.UpdateExpression, 
        input.ExpressionAttributeNames, 
        input.ExpressionAttributeValues
      );
    }
    if (name === 'DeleteCommand') {
      return localStore.delete(input.TableName, input.Key);
    }
    if (name === 'QueryCommand') {
      return localStore.query(
        input.TableName, 
        input.IndexName, 
        input.KeyConditionExpression, 
        input.ExpressionAttributeValues, 
        input.ExpressionAttributeNames, 
        input.FilterExpression
      );
    }
    if (name === 'ScanCommand') {
      return localStore.scan(
        input.TableName, 
        input.FilterExpression, 
        input.ExpressionAttributeValues, 
        input.ExpressionAttributeNames
      );
    }
    if (name === 'TransactWriteCommand') {
      for (const item of input.TransactItems) {
        if (item.Put) {
          localStore.put(item.Put.TableName, item.Put.Item, item.Put.ConditionExpression);
        } else if (item.Update) {
          localStore.update(
            item.Update.TableName, 
            item.Update.Key, 
            item.Update.UpdateExpression, 
            item.Update.ExpressionAttributeNames, 
            item.Update.ExpressionAttributeValues
          );
        } else if (item.Delete) {
          localStore.delete(item.Delete.TableName, item.Delete.Key);
        }
      }
      return {};
    }
    throw new Error(`Unsupported DynamoDB command: ${name}`);
  }
};
