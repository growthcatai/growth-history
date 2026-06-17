import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const customersPath = path.join(__dirname, '../src/data/customers.json');
const historyDir = path.join(__dirname, '../src/data/history');

async function seed() {
  console.log('Reading local JSON cache to seed D1 database...');

  if (!fs.existsSync(customersPath)) {
    console.error('No customer data found at src/data/customers.json. Please build the project first.');
    return;
  }

  const customers = JSON.parse(fs.readFileSync(customersPath, 'utf8'));
  console.log(`Found ${customers.length} customers. Generating SQL statements...`);

  let sqlStatements = [];
  
  // Clean tables first
  sqlStatements.push('DELETE FROM follower_history;');
  sqlStatements.push('DELETE FROM customers;');
  sqlStatements.push('DELETE FROM sqlite_sequence WHERE name IN ("customers", "follower_history");');

  for (const cust of customers) {
    const logoUrl = cust.logoUrl ? `'${cust.logoUrl}'` : 'NULL';
    const instagram = cust.instagramHandle ? `'${cust.instagramHandle.replace('@', '')}'` : 'NULL';
    const x = cust.xHandle ? `'${cust.xHandle.replace('@', '')}'` : 'NULL';
    const tiktok = cust.tiktokHandle ? `'${cust.tiktokHandle.replace('@', '')}'` : 'NULL';
    const linkedin = cust.linkedinId ? `'${cust.linkedinId}'` : 'NULL';

    // Insert Customer
    sqlStatements.push(
      `INSERT INTO customers (id, slug, name, logo_url, instagram_handle, x_handle, tiktok_handle, linkedin_id) ` +
      `VALUES (${cust.id}, '${cust.slug}', '${cust.name.replace(/'/g, "''")}', ${logoUrl}, ${instagram}, ${x}, ${tiktok}, ${linkedin});`
    );

    // Load History
    const historyPath = path.join(historyDir, `${cust.slug}.json`);
    if (fs.existsSync(historyPath)) {
      const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      const seenDates = new Set();
      for (const h of history) {
        if (seenDates.has(h.date)) continue;
        seenDates.add(h.date);
        
        sqlStatements.push(
          `INSERT INTO follower_history (customer_id, date, instagram, x, tiktok, linkedin, aggregate) ` +
          `VALUES (${cust.id}, '${h.date}', ${h.instagram}, ${h.x}, ${h.tiktok}, ${h.linkedin}, ${h.aggregate});`
        );
      }
    }
  }

  // Write SQL to temporary file
  const tempSqlFile = path.join(__dirname, 'seed-temp.sql');
  fs.writeFileSync(tempSqlFile, sqlStatements.join('\n'));

  console.log('Applying seed SQL statements to local D1 SQLite databases...');
  try {
    // 1. Seed root Astro app database
    console.log('Seeding root application database...');
    const outputRoot = execSync(
      `npx wrangler d1 execute growth-history-db --local --file="${tempSqlFile}"`,
      { encoding: 'utf8' }
    );
    console.log(outputRoot);

    // 2. Seed worker database
    console.log('Seeding worker database...');
    const outputWorker = execSync(
      `npx wrangler d1 execute growth-history-db --local --file="${tempSqlFile}" --config=worker/wrangler.jsonc`,
      { encoding: 'utf8' }
    );
    console.log(outputWorker);
    
    console.log('Databases seeded successfully!');
  } catch (err) {
    console.error('Failed to seed D1 database:', err);
  } finally {
    if (fs.existsSync(tempSqlFile)) {
      fs.unlinkSync(tempSqlFile);
    }
  }
}

seed().catch(err => console.error(err));
