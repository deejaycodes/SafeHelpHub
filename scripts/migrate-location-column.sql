-- One-time migration: convert location from enum to text + add new case note types
-- Run this BEFORE deploying the new code to production
-- Supabase: SQL Editor → paste → Run

-- 1. Location column: enum → text
ALTER TABLE reports ALTER COLUMN location TYPE text;

-- 2. Case notes type: add new enum values
ALTER TYPE case_notes_type_enum ADD VALUE IF NOT EXISTS 'reporter_message';
ALTER TYPE case_notes_type_enum ADD VALUE IF NOT EXISTS 'caseworker_reply';

-- If the above fails (enum name might differ), try:
-- ALTER TYPE public.case_notes_type_enum ADD VALUE IF NOT EXISTS 'reporter_message';
-- ALTER TYPE public.case_notes_type_enum ADD VALUE IF NOT EXISTS 'caseworker_reply';
