-- PostgreSQL initialization script
-- Runs once when postgres container first starts.
-- Enables extensions required by the ERP.

-- Fuzzy / full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- UUID generation (used as PK)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crypto (pgcrypto for optional field encryption)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Stats
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Set timezone
SET timezone = 'Asia/Karachi';

-- Grant privileges to application user (already owns the DB, but explicit is better)
GRANT ALL PRIVILEGES ON DATABASE lahorefashion TO lfuser;
