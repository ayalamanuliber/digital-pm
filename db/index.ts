import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Temporary: Use dummy connection for build, will fail at runtime if no real DB
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/dbname';

const sql = neon(DATABASE_URL);
export const db = drizzle(sql, { schema });
