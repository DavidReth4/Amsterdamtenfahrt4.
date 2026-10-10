import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type GrachtenUser = {
  id: string;
  username: string;
  total_score: number;
  created_at: string;
};

export type GrachtenPhoto = {
  id: string;
  user_id: string;
  spot_index: number;
  storage_path: string;
  created_at: string;
};

export type GrachtenPollAnswer = {
  id: string;
  user_id: string;
  poll_index: number;
  selected_option: number;
  is_correct: boolean;
  created_at: string;
};

export type GrachtenTextEntry = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export type GrachtenLike = {
  id: string;
  voter_id: string;
  target_user_id: string;
  created_at: string;
};

export type GrachtenFavorite = {
  id: string;
  voter_id: string;
  target_user_id: string;
  created_at: string;
};

export const PHOTO_BUCKET = 'grachten-photos';
export const BONUS_SPOT_BASE = 100;
export const MAX_BONUS_UPLOADS = 5;
export const ADMIN_USERNAME = 'admin2026';
export const MAX_LIKES = 2;
export const MAX_FAVORITES = 1;
export const LIKE_POINTS = 1;
export const FAVORITE_POINTS = 2;
export const VOTER_REWARD = 1;

export type DisabledItem = {
  id: string;
  item_type: 'photo_spot' | 'poll_question';
  item_index: number;
  created_at: string;
};

export type DisabledSet = {
  photoSpots: Set<number>;
  pollQuestions: Set<number>;
};

export function parseDisabledItems(items: DisabledItem[]): DisabledSet {
  const photoSpots = new Set<number>();
  const pollQuestions = new Set<number>();
  for (const item of items) {
    if (item.item_type === 'photo_spot') photoSpots.add(item.item_index);
    else if (item.item_type === 'poll_question') pollQuestions.add(item.item_index);
  }
  return { photoSpots, pollQuestions };
}
