/*
# Create disabled_items table for admin toggle of photo stops and poll questions

1. New Tables
- `disabled_items`
  - `id` (uuid, primary key)
  - `item_type` (text, NOT NULL) — either 'photo_spot' or 'poll_question'
  - `item_index` (integer, NOT NULL) — the index of the photo spot or poll question
  - `created_at` (timestamptz, default now())
  - UNIQUE constraint on (item_type, item_index) so each item can only be disabled once
2. Security
- Enable RLS on `disabled_items`.
- Allow anon + authenticated to SELECT (everyone needs to know which items are disabled).
- Allow anon + authenticated to INSERT and DELETE (the admin uses the anon key like everyone else in this app).
- No UPDATE needed — toggling is done via INSERT (disable) and DELETE (enable).
3. Purpose
- When a row exists for a given item_type + item_index, that item is disabled (greyed out, unusable).
- When the row is deleted, the item is re-enabled and users' points for that item are automatically counted again because the score calculation simply checks whether the item is in the disabled set.
*/

CREATE TABLE IF NOT EXISTS disabled_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL,
  item_index integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (item_type, item_index)
);

ALTER TABLE disabled_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_disabled_items" ON disabled_items;
CREATE POLICY "anon_select_disabled_items"
ON disabled_items FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_disabled_items" ON disabled_items;
CREATE POLICY "anon_insert_disabled_items"
ON disabled_items FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_disabled_items" ON disabled_items;
CREATE POLICY "anon_delete_disabled_items"
ON disabled_items FOR DELETE
TO anon, authenticated USING (true);
