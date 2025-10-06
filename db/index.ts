import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Temporary: Skip database connection for initial deployment
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://placeholder';

const sql = neon(DATABASE_URL);
export const db = drizzle(sql, { schema });
