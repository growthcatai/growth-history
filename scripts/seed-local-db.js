import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '../db');
const seedSqlPath = path.join(dbDir, 'seed.sql');

console.log('Generating local database seed SQL file (UTC timezone-safe)...');

// 1. Generate 90 days of history for dummy-customer
const generateSeedSql = () => {
  let sql = `-- Local Database Seed for Dummy Customer\n\n`;
  
  // Clear any existing data
  sql += `DELETE FROM follower_history;\n`;
  sql += `DELETE FROM customers;\n\n`;

  // Insert single customer Dummy Customer
  sql += `INSERT INTO customers (id, name, slug, x_handle, instagram_handle, tiktok_handle, linkedin_id) \n`;
  sql += `VALUES (1, 'Dummy Customer', 'dummy-customer', 'dummy_handle', 'dummy_handle', 'dummy_handle', 'dummy-handle');\n\n`;

  // Generate snapshots in a UTC timezone-safe manner to prevent DST shifts
  const startDate = new Date();
  startDate.setUTCHours(12, 0, 0, 0); // Set to noon UTC
  startDate.setUTCDate(startDate.getUTCDate() - 90);

  let instagram = 120500;
  let x = 45200;
  let tiktok = 80100;
  let linkedin = 15300;

  sql += `INSERT INTO follower_history (customer_id, date, instagram, x, tiktok, linkedin, aggregate) VALUES\n`;

  const values = [];

  for (let i = 0; i <= 90; i++) {
    const currentDate = new Date(startDate);
    currentDate.setUTCDate(startDate.getUTCDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];

    instagram += Math.floor(Math.random() * 500) + 100;
    const xSpike = Math.random() > 0.95 ? Math.floor(Math.random() * 2000) : 0;
    x += Math.floor(Math.random() * 300) + 50 + xSpike;
    tiktok += Math.floor(Math.random() * 800) + 200;
    linkedin += Math.floor(Math.random() * 150) + 30;

    const aggregate = instagram + x + tiktok + linkedin;

    values.push(`(1, '${dateStr}', ${instagram}, ${x}, ${tiktok}, ${linkedin}, ${aggregate})`);
  }

  sql += values.join(',\n') + ';\n';
  return sql;
};

// Write SQL file
const seedSqlContent = generateSeedSql();
fs.writeFileSync(seedSqlPath, seedSqlContent);
console.log(`Seed SQL successfully written to db/seed.sql`);

// 2. Execute SQL files on the local D1 instance
try {
  console.log('Resetting local D1 schema (running db/schema.sql)...');
  execSync('npx wrangler d1 execute growth-history-db --local --file=db/schema.sql --yes', { stdio: 'inherit' });

  console.log('Seeding local D1 database (running db/seed.sql)...');
  execSync('npx wrangler d1 execute growth-history-db --local --file=db/seed.sql --yes', { stdio: 'inherit' });

  console.log('Local D1 database successfully reset and seeded with Dummy Customer!');
} catch (err) {
  console.error('Failed to seed local database via Wrangler:', err.message);
  console.log('\nMake sure you have wrangler installed and growth-history-db configured in wrangler.jsonc.');
}
