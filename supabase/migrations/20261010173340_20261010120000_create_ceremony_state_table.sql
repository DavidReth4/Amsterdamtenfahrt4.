/*
# Create ceremony_state table

1. New Tables
- `ceremony_state`
  - `id` (int, primary key, always 1 — singleton row)
  - `is_active` (boolean, whether the awards ceremony is running)
  - `phase` (text: 'countdown', 'podium', or 'ended')
  - `started_at` (timestamptz, when the ceremony was started)
  - `ended_at` (timestamptz, when the ceremony was ended, nullable)
  - `updated_at` (timestamptz, auto-updated on change)

2. Security
- Enable RLS on `ceremony_state`.
- Allow anon + authenticated to read (all users need to check ceremony state).
- Allow anon + authenticated to write (admin uses anon key; no auth flow in this app).
*/

CREATE TABLE IF NOT EXISTS ceremony_state (
  id int PRIMARY KEY DEFAULT 1,
  is_active boolean NOT NULL DEFAULT false,
  phase text NOT NULL DEFAULT 'countdown',
  started_at timestamptz,
  ended_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO ceremony_state (id, is_active, phase)
VALUES (1, false, 'countdown')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE ceremony_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_ceremony" ON ceremony_state;
CREATE POLICY "anon_select_ceremony"
ON ceremony_state FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_ceremony" ON ceremony_state;
CREATE POLICY "anon_insert_ceremony"
ON ceremony_state FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_ceremony" ON ceremony_state;
CREATE POLICY "anon_update_ceremony"
ON ceremony_state FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_ceremony" ON ceremony_state;
CREATE POLICY "anon_delete_ceremony"
ON ceremony_state FOR DELETE
TO anon, authenticated USING (true);
