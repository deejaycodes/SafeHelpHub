-- Add tracking_code column to reports
ALTER TABLE reports ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(9) UNIQUE;

-- Backfill existing reports with tracking codes
DO $$
DECLARE
  r RECORD;
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT;
  i INT;
BEGIN
  FOR r IN SELECT id FROM reports WHERE tracking_code IS NULL LOOP
    LOOP
      code := 'SV-';
      FOR i IN 1..6 LOOP
        code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
      END LOOP;
      BEGIN
        UPDATE reports SET tracking_code = code WHERE id = r.id;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        -- retry with new code
      END;
    END LOOP;
  END LOOP;
END $$;
