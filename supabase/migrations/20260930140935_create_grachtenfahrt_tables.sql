/*
# Create Grachtenfahrt tables and storage bucket

1. New Tables
- `grachten_users` — stores usernames and total scores. Each row is a participant.
  - `id` (uuid, primary key, defaults to gen_random_uuid())
  - `username` (text, unique, not null)
  - `total_score` (integer, not null, default 0)
  - `created_at` (timestamptz, default now())
- `grachten_photos` — stores photo uploads for the 10 named spots + bonus photos.
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to grachten_users.id, on delete cascade)
  - `spot_index` (integer, 0-9 for the 10 named spots, 100+ for bonus photos)
  - `storage_path` (text, path in the grachten-photos bucket)
  - `created_at` (timestamptz, default now())
- `grachten_poll_answers` — stores each user's answer to the 10 polls.
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to grachten_users.id, on delete cascade)
  - `poll_index` (integer, 0-9)
  - `selected_option` (integer, 0-3)
  - `is_correct` (boolean, not null)
  - `created_at` (timestamptz, default now())
- `grachten_text_entries` — stores the free-text entry from each user.
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to grachten_users.id, on delete cascade)
  - `content` (text, not null)
  - `created_at` (timestamptz, default now())

2. Storage
- Create a public bucket `grachten-photos` for storing uploaded images.

3. Security
- Enable RLS on all tables.
- This is a no-auth app (username-only, no email/password), so all policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)` because the data is intentionally public/shared — every visitor can see and submit data.
- Storage bucket policies allow public read and write.

4. Notes
- No user_id auth.users link — this is a username-only app with no sign-in screen.
- Spot indices 0-9 are the 10 named photo spots. Spot index 100+ is used for bonus photos.
- A unique constraint on (user_id, spot_index) prevents duplicate spot uploads.
- A unique constraint on (user_id, poll_index) prevents duplicate poll answers.
*/

CREATE TABLE IF NOT EXISTS grachten_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  total_score integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE grachten_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_grachten_users" ON grachten_users;
CREATE POLICY "anon_select_grachten_users" ON grachten_users FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_grachten_users" ON grachten_users;
CREATE POLICY "anon_insert_grachten_users" ON grachten_users FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_grachten_users" ON grachten_users;
CREATE POLICY "anon_update_grachten_users" ON grachten_users FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_grachten_users" ON grachten_users;
CREATE POLICY "anon_delete_grachten_users" ON grachten_users FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS grachten_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES grachten_users(id) ON DELETE CASCADE,
  spot_index integer NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, spot_index)
);

ALTER TABLE grachten_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_grachten_photos" ON grachten_photos;
CREATE POLICY "anon_select_grachten_photos" ON grachten_photos FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_grachten_photos" ON grachten_photos;
CREATE POLICY "anon_insert_grachten_photos" ON grachten_photos FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_grachten_photos" ON grachten_photos;
CREATE POLICY "anon_update_grachten_photos" ON grachten_photos FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_grachten_photos" ON grachten_photos;
CREATE POLICY "anon_delete_grachten_photos" ON grachten_photos FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS grachten_poll_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES grachten_users(id) ON DELETE CASCADE,
  poll_index integer NOT NULL,
  selected_option integer NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, poll_index)
);

ALTER TABLE grachten_poll_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_grachten_poll_answers" ON grachten_poll_answers;
CREATE POLICY "anon_select_grachten_poll_answers" ON grachten_poll_answers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_grachten_poll_answers" ON grachten_poll_answers;
CREATE POLICY "anon_insert_grachten_poll_answers" ON grachten_poll_answers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_grachten_poll_answers" ON grachten_poll_answers;
CREATE POLICY "anon_update_grachten_poll_answers" ON grachten_poll_answers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_grachten_poll_answers" ON grachten_poll_answers;
CREATE POLICY "anon_delete_grachten_poll_answers" ON grachten_poll_answers FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS grachten_text_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES grachten_users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE grachten_text_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_grachten_text_entries" ON grachten_text_entries;
CREATE POLICY "anon_select_grachten_text_entries" ON grachten_text_entries FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_grachten_text_entries" ON grachten_text_entries;
CREATE POLICY "anon_insert_grachten_text_entries" ON grachten_text_entries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_grachten_text_entries" ON grachten_text_entries;
CREATE POLICY "anon_update_grachten_text_entries" ON grachten_text_entries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_grachten_text_entries" ON grachten_text_entries;
CREATE POLICY "anon_delete_grachten_text_entries" ON grachten_text_entries FOR DELETE
  TO anon, authenticated USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('grachten-photos', 'grachten-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_select_grachten_photos_bucket" ON storage.objects;
CREATE POLICY "anon_select_grachten_photos_bucket" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'grachten-photos');

DROP POLICY IF EXISTS "anon_insert_grachten_photos_bucket" ON storage.objects;
CREATE POLICY "anon_insert_grachten_photos_bucket" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'grachten-photos');

DROP POLICY IF EXISTS "anon_update_grachten_photos_bucket" ON storage.objects;
CREATE POLICY "anon_update_grachten_photos_bucket" ON storage.objects FOR UPDATE
  TO anon, authenticated USING (bucket_id = 'grachten-photos') WITH CHECK (bucket_id = 'grachten-photos');

DROP POLICY IF EXISTS "anon_delete_grachten_photos_bucket" ON storage.objects;
CREATE POLICY "anon_delete_grachten_photos_bucket" ON storage.objects FOR DELETE
  TO anon, authenticated USING (bucket_id = 'grachten-photos');
