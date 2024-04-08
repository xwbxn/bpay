import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
    schema: './db/schema.ts',
    out: './drizzle',
    driver: 'expo', // 'pg' | 'mysql2' | 'better-sqlite' | 'libsql' | 'turso'
} satisfies Config;