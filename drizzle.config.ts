import type { Config } from 'drizzle-kit';
export default {
    schema: './store/sqliteStore/schema.ts',
    out: './drizzle',
    driver: 'expo', 
} satisfies Config;