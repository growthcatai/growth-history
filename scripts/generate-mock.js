import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../src/data');
const historyDir = path.join(dataDir, 'history');

// Create directories if they do not exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(historyDir)) {
  fs.mkdirSync(historyDir, { recursive: true });
}

const customersList = [
  { id: 1, slug: 'dummy-customer', name: 'Dummy Customer', initialCounts: { instagram: 120500, x: 45200, tiktok: 80100, linkedin: 15300 }, growthRates: { instagram: 300, x: 200, tiktok: 500, linkedin: 80 } },
  { id: 2, slug: 'star-history', name: 'Star History', initialCounts: { instagram: 15200, x: 55000, tiktok: 12000, linkedin: 35000 }, growthRates: { instagram: 50, x: 300, tiktok: 40, linkedin: 120 } },
  { id: 3, slug: 'astro-dev', name: 'Astro Dev', initialCounts: { instagram: 42100, x: 89000, tiktok: 25000, linkedin: 22000 }, growthRates: { instagram: 150, x: 400, tiktok: 150, linkedin: 90 } },
  { id: 4, slug: 'cloudflare', name: 'Cloudflare', initialCounts: { instagram: 245000, x: 380000, tiktok: 110000, linkedin: 215000 }, growthRates: { instagram: 500, x: 800, tiktok: 400, linkedin: 300 } },
  { id: 5, slug: 'vercel', name: 'Vercel', initialCounts: { instagram: 180000, x: 490000, tiktok: 85000, linkedin: 190000 }, growthRates: { instagram: 400, x: 1000, tiktok: 300, linkedin: 250 } }
];

const generateHistoryForCustomer = (cust) => {
  const data = [];
  const now = new Date();
  // Initialize to midnight UTC, 90 days ago
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 90));

  let instagram = cust.initialCounts.instagram;
  let x = cust.initialCounts.x;
  let tiktok = cust.initialCounts.tiktok;
  let linkedin = cust.initialCounts.linkedin;

  for (let i = 0; i <= 90; i++) {
    const currentDate = new Date(startDate.getTime());
    currentDate.setUTCDate(startDate.getUTCDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];

    instagram += Math.floor(Math.random() * cust.growthRates.instagram) + 10;
    const xSpike = Math.random() > 0.96 ? Math.floor(Math.random() * 1500) : 0;
    x += Math.floor(Math.random() * cust.growthRates.x) + 20 + xSpike;
    tiktok += Math.floor(Math.random() * cust.growthRates.tiktok) + 30;
    linkedin += Math.floor(Math.random() * cust.growthRates.linkedin) + 10;

    const aggregate = instagram + x + tiktok + linkedin;

    data.push({
      date: dateStr,
      instagram,
      x,
      tiktok,
      linkedin,
      aggregate
    });
  }
  return data;
};

const processedCustomers = [];

for (const cust of customersList) {
  const history = generateHistoryForCustomer(cust);
  const current = history[history.length - 1];
  const previous = history[history.length - 2];
  
  const totalChange = current.aggregate - previous.aggregate;
  const pctChange = previous.aggregate > 0 ? (totalChange / previous.aggregate) * 100 : 0;

  // Write customer history to standalone JSON file
  fs.writeFileSync(
    path.join(historyDir, `${cust.slug}.json`),
    JSON.stringify(history, null, 2)
  );

  processedCustomers.push({
    id: cust.id,
    slug: cust.slug,
    name: cust.name,
    instagramHandle: `@${cust.slug.replace('-', '')}_ig`,
    xHandle: `@${cust.slug.replace('-', '')}`,
    tiktokHandle: `@${cust.slug.replace('-', '')}_tt`,
    linkedinId: `${cust.slug}-company`,
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

// Sort customers by currentTotal desc to get "top customers"
processedCustomers.sort((a, b) => b.currentTotal - a.currentTotal);

fs.writeFileSync(
  path.join(dataDir, 'customers.json'),
  JSON.stringify(processedCustomers, null, 2)
);

console.log('Successfully generated multi-tenant mock growth data!');
