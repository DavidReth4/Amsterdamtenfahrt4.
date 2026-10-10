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
