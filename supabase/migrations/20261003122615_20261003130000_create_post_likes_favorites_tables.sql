/*
# Create post-level likes and favorites tables

1. New Tables
- `grachten_post_likes` — likes given by one user on another user's entire post.
  - `id` (uuid, primary key)
  - `voter_id` (uuid, foreign key to grachten_users.id, on delete cascade)
  - `target_user_id` (uuid, foreign key to grachten_users.id, on delete cascade)
  - `created_at` (timestamptz, default now())
  - UNIQUE(voter_id, target_user_id) — a user can like a given post at most once.
- `grachten_post_favorites` — favorites given by one user on another user's entire post.
  - `id` (uuid, primary key)
  - `voter_id` (uuid, foreign key to grachten_users.id, on delete cascade)
  - `target_user_id` (uuid, foreign key to grachten_users.id, on delete cascade)
  - `created_at` (timestamptz, default now())
  - UNIQUE(voter_id, target_user_id) — a user can favorite a given post at most once.

2. Security
- Enable RLS on both tables.
- This is a no-auth app (username-only), so all policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)` because the data is intentionally public/shared.
- Max 2 likes and 1 favorite per voter, and no self-likes/self-favorites, are enforced in the application layer.

3. Notes
- A like gives the target user +1 bonus point; a favorite gives +2 bonus points.
- If a user has given all 2 likes and 1 favorite, they receive +1 bonus point themselves.
- Scores exceeding MAX_POINTS are displayed in gold in the UI.
*/

CREATE TABLE IF NOT EXISTS grachten_post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id uuid NOT NULL REFERENCES grachten_users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES grachten_users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(voter_id, target_user_id)
);

ALTER TABLE grachten_post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_grachten_post_likes" ON grachten_post_likes;
CREATE POLICY "anon_select_grachten_post_likes" ON grachten_post_likes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_grachten_post_likes" ON grachten_post_likes;
CREATE POLICY "anon_insert_grachten_post_likes" ON grachten_post_likes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_grachten_post_likes" ON grachten_post_likes;
CREATE POLICY "anon_delete_grachten_post_likes" ON grachten_post_likes FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS grachten_post_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id uuid NOT NULL REFERENCES grachten_users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES grachten_users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(voter_id, target_user_id)
);

ALTER TABLE grachten_post_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_grachten_post_favorites" ON grachten_post_favorites;
CREATE POLICY "anon_select_grachten_post_favorites" ON grachten_post_favorites FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_grachten_post_favorites" ON grachten_post_favorites;
CREATE POLICY "anon_insert_grachten_post_favorites" ON grachten_post_favorites FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_grachten_post_favorites" ON grachten_post_favorites;
CREATE POLICY "anon_delete_grachten_post_favorites" ON grachten_post_favorites FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_grachten_post_likes_target ON grachten_post_likes(target_user_id);
CREATE INDEX IF NOT EXISTS idx_grachten_post_likes_voter ON grachten_post_likes(voter_id);
CREATE INDEX IF NOT EXISTS idx_grachten_post_favorites_target ON grachten_post_favorites(target_user_id);
CREATE INDEX IF NOT EXISTS idx_grachten_post_favorites_voter ON grachten_post_favorites(voter_id);
