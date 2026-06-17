-- Database Migration/Schema for Growth History (Multi-Tenant)
-- Stores customer profiles and their historical daily follower counts.

DROP TABLE IF EXISTS follower_history;
DROP TABLE IF EXISTS customers;

-- 1. Customers Table
CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,          -- e.g. 'dummy-customer'
  name TEXT NOT NULL,                 -- e.g. 'Dummy Customer'
  logo_url TEXT,                      -- optional image link
  instagram_handle TEXT,              -- e.g. 'dummy_handle'
  x_handle TEXT,                      -- e.g. 'dummy_handle'
  tiktok_handle TEXT,                 -- e.g. 'dummy_handle'
  linkedin_id TEXT                    -- e.g. 'dummy-handle'
);

-- 2. Follower History Table
CREATE TABLE follower_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,       -- references customers(id)
  date TEXT NOT NULL,                 -- YYYY-MM-DD format
  instagram INTEGER NOT NULL,
  x INTEGER NOT NULL,
  tiktok INTEGER NOT NULL,
  linkedin INTEGER NOT NULL,
  aggregate INTEGER NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  UNIQUE(customer_id, date)           -- One snapshot per customer per day
);

-- Indices for query performance
CREATE INDEX idx_customers_slug ON customers(slug);
CREATE INDEX idx_history_customer_date ON follower_history(customer_id, date);

-- 3. Better Auth - User Table
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL,  -- BOOLEAN (0/1)
  image TEXT,
  createdAt TEXT NOT NULL,         -- datetime ISO string
  updatedAt TEXT NOT NULL
);

-- 4. Better Auth - Session Table
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  expiresAt TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
);

-- 5. Better Auth - Account Table
CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  expiresAt INTEGER,
  password TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- 6. Better Auth - Verification Table
CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT,
  updatedAt TEXT
);

-- 7. Custom User Trackers Table
CREATE TABLE IF NOT EXISTS user_trackers (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  logoUrl TEXT,
  instagramHandle TEXT,
  xHandle TEXT,
  tiktokHandle TEXT,
  linkedinId TEXT,
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_trackers_user ON user_trackers(userId);
CREATE INDEX IF NOT EXISTS idx_user_trackers_slug ON user_trackers(slug);
