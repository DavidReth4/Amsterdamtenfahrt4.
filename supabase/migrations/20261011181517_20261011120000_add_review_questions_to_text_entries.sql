/*
# Add review question columns to grachten_text_entries

1. Changes
- Adds 4 new text columns to `grachten_text_entries`:
  - `answer_q1` — Antwort auf "Was hast du heute neues gelernt?"
  - `answer_q2` — Antwort auf "Welche Fragen sind noch offen, bzw. haben sich neu ergeben?"
  - `answer_q3` — Antwort auf "Hat dir die Grachtenfahrt - Rallye gefallen, wenn ja warum, wenn nein, warum nicht?"
  - `answer_q4` — Antwort auf "Hat dir die Grachtenfahrt, unabhängig von der Rallye gefallen, wenn ja warum, wenn nein, warum nicht?"
- The existing `content` column is kept for backwards compatibility but will no longer be used for new entries.
- Each answered question gives 1 point (max 4 instead of previous 1).

2. Security
- No changes to RLS policies. Existing policies remain in place.
*/

ALTER TABLE grachten_text_entries
  ADD COLUMN IF NOT EXISTS answer_q1 text,
  ADD COLUMN IF NOT EXISTS answer_q2 text,
  ADD COLUMN IF NOT EXISTS answer_q3 text,
  ADD COLUMN IF NOT EXISTS answer_q4 text;
