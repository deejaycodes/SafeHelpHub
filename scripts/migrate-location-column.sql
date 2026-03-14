-- One-time migration: convert location from enum to text
-- Run this BEFORE deploying the new code to production
-- Command: psql $DATABASE_URL -f scripts/migrate-location-column.sql

ALTER TABLE reports ALTER COLUMN location TYPE text;
DROP TYPE IF EXISTS "nigerian_states" CASCADE;
DROP TYPE IF EXISTS "nigerianstates" CASCADE;
DROP TYPE IF EXISTS "reports_location_enum" CASCADE;
