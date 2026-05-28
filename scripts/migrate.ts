import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('⏳ Running schema migration...');
    const schemaPath = resolve(import.meta.dirname ?? __dirname, '..', 'database', 'schema.sql');
    const sql = readFileSync(schemaPath, 'utf-8');

    await pool.query(sql);
    console.log('✅ Schema applied successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
