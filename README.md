# Growth History (growth-history.com)

A standalone, highly shareable, and multi-tenant web application inspired by [star-history](https://github.com/star-history/star-history). It tracks, visualizes, and shares the total follower count history of various brands and organizations across four major social networks: **Instagram, X, TikTok, and LinkedIn**.

The application is heavily optimized for:
1. **Zero Server Costs** (Frontend deployed statically to Cloudflare Pages).
2. **Instantaneous Load Times** (Pre-rendered static HTML/SVG, shipping zero client-side JavaScript by default).
3. **Maximum SEO** (Fully rendered static graphs and tables crawlable by search engines).

---

## 🛠️ Technology Stack

* **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (Serverless SQL Database)
* **Backend/Ingestion**: [Cloudflare Workers](https://workers.cloudflare.com/) (Cron Trigger scheduler)
* **Frontend**: [Astro 6](https://astro.build/) (Static Site Generation, deployed to Cloudflare Pages)
* **Visual Export**: [html2canvas](https://html2canvas.hertzen.com/) (Tiny client-side script in an isolated Astro Island)

---

## 📐 Architecture & Data Flow

```
┌──────────────────┐      Daily snapshot      ┌───────────────┐
│ Ingestion Worker │ ───────────────────────> │ Cloudflare D1 │
│  (Cron Trigger)  │                          └───────────────┘
└──────────────────┘                                  │
         │                                            │ Fetch data
         │ Webhook trigger                            │ during build
         ▼                                            ▼
┌──────────────────┐    SSG Static Rebuild    ┌───────────────┐
│ Cloudflare Pages │ <─────────────────────── │   Astro App   │
└──────────────────┘                          └───────────────┘
```

1. **Daily Ingestion Loop**: A Cloudflare Worker runs daily on a Cron Trigger, loops over all tracked customers in the D1 database, scrapes their current follower counts, and records them.
2. **Rebuild Dispatch**: After updating the database, the Worker triggers a Cloudflare Pages deploy hook.
3. **Static Site Generation (SSG)**: During the Astro build step, a Node script fetches the customer database and historical tables, compiling them into static JSON caches. Astro then renders the landing directory and dynamic profile paths (e.g. `/[slug]/index.html`) using pure SVG and CSS tooltips.
4. **Viral Share Action**: Astro's Islands architecture loads a tiny client-side script only for the "Share" button. Clicking this triggers `html2canvas` to capture the DOM layout, overlays a custom branding watermark (**"Growth is not luck"**), and downloads a high-res PNG.

---

## 📂 Project Structure

```
├── astro.config.mjs          # Astro config (Cloudflare Pages adapter)
├── db/
│   └── schema.sql            # D1 relational database schema
├── package.json              # Main project scripts and dependencies
├── scripts/
│   ├── fetch-data.js         # Build script that exports D1 tables to static JSON
│   ├── generate-mock.js      # Generator for simulated development datasets
│   └── seed-local-db.js      # Utility to seed the local D1 instance
├── src/
│   ├── components/
│   │   ├── HeroChart.astro   # SVG trend chart with pure CSS interactive tooltips
│   │   ├── BreakdownMatrix.astro # Metrics breakdown and daily changes matrix
│   │   └── ShareButton.astro # Client-side html2canvas image export island
│   ├── styles/
│   │   └── global.css        # Color tokens, fonts, and global variables
│   └── pages/
│       ├── index.astro       # Landing page (Top 10 customer directory list)
│       └── [slug].astro      # Dynamic customer page (SSG profile per slug)
└── worker/
    ├── package.json          # Ingestion worker project package
    ├── wrangler.jsonc        # Ingestion worker configuration
    └── src/
        └── index.ts          # Multi-tenant ingestion daily worker script
```

---

## 🚀 Commands & Development

### 1. Initial Setup
Install dependencies in the root:
```bash
npm install
```

### 2. Seeding Local D1 Database
To reset and seed your local D1 SQLite database instance with the `dummy-customer` profile and 90 days of historical data:
```bash
npm run seed
```

### 3. Local Development
Start the local Astro development server:
```bash
npm run dev
```
The page will be served at `http://localhost:4321/`.

### 4. Production Build
Compile the static site locally to verify routes:
```bash
npm run build
```
The pre-rendered site will be built into the `./dist/` folder.

---

## 🔗 Deployment

For details on setting up D1 databases, configure Worker cron triggers, and connect webhook deploy pipelines, see the [deployment_guide.md](file:///home/admin/.gemini/antigravity-cli/brain/21034687-42be-4fe9-9942-b9fc79118435/deployment_guide.md) artifact.
