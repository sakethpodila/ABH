import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function getDatabase(database: D1Database | undefined) {
  if (!database)
    throw new Error('D1 is not configured. Connect the DB binding before using persistent data.');
  return drizzle(database, { schema });
}
