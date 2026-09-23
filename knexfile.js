import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { mkdirSync } from 'node:fs';
import { NodeSqliteClient } from './src/db/dialects/NodeSqliteClient.js';

config(); // Load .env file

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const databasePath = process.env.DATABASE_PATH || './data/conectafacil.db';
mkdirSync(path.dirname(databasePath) || '.', { recursive: true });

export default {
  client: NodeSqliteClient,
  connection: {
    filename: databasePath,
  },
  pool: {
    min: 1,
    max: 1,
  },
  migrations: {
    directory: './src/db/migrations',
    tableName: 'knex_migrations',
    loadExtensions: ['.js'],
  },
  seeds: {
    directory: './src/db/seeds',
    loadExtensions: ['.js'],
  },
  useNullAsDefault: true,
};
