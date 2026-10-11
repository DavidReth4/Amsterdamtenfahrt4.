import {
  LIKE_POINTS,
  FAVORITE_POINTS,
  VOTER_REWARD,
  MAX_LIKES,
  MAX_FAVORITES,
  ADMIN_USERNAME,
} from '@/lib/supabase';

export type SimpleUser = {
  id: string;
  username: string;
  total_score: number;
};

export type LikeRow = {
  voter_id: string;
  target_user_id: string;
};

export type FavoriteRow = {
  voter_id: string;
  target_user_id: string;
};

export type ScoredUser = SimpleUser & {
  displayScore: number;
};

export function computeDisplayScores(
  users: SimpleUser[],
  likes: LikeRow[],
  favorites: FavoriteRow[],
): ScoredUser[] {
  const nonAdminUsers = users.filter((u) => u.username !== ADMIN_USERNAME);

  return nonAdminUsers.map((u) => {
    const likeCount = likes.filter(
      (l) => l.target_user_id === u.id && l.voter_id !== u.id,
    ).length;
    const favCount = favorites.filter(
      (f) => f.target_user_id === u.id && f.voter_id !== u.id,
    ).length;
    const myLikesGiven = likes.filter((l) => l.voter_id === u.id).length;
    const myFavsGiven = favorites.filter((f) => f.voter_id === u.id).length;
    const voterReward =
      myLikesGiven >= MAX_LIKES && myFavsGiven >= MAX_FAVORITES ? VOTER_REWARD : 0;

    const displayScore =
      u.total_score + likeCount * LIKE_POINTS + favCount * FAVORITE_POINTS + voterReward;

    return { ...u, displayScore };
  });
}

export function rankUsers(scored: ScoredUser[]): ScoredUser[] {
  const sorted = [...scored].sort(
    (a, b) => b.displayScore - a.displayScore || a.username.localeCompare(b.username),
  );
  return sorted;
}

export type PodiumGroup = {
  primaryUser: ScoredUser;
  tieCount: number;
};

export function groupByScore(scored: ScoredUser[]): ScoredUser[][] {
  const sorted = rankUsers(scored);
  const groups: ScoredUser[][] = [];
  for (const u of sorted) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup[0].displayScore === u.displayScore) {
      lastGroup.push(u);
    } else {
      groups.push([u]);
    }
  }
  return groups;
}

export async function fetchAllLikesAndFavorites(
  supabaseClient: import('@supabase/supabase-js').SupabaseClient,
): Promise<{ likes: LikeRow[]; favorites: FavoriteRow[] }> {
  const [likesRes, favsRes] = await Promise.all([
    supabaseClient.from('grachten_post_likes').select('voter_id,target_user_id'),
    supabaseClient.from('grachten_post_favorites').select('voter_id,target_user_id'),
  ]);
  return {
    likes: (likesRes.data || []) as LikeRow[],
    favorites: (favsRes.data || []) as FavoriteRow[],
  };
}
