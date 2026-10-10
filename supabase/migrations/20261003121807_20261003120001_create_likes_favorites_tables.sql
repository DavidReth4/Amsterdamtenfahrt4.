/*
# Create likes and favorites tables

1. New Tables
- `grachten_likes` — stores likes given by one user on another user's photo.
  - `id` (uuid, primary key)
  - `voter_id` (uuid, foreign key to grachten_users.id, on delete cascade)
  - `photo_id` (uuid, foreign key to grachten_photos.id, on delete cascade)
  - `created_at` (timestamptz, default now())
  - UNIQUE(voter_id, photo_id) — a user can like a given photo at most once.
- `grachten_favorites` — stores favorites given by one user on another user's photo.
  - `id` (uuid, primary key)
  - `voter_id` (uuid, foreign key to grachten_users.id, on delete cascade)
  - `photo_id` (uuid, foreign key to grachten_photos.id, on delete cascade)
  - `created_at` (timestamptz, default now())
  - UNIQUE(voter_id, photo_id) — a user can favorite a given photo at most once.

2. Security
- Enable RLS on both tables.
- This is a no-auth app (username-only), so all policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)` because the data is intentionally public/shared.
- Max 2 likes and 1 favorite per voter, and no self-likes/self-favorites, are enforced in the application layer.

3. Notes
- A like gives the photo owner +1 bonus point; a favorite gives +2 bonus points.
- If a user has given all 2 likes and 1 favorite, they receive +1 bonus point themselves.
- Scores exceeding MAX_POINTS are displayed in gold in the UI.
*/

CREATE TABLE IF NOT EXISTS grachten_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id uuid NOT NULL REFERENCES grachten_users(id) ON DELETE CASCADE,
  photo_id uuid NOT NULL REFERENCES grachten_photos(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(voter_id, photo_id)
);

ALTER TABLE grachten_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_grachten_likes" ON grachten_likes;
CREATE POLICY "anon_select_grachten_likes" ON grachten_likes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_grachten_likes" ON grachten_likes;
CREATE POLICY "anon_insert_grachten_likes" ON grachten_likes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_grachten_likes" ON grachten_likes;
CREATE POLICY "anon_delete_grachten_likes" ON grachten_likes FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS grachten_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id uuid NOT NULL REFERENCES grachten_users(id) ON DELETE CASCADE,
  photo_id uuid NOT NULL REFERENCES grachten_photos(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(voter_id, photo_id)
);

ALTER TABLE grachten_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_grachten_favorites" ON grachten_favorites;
CREATE POLICY "anon_select_grachten_favorites" ON grachten_favorites FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_grachten_favorites" ON grachten_favorites;
CREATE POLICY "anon_insert_grachten_favorites" ON grachten_favorites FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_grachten_favorites" ON grachten_favorites;
CREATE POLICY "anon_delete_grachten_favorites" ON grachten_favorites FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_grachten_likes_photo_id ON grachten_likes(photo_id);
CREATE INDEX IF NOT EXISTS idx_grachten_likes_voter_id ON grachten_likes(voter_id);
CREATE INDEX IF NOT EXISTS idx_grachten_favorites_photo_id ON grachten_favorites(photo_id);
CREATE INDEX IF NOT EXISTS idx_grachten_favorites_voter_id ON grachten_favorites(voter_id);
