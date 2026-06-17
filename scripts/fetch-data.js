import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../src/data');
const historyDir = path.join(dataDir, 'history');
const customersPath = path.join(dataDir, 'customers.json');

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID = process.env.CLOUDFLARE_DATABASE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

async function executeQuery(sql) {
  // Option 1: Use Cloudflare API directly if env vars are present
  if (ACCOUNT_ID && DATABASE_ID && API_TOKEN) {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sql }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.result && result.result[0] && result.result[0].results) {
          return result.result[0].results;
        }
      }
    } catch (err) {
      console.warn('API query failed:', err.message);
    }
  }

  // Option 2: Try wrangler CLI
  try {
    const isProd = process.env.NODE_ENV === 'production' || process.env.CF_PAGES === '1';
    const flag = isProd ? '--remote' : '--local';
    const output = execSync(
      `npx wrangler d1 execute growth-history-db ${flag} --command="${sql.replace(/"/g, '\\"')}" --json`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    );
    const parsed = JSON.parse(output);
    if (Array.isArray(parsed) && parsed[0] && Array.isArray(parsed[0].results)) {
      return parsed[0].results;
    }
  } catch (err) {
    // Suppress noise
  }

  return null;
}

async function fetchData() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }

  console.log('Fetching multi-tenant database data...');
  
  // 1. Fetch all customers
  const customers = await executeQuery('SELECT * FROM customers');
  
  if (customers && customers.length > 0) {
    console.log(`Found ${customers.length} customers in database. Fetching histories...`);
    const processedCustomers = [];

    for (const cust of customers) {
      // 2. Fetch history for each customer
      const history = await executeQuery(`SELECT * FROM follower_history WHERE customer_id = ${cust.id} ORDER BY date ASC`);
      
      if (history && history.length > 0) {
        // Write Standalone History File
        fs.writeFileSync(
          path.join(historyDir, `${cust.slug}.json`),
          JSON.stringify(history, null, 2)
        );

        const current = history[history.length - 1];
        const previous = history[history.length - 2] || current;
        
        const totalChange = current.aggregate - previous.aggregate;
        const pctChange = previous.aggregate > 0 ? (totalChange / previous.aggregate) * 100 : 0;

        processedCustomers.push({
          id: cust.id,
          slug: cust.slug,
          name: cust.name,
          logoUrl: cust.logo_url || null,
          instagramHandle: cust.instagram_handle || null,
          xHandle: cust.x_handle || null,
          tiktokHandle: cust.tiktok_handle || null,
          linkedinId: cust.linkedin_id || null,
          currentTotal: current.aggregate,
          dailyChange: totalChange,
          pctChange: pctChange,
          platforms: {
            instagram: current.instagram,
            x: current.x,
            tiktok: current.tiktok,
            linkedin: current.linkedin
          }
        });
      }
    }

    if (processedCustomers.length > 0) {
      processedCustomers.sort((a, b) => b.currentTotal - a.currentTotal);
      fs.writeFileSync(customersPath, JSON.stringify(processedCustomers, null, 2));
      console.log(`Successfully fetched and wrote data for ${processedCustomers.length} active customers.`);
      return;
    }
  }

  // Option 3: Fallback
  if (fs.existsSync(customersPath)) {
    console.log('Using existing local JSON cache.');
  } else {
    console.log('No database data found. Generating mock customer directory...');
    try {
      execSync('node scripts/generate-mock.js', { stdio: 'inherit' });
    } catch (err) {
      console.error('Failed to generate mock data:', err);
    }
  }
}

fetchData().catch((err) => {
  console.error('Unhandled error in fetch-data:', err);
  process.exit(1);
});
