import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const runMigrate = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in .env file');
  }

  console.log('Starting migration...');
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  await migrate(db, { migrationsFolder: './packages/db/migrations' });

  console.log('Migration completed successfully!');
  await sql.end();
};

runMigrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
