import { useState, useEffect } from 'react';
import {
  Trophy,
  Crown,
  Image as ImageIcon,
  FileText,
  ListChecks,
  ChevronDown,
  Trash2,
  LogOut,
  Heart,
  Star,
} from 'lucide-react';
import {
  supabase,
  PHOTO_BUCKET,
  BONUS_SPOT_BASE,
  ADMIN_USERNAME,
  MAX_LIKES,
  MAX_FAVORITES,
  LIKE_POINTS,
  FAVORITE_POINTS,
  VOTER_REWARD,
  type GrachtenUser,
  type GrachtenPhoto,
  type GrachtenPollAnswer,
  type GrachtenTextEntry,
  type GrachtenLike,
  type GrachtenFavorite,
  type DisabledItem,
  type DisabledSet,
  parseDisabledItems,
} from '@/lib/supabase';
import { PHOTO_SPOTS, POLL_QUESTIONS, MAX_POINTS } from '@/lib/data';
import AdminControls from '@/components/AdminControls';
import ImageModal from '@/components/ImageModal';

type ResultsPageProps = {
  currentUser: GrachtenUser;
  onBack: () => void;
  isAdmin: boolean;
  onLogout: () => void;
};

type RankedUser = GrachtenUser & {
  photos: GrachtenPhoto[];
  pollAnswers: GrachtenPollAnswer[];
  textEntry: GrachtenTextEntry | null;
  likeCount: number;
  favoriteCount: number;
  voterReward: number;
  displayScore: number;
};

export default function ResultsPage({ currentUser, onBack, isAdmin, onLogout }: ResultsPageProps) {
  const [users, setUsers] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [allLikes, setAllLikes] = useState<GrachtenLike[]>([]);
  const [allFavorites, setAllFavorites] = useState<GrachtenFavorite[]>([]);
  const [voterLikes, setVoterLikes] = useState<string[]>([]);
  const [voterFavorites, setVoterFavorites] = useState<string[]>([]);
  const [disabledItems, setDisabledItems] = useState<DisabledSet>({ photoSpots: new Set(), pollQuestions: new Set() });
  const [modalSrc, setModalSrc] = useState<string | null>(null);
  const [adminData, setAdminData] = useState<RankedUser | null>(null);
  const [myAnsweredPolls, setMyAnsweredPolls] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const [usersRes, photosRes, pollsRes, textsRes, likesRes, favsRes, disabledRes] = await Promise.all([
        supabase.from('grachten_users').select('*').order('total_score', { ascending: false }),
        supabase.from('grachten_photos').select('*'),
        supabase.from('grachten_poll_answers').select('*'),
        supabase.from('grachten_text_entries').select('*'),
        supabase.from('grachten_post_likes').select('*'),
        supabase.from('grachten_post_favorites').select('*'),
        supabase.from('disabled_items').select('*'),
      ]);

      const allUsers = (usersRes.data || []) as GrachtenUser[];
      const allPhotos = (photosRes.data || []) as GrachtenPhoto[];
      const allPolls = (pollsRes.data || []) as GrachtenPollAnswer[];
      const allTexts = (textsRes.data || []) as GrachtenTextEntry[];
      const likes = (likesRes.data || []) as GrachtenLike[];
      const favorites = (favsRes.data || []) as GrachtenFavorite[];
      const disabled = parseDisabledItems((disabledRes.data || []) as DisabledItem[]);
      setDisabledItems(disabled);

      setAllLikes(likes);
      setAllFavorites(favorites);

      const myLikes = likes
        .filter((l) => l.voter_id === currentUser.id)
        .map((l) => l.target_user_id);
      const myFavs = favorites
        .filter((f) => f.voter_id === currentUser.id)
        .map((f) => f.target_user_id);
      setVoterLikes(myLikes);
      setVoterFavorites(myFavs);

      const myAnswered = new Set(
        allPolls.filter((p) => p.user_id === currentUser.id).map((p) => p.poll_index),
      );
      setMyAnsweredPolls(myAnswered);

      const visibleUsers = allUsers.filter((u) => u.username !== ADMIN_USERNAME);

      const buildRanked = (u: GrachtenUser): RankedUser => {
        const userLikeCount = likes.filter(
          (l) => l.target_user_id === u.id && l.voter_id !== u.id,
        ).length;

        const userFavCount = favorites.filter(
          (f) => f.target_user_id === u.id && f.voter_id !== u.id,
        ).length;

        const myLikesGiven = likes.filter((l) => l.voter_id === u.id).length;
        const myFavsGiven = favorites.filter((f) => f.voter_id === u.id).length;
        const voterReward =
          myLikesGiven >= MAX_LIKES && myFavsGiven >= MAX_FAVORITES ? VOTER_REWARD : 0;

        const photoPoints = allPhotos.filter(
          (p) => p.user_id === u.id && p.spot_index < BONUS_SPOT_BASE && !disabled.photoSpots.has(p.spot_index),
        ).length;
        const bonusPhotoPoints = allPhotos.filter(
          (p) => p.user_id === u.id && p.spot_index >= BONUS_SPOT_BASE,
        ).length;
        const pollPoints = allPolls.filter(
          (p) => p.user_id === u.id && p.is_correct && !disabled.pollQuestions.has(p.poll_index),
        ).length;
        const textPoint = allTexts.find((t) => t.user_id === u.id) ? 1 : 0;
        const baseScore = photoPoints + bonusPhotoPoints + pollPoints + textPoint;
        const bonusFromLikes = userLikeCount * LIKE_POINTS;
        const bonusFromFavs = userFavCount * FAVORITE_POINTS;
        const displayScore = baseScore + bonusFromLikes + bonusFromFavs + voterReward;

        return {
          ...u,
          photos: allPhotos.filter((p) => p.user_id === u.id),
          pollAnswers: allPolls.filter((p) => p.user_id === u.id),
          textEntry: allTexts.find((t) => t.user_id === u.id) ?? null,
          likeCount: userLikeCount,
          favoriteCount: userFavCount,
          voterReward,
          displayScore,
        };
      };

      const adminUser = allUsers.find((u) => u.username === ADMIN_USERNAME);
      if (adminUser) {
        setAdminData(buildRanked(adminUser));
      }

      const ranked: RankedUser[] = visibleUsers.map((u) => buildRanked(u));

      ranked.sort((a, b) => b.displayScore - a.displayScore);
      setUsers(ranked);
      if (!isAdmin) {
        setExpandedUser(currentUser.id);
      }
    } catch (err) {
      console.error('Failed to load results:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPhotoUrl = (path: string) => {
    const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  const hasLiked = (targetUserId: string): boolean => voterLikes.includes(targetUserId);
  const hasFavorited = (targetUserId: string): boolean => voterFavorites.includes(targetUserId);

  const handleToggleLike = async (targetUserId: string) => {
    if (targetUserId === currentUser.id) return;

    if (hasLiked(targetUserId)) {
      try {
        await supabase
          .from('grachten_post_likes')
          .delete()
          .eq('voter_id', currentUser.id)
          .eq('target_user_id', targetUserId);
        loadResults();
      } catch (err) {
        console.error('Failed to remove like:', err);
      }
    } else {
      if (voterLikes.length >= MAX_LIKES) {
        alert(`Du hast bereits deine ${MAX_LIKES} Likes vergeben. Nimm einen Like zurück, um ihn neu zu vergeben.`);
        return;
      }
      if (hasFavorited(targetUserId)) {
        await supabase
          .from('grachten_post_favorites')
          .delete()
          .eq('voter_id', currentUser.id)
          .eq('target_user_id', targetUserId);
      }
      try {
        await supabase.from('grachten_post_likes').insert({
          voter_id: currentUser.id,
          target_user_id: targetUserId,
        });
        loadResults();
      } catch (err) {
        console.error('Failed to add like:', err);
      }
    }
  };

  const handleToggleFavorite = async (targetUserId: string) => {
    if (targetUserId === currentUser.id) return;

    if (hasFavorited(targetUserId)) {
      try {
        await supabase
          .from('grachten_post_favorites')
          .delete()
          .eq('voter_id', currentUser.id)
          .eq('target_user_id', targetUserId);
        loadResults();
      } catch (err) {
        console.error('Failed to remove favorite:', err);
      }
    } else {
      if (voterFavorites.length >= MAX_FAVORITES) {
        alert(`Du hast bereits dein Favorite vergeben. Nimm es zurück, um es neu zu vergeben.`);
        return;
      }
      if (hasLiked(targetUserId)) {
        await supabase
          .from('grachten_post_likes')
          .delete()
          .eq('voter_id', currentUser.id)
          .eq('target_user_id', targetUserId);
      }
      try {
        await supabase.from('grachten_post_favorites').insert({
          voter_id: currentUser.id,
          target_user_id: targetUserId,
        });
        loadResults();
      } catch (err) {
        console.error('Failed to add favorite:', err);
      }
    }
  };

  const handleDeletePhoto = async (photoId: string, storagePath: string, userId: string) => {
    if (!confirm('Dieses Foto löschen?')) return;
    try {
      await supabase.storage.from(PHOTO_BUCKET).remove([storagePath]);
      await supabase.from('grachten_photos').delete().eq('id', photoId);
      await recalcUserScore(userId);
      loadResults();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Foto konnte nicht gelöscht werden.');
    }
  };

  const handleDeletePollAnswer = async (answerId: string, userId: string) => {
    if (!confirm('Diese Quiz-Antwort löschen?')) return;
    try {
      await supabase.from('grachten_poll_answers').delete().eq('id', answerId);
      await recalcUserScore(userId);
      loadResults();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Quiz-Antwort konnte nicht gelöscht werden.');
    }
  };

  const handleDeleteText = async (entryId: string, userId: string) => {
    if (!confirm('Diesen Textbeitrag löschen?')) return;
    try {
      await supabase.from('grachten_text_entries').delete().eq('id', entryId);
      await recalcUserScore(userId);
      loadResults();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Textbeitrag konnte nicht gelöscht werden.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Diesen Benutzer und alle seine Daten löschen? Dies kann nicht rückgängig gemacht werden.')) return;
    try {
      const { data: listed } = await supabase.storage.from(PHOTO_BUCKET).list(userId);
      if (listed && listed.length > 0) {
        await supabase.storage.from(PHOTO_BUCKET).remove(listed.map((f) => `${userId}/${f.name}`));
      }
      await supabase.from('grachten_post_likes').delete().eq('voter_id', userId);
      await supabase.from('grachten_post_likes').delete().eq('target_user_id', userId);
      await supabase.from('grachten_post_favorites').delete().eq('voter_id', userId);
      await supabase.from('grachten_post_favorites').delete().eq('target_user_id', userId);
      await supabase.from('grachten_photos').delete().eq('user_id', userId);
      await supabase.from('grachten_poll_answers').delete().eq('user_id', userId);
      await supabase.from('grachten_text_entries').delete().eq('user_id', userId);
      await supabase.from('grachten_users').delete().eq('id', userId);
      loadResults();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Benutzer konnte nicht gelöscht werden.');
    }
  };

  const recalcUserScore = async (userId: string) => {
    const [photosRes, pollsRes, textRes] = await Promise.all([
      supabase.from('grachten_photos').select('spot_index').eq('user_id', userId),
      supabase.from('grachten_poll_answers').select('is_correct').eq('user_id', userId),
      supabase.from('grachten_text_entries').select('id').eq('user_id', userId).maybeSingle(),
    ]);
    const photoPoints = (photosRes.data || []).filter((p) => p.spot_index < BONUS_SPOT_BASE).length;
    const bonusPoints = (photosRes.data || []).filter((p) => p.spot_index >= BONUS_SPOT_BASE).length;
    const pollPoints = (pollsRes.data || []).filter((p) => p.is_correct).length;
    const textPoint = textRes.data ? 1 : 0;
    const score = photoPoints + bonusPoints + pollPoints + textPoint;
    await supabase.from('grachten_users').update({ total_score: score }).eq('id', userId);
  };

  const myLikesGiven = voterLikes.length;
  const myFavsGiven = voterFavorites.length;
  const allVotesCast = myLikesGiven >= MAX_LIKES && myFavsGiven >= MAX_FAVORITES;

  if (loading) {
    return (
      <div className="min-h-screen bg-tan-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tan-100 pb-16">
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-green-600" strokeWidth={1.5} />
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <AdminControls disabled={disabledItems} onChanged={loadResults} />
            )}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-700 text-white text-sm font-medium hover:bg-green-800 transition-colors"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
              Abmelden
            </button>
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-green-700 mb-2">
          Rangliste
        </h1>

        {/* Voting status bar */}
        <div className="bg-green-700/10 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-pink-500" strokeWidth={2} />
                <span className="text-sm font-medium text-green-700">
                  {myLikesGiven}/{MAX_LIKES} Likes
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-500" strokeWidth={2} />
                <span className="text-sm font-medium text-green-700">
                  {myFavsGiven}/{MAX_FAVORITES} Favorite
                </span>
              </div>
            </div>
            <div>
              {allVotesCast ? (
                <span className="text-xs font-medium text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full">
                  Belohnung erhalten! (+{VOTER_REWARD} Punkt)
                </span>
              ) : (
                <span className="text-xs text-green-600">
                  Alle vergeben für +{VOTER_REWARD} Bonuspunkt
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onBack}
          className="mb-6 px-5 py-2 rounded-full bg-green-700 text-white text-sm font-medium hover:bg-green-800 transition-colors"
        >
          Zurück zu meiner Seite
        </button>

        {users.length === 0 && !adminData ? (
          <p className="text-green-600 text-center py-8">Noch keine Ergebnisse.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Admin hovering card above the leaderboard */}
            {isAdmin && adminData && (
              <div className="bg-green-800 rounded-3xl overflow-hidden ring-2 ring-tan-300 shadow-lg">
                <button
                  onClick={() => setExpandedUser(expandedUser === adminData.id ? null : adminData.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-green-900 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-9 h-9 rounded-full bg-tan-200 text-green-800 text-sm font-bold">
                      <Crown className="w-5 h-5" strokeWidth={1.5} />
                    </span>
                    <div className="text-left">
                      <p className="text-white font-semibold text-base">
                        {adminData.username}
                        <span className="text-tan-200 text-xs ml-2">(Admin)</span>
                      </p>
                      <p className="text-xs font-semibold text-white/60">
                        {adminData.displayScore} / {MAX_POINTS} Punkte
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-white/60 transition-transform ${expandedUser === adminData.id ? 'rotate-180' : ''}`}
                  />
                </button>
                {expandedUser === adminData.id && (
                  <div className="px-5 pb-5 max-h-[600px] overflow-y-auto">
                    {adminData.photos.filter((p) => p.spot_index < BONUS_SPOT_BASE).length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ImageIcon className="w-4 h-4 text-white/70" strokeWidth={1.5} />
                          <p className="text-white/70 text-xs font-medium">Foto-Stops</p>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {adminData.photos
                            .filter((p) => p.spot_index < BONUS_SPOT_BASE)
                            .sort((a, b) => a.spot_index - b.spot_index)
                            .map((photo) => (
                              <div key={photo.id} className="relative group/photo">
                                <img
                                  src={getPhotoUrl(photo.storage_path)}
                                  alt={PHOTO_SPOTS[photo.spot_index]?.label ?? 'Photo'}
                                  className="w-full aspect-square object-cover rounded-xl cursor-zoom-in transition-transform hover:scale-[1.03]"
                                  onClick={() => setModalSrc(getPhotoUrl(photo.storage_path))}
                                />
                                <p className="text-white/60 text-[10px] mt-1 truncate">
                                  {PHOTO_SPOTS[photo.spot_index]?.label ?? 'Bonus'}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    {adminData.photos.filter((p) => p.spot_index >= BONUS_SPOT_BASE).length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ImageIcon className="w-4 h-4 text-white/70" strokeWidth={1.5} />
                          <p className="text-white/70 text-xs font-medium">Bonus-Fotos</p>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {adminData.photos
                            .filter((p) => p.spot_index >= BONUS_SPOT_BASE)
                            .sort((a, b) => a.spot_index - b.spot_index)
                            .map((photo) => (
                              <div key={photo.id} className="relative group/photo">
                                <img
                                  src={getPhotoUrl(photo.storage_path)}
                                  alt="Bonus"
                                  className="w-full aspect-square object-cover rounded-xl cursor-zoom-in transition-transform hover:scale-[1.03]"
                                  onClick={() => setModalSrc(getPhotoUrl(photo.storage_path))}
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    {adminData.pollAnswers.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ListChecks className="w-4 h-4 text-white/70" strokeWidth={1.5} />
                          <p className="text-white/70 text-xs font-medium">Quiz-Ergebnisse</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          {adminData.pollAnswers
                            .sort((a, b) => a.poll_index - b.poll_index)
                            .map((ans) => {
                              const poll = POLL_QUESTIONS[ans.poll_index];
                              if (!poll) return null;
                              return (
                                <div key={ans.id} className="bg-green-700 rounded-xl p-3">
                                  <p className="text-white text-xs mb-1">
                                    {ans.poll_index + 1}. {poll.question}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-white/60 text-xs">
                                      Antwort: {myAnsweredPolls.has(ans.poll_index) ? poll.options[ans.selected_option] : '?'}
                                    </p>
                                    <span
                                      className={`text-xs font-bold ${
                                        ans.is_correct ? 'text-green-300' : 'text-red-300'
                                      }`}
                                    >
                                      {ans.is_correct ? 'Richtig' : 'Falsch'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                    {adminData.textEntry && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-white/70" strokeWidth={1.5} />
                          <p className="text-white/70 text-xs font-medium">Ihre Gedanken</p>
                        </div>
                        <div className="bg-green-700 rounded-xl p-3">
                          <p className="text-white text-sm leading-relaxed">{adminData.textEntry.content}</p>
                        </div>
                      </div>
                    )}
                    {adminData.photos.length === 0 && adminData.pollAnswers.length === 0 && !adminData.textEntry && (
                      <p className="text-white/50 text-sm text-center py-4">
                        Noch keine Beiträge.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {users.map((u, rank) => {
              const isExpanded = expandedUser === u.id;
              const isCurrentUser = u.id === currentUser.id;
              const spotPhotos = u.photos
                .filter((p) => p.spot_index < BONUS_SPOT_BASE)
                .sort((a, b) => a.spot_index - b.spot_index);
              const bonusPhotos = u.photos
                .filter((p) => p.spot_index >= BONUS_SPOT_BASE)
                .sort((a, b) => a.spot_index - b.spot_index);
              const overMax = u.displayScore > MAX_POINTS;
              const liked = hasLiked(u.id);
              const favorited = hasFavorited(u.id);
              const isOwn = isCurrentUser;
              const likeDisabled = !liked && voterLikes.length >= MAX_LIKES;
              const favDisabled = !favorited && voterFavorites.length >= MAX_FAVORITES;

              return (
                <div
                  key={u.id}
                  className={`bg-green-600 rounded-3xl overflow-hidden transition-all ${
                    isCurrentUser ? 'ring-4 ring-tan-300' : ''
                  }`}
                >
                  {/* Header row */}
                  <button
                    onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                    className="w-full flex items-center justify-between p-5 hover:bg-green-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold ${
                          rank === 0
                            ? 'bg-yellow-400 text-yellow-900'
                            : rank === 1
                            ? 'bg-gray-300 text-gray-700'
                            : rank === 2
                            ? 'bg-orange-400 text-orange-900'
                            : 'bg-green-800 text-white'
                        }`}
                      >
                        {rank + 1}
                      </span>
                      <div className="text-left">
                        <p className="text-white font-semibold text-base">
                          {u.username}
                          {isCurrentUser && <span className="text-tan-200 text-xs ml-2">(du)</span>}
                        </p>
                        <p
                          className={`text-xs font-semibold ${
                            overMax ? 'text-yellow-300' : 'text-white/60'
                          }`}
                        >
                          {u.displayScore} / {MAX_POINTS} Punkte
                          {overMax && (
                            <span className="ml-1 text-yellow-300">
                              (+{u.displayScore - MAX_POINTS})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-white/60 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Like / Favorite bar for this user's post */}
                  {!isOwn && (
                    <div className="px-5 pb-3 flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleLike(u.id); }}
                        disabled={likeDisabled}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          liked
                            ? 'bg-pink-500 text-white hover:bg-pink-600'
                            : likeDisabled
                            ? 'bg-white/10 text-white/30 cursor-not-allowed'
                            : 'bg-white/20 text-white/90 hover:bg-white/30'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${liked ? 'fill-white' : ''}`} strokeWidth={2} />
                        {u.likeCount}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleFavorite(u.id); }}
                        disabled={favDisabled}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          favorited
                            ? 'bg-yellow-500 text-yellow-900 hover:bg-yellow-600'
                            : favDisabled
                            ? 'bg-white/10 text-white/30 cursor-not-allowed'
                            : 'bg-white/20 text-white/90 hover:bg-white/30'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${favorited ? 'fill-yellow-900' : ''}`} strokeWidth={2} />
                        {u.favoriteCount}
                      </button>
                    </div>
                  )}
                  {isOwn && (u.likeCount > 0 || u.favoriteCount > 0) && (
                    <div className="px-5 pb-3 flex items-center gap-2">
                      <span className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-white/10 text-white/50">
                        <Heart className="w-4 h-4" strokeWidth={2} />
                        {u.likeCount}
                      </span>
                      <span className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-white/10 text-yellow-400/70">
                        <Star className="w-4 h-4" strokeWidth={2} />
                        {u.favoriteCount}
                      </span>
                    </div>
                  )}

                  {/* Expandable content */}
                  {isExpanded && (
                    <div className="px-5 pb-5 max-h-[600px] overflow-y-auto">
                      {/* Photos */}
                      {spotPhotos.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <ImageIcon className="w-4 h-4 text-white/70" strokeWidth={1.5} />
                            <p className="text-white/70 text-xs font-medium">Foto-Stops</p>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {spotPhotos.map((photo) => (
                              <div key={photo.id} className="relative group/photo">
                                <img
                                  src={getPhotoUrl(photo.storage_path)}
                                  alt={PHOTO_SPOTS[photo.spot_index]?.label ?? 'Photo'}
                                  className="w-full aspect-square object-cover rounded-xl cursor-zoom-in transition-transform hover:scale-[1.03]"
                                  onClick={() => setModalSrc(getPhotoUrl(photo.storage_path))}
                                />
                                <p className="text-white/60 text-[10px] mt-1 truncate">
                                  {PHOTO_SPOTS[photo.spot_index]?.label ?? 'Bonus'}
                                </p>
                                {isAdmin && (
                                  <button
                                    onClick={() => handleDeletePhoto(photo.id, photo.storage_path, u.id)}
                                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 rounded-full p-1.5 opacity-0 group-hover/photo:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="w-3 h-3 text-white" strokeWidth={2.5} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bonus photos */}
                      {bonusPhotos.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <ImageIcon className="w-4 h-4 text-white/70" strokeWidth={1.5} />
                            <p className="text-white/70 text-xs font-medium">
                              Bonus-Fotos ({bonusPhotos.length})
                            </p>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {bonusPhotos.map((photo) => (
                              <div key={photo.id} className="relative group/photo">
                                <img
                                  src={getPhotoUrl(photo.storage_path)}
                                  alt="Bonus"
                                  className="w-full aspect-square object-cover rounded-xl cursor-zoom-in transition-transform hover:scale-[1.03]"
                                  onClick={() => setModalSrc(getPhotoUrl(photo.storage_path))}
                                />
                                {isAdmin && (
                                  <button
                                    onClick={() => handleDeletePhoto(photo.id, photo.storage_path, u.id)}
                                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 rounded-full p-1.5 opacity-0 group-hover/photo:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="w-3 h-3 text-white" strokeWidth={2.5} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Poll results */}
                      {u.pollAnswers.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <ListChecks className="w-4 h-4 text-white/70" strokeWidth={1.5} />
                            <p className="text-white/70 text-xs font-medium">Quiz-Ergebnisse</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            {u.pollAnswers
                              .sort((a, b) => a.poll_index - b.poll_index)
                              .map((ans) => {
                                const poll = POLL_QUESTIONS[ans.poll_index];
                                if (!poll) return null;
                                return (
                                  <div key={ans.id} className="bg-green-700 rounded-xl p-3 relative group/poll">
                                    <p className="text-white text-xs mb-1">
                                      {ans.poll_index + 1}. {poll.question}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <p className="text-white/60 text-xs">
                                        Antwort: {isAdmin || myAnsweredPolls.has(ans.poll_index) ? poll.options[ans.selected_option] : '?'}
                                      </p>
                                      <span
                                        className={`text-xs font-bold ${
                                          ans.is_correct ? 'text-green-300' : 'text-red-300'
                                        }`}
                                      >
                                        {ans.is_correct ? 'Richtig' : 'Falsch'}
                                      </span>
                                    </div>
                                    {isAdmin && (
                                      <button
                                        onClick={() => handleDeletePollAnswer(ans.id, u.id)}
                                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 rounded-full p-1.5 opacity-0 group-hover/poll:opacity-100 transition-opacity"
                                      >
                                        <Trash2 className="w-3 h-3 text-white" strokeWidth={2.5} />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* Text entry */}
                      {u.textEntry && (
                        <div className="group/text">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-white/70" strokeWidth={1.5} />
                            <p className="text-white/70 text-xs font-medium">Ihre Gedanken</p>
                          </div>
                          <div className="bg-green-700 rounded-xl p-3 relative">
                            <p className="text-white text-sm leading-relaxed">{u.textEntry.content}</p>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteText(u.textEntry!.id, u.id)}
                                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 rounded-full p-1.5 opacity-0 group-hover/text:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-3 h-3 text-white" strokeWidth={2.5} />
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {spotPhotos.length === 0 && u.pollAnswers.length === 0 && !u.textEntry && (
                        <p className="text-white/50 text-sm text-center py-4">
                          Noch keine Beiträge.
                        </p>
                      )}
                    </div>
                  )}

                  {isAdmin && !isCurrentUser && (
                    <div className="px-5 pb-4">
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/80 hover:bg-red-500 text-white text-xs font-medium transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                        Benutzer löschen
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {modalSrc && (
        <ImageModal src={modalSrc} onClose={() => setModalSrc(null)} />
      )}
    </div>
  );
}
