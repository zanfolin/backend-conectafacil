import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

config(); // Load .env file

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic import after dotenv.config()
const { env } = await import('./src/config/env.js');

export default {
  client: {
    resolve: () => import('./src/db/dialects/NodeSqliteClient.js').then((m) => m.NodeSqliteClient),
  },
  connection: {
    filename: env.DATABASE_PATH,
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