import { useState, useEffect, useRef, useMemo } from 'react';
import { Crown, X, Image as ImageIcon, ListChecks, FileText, Heart, Star } from 'lucide-react';
import {
  supabase,
  ADMIN_USERNAME,
  PHOTO_BUCKET,
  BONUS_SPOT_BASE,
  type GrachtenUser,
  type GrachtenPhoto,
  type GrachtenPollAnswer,
  type GrachtenTextEntry,
  type CeremonyState,
} from '@/lib/supabase';
import { PHOTO_SPOTS, POLL_QUESTIONS } from '@/lib/data';
import {
  computeDisplayScores,
  rankUsers,
  groupByScore,
  fetchAllLikesAndFavorites,
  type ScoredUser,
} from '@/lib/scoring';

type CeremonyPageProps = {
  currentUser: GrachtenUser;
  onCeremonyEnd: () => void;
};

type RankedUser = ScoredUser;

const REVIEW_QUESTIONS = [
  'Was hast du heute neues gelernt?',
  'Welche Fragen sind noch offen, bzw. haben sich neu ergeben?',
  'Hat dir die Grachtenfahrt - Rallye gefallen, wenn ja warum, wenn nein, warum nicht?',
  'Hat dir die Grachtenfahrt, unabhängig von der Rallye gefallen, wenn ja warum, wenn nein, warum nicht?',
];

type UserPost = {
  photos: GrachtenPhoto[];
  pollAnswers: GrachtenPollAnswer[];
  textEntry: GrachtenTextEntry | null;
  likeCount: number;
  favoriteCount: number;
};

export default function CeremonyPage({ currentUser, onCeremonyEnd }: CeremonyPageProps) {
  const [phase, setPhase] = useState<'countdown' | 'podium'>('countdown');
  const [countdown, setCountdown] = useState(10);
  const [rankedUsers, setRankedUsers] = useState<RankedUser[]>([]);
  const [revealStep, setRevealStep] = useState(0);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [popupUserId, setPopupUserId] = useState<string | null>(null);
  const [popupData, setPopupData] = useState<UserPost | null>(null);
  const [popupLoading, setPopupLoading] = useState(false);
  const [modalSrc, setModalSrc] = useState<string | null>(null);
  const [expandedRanks, setExpandedRanks] = useState<Set<number>>(new Set());
  const isAdmin = currentUser.username === ADMIN_USERNAME;
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);

  type ConfettiPiece = {
    id: number;
    side: 'left' | 'right';
    delay: number;
    fallDelay: number;
    color: string;
    size: number;
    cx: number;
    cy: number;
    cr: number;
    fallDuration: number;
  };

  const colors = ['#000000', '#ffffff', '#1a5e2a'];

  const generateConfetti = useMemo(() => {
    const pieces: ConfettiPiece[] = [];
    for (let i = 0; i < 80; i++) {
      pieces.push({
        id: i,
        side: i < 40 ? 'left' : 'right',
        delay: Math.random() * 0.3,
        fallDelay: 1.2 + Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
        cx: (Math.random() * 400 - 100) * (i < 40 ? 1 : -1),
        cy: -(200 + Math.random() * 300),
        cr: (Math.random() * 1080 - 540),
        fallDuration: 2.5 + Math.random() * 2,
      });
    }
    return pieces;
  }, []);

  useEffect(() => {
    loadRankedUsers();
  }, []);

  useEffect(() => {
    if (phase !== 'countdown') return;

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          setPhase('podium');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [phase]);

  // Reveal order: 3rd place first, then 2nd, then 1st
  const revealOrder = [3, 2, 1];

  useEffect(() => {
    if (phase === 'podium') {
      autoSubmitAll();
      const timers: ReturnType<typeof setTimeout>[] = [];
      timers.push(setTimeout(() => setRevealStep(1), 800));
      timers.push(setTimeout(() => setRevealStep(2), 2000));
      timers.push(setTimeout(() => setRevealStep(3), 3200));
      timers.push(setTimeout(() => {
        setRevealStep(4);
        setConfettiPieces(generateConfetti);
      }, 3400));
      return () => timers.forEach(clearTimeout);
    }
  }, [phase]);

  const loadRankedUsers = async () => {
    const [usersRes, { likes, favorites }] = await Promise.all([
      supabase
        .from('grachten_users')
        .select('id, username, total_score')
        .neq('username', ADMIN_USERNAME)
        .order('created_at', { ascending: true }),
      fetchAllLikesAndFavorites(supabase),
    ]);

    if (usersRes.error) {
      console.error('Failed to load ranked users:', usersRes.error);
      return;
    }

    const scored = computeDisplayScores(
      (usersRes.data || []) as { id: string; username: string; total_score: number }[],
      likes,
      favorites,
    );
    setRankedUsers(rankUsers(scored));
  };

  const autoSubmitAll = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
  };

  const handleEndCeremony = async () => {
    await supabase
      .from('ceremony_state')
      .update({ is_active: false, phase: 'ended', ended_at: new Date().toISOString() })
      .eq('id', 1);
    onCeremonyEnd();
  };

  const openPopup = async (userId: string) => {
    setPopupUserId(userId);
    setPopupLoading(true);
    setPopupData(null);
    try {
      const [photosRes, pollsRes, textRes, likesRes, favsRes] = await Promise.all([
        supabase.from('grachten_photos').select('*').eq('user_id', userId),
        supabase.from('grachten_poll_answers').select('*').eq('user_id', userId),
        supabase.from('grachten_text_entries').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('grachten_post_likes').select('id').eq('target_user_id', userId),
        supabase.from('grachten_post_favorites').select('id').eq('target_user_id', userId),
      ]);
      setPopupData({
        photos: (photosRes.data || []) as GrachtenPhoto[],
        pollAnswers: (pollsRes.data || []) as GrachtenPollAnswer[],
        textEntry: (textRes.data || null) as GrachtenTextEntry | null,
        likeCount: (likesRes.data || []).length,
        favoriteCount: (favsRes.data || []).length,
      });
    } catch (err) {
      console.error('Failed to load user post:', err);
    } finally {
      setPopupLoading(false);
    }
  };

  const getPhotoUrl = (path: string) => {
    const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  const allGroups = groupByScore(rankedUsers);
  const groupsWithPoints = allGroups.filter((g) => g[0].displayScore > 0);

  const top3Groups = groupsWithPoints.slice(0, 3);
  const top5ForPopup = groupsWithPoints.slice(0, 5).flat();

  const getPodiumGroup = (rank: number) => top3Groups[rank - 1];

  const podiumConfig = [
    { rank: 1, height: 'h-40', medal: 'bg-yellow-400 text-yellow-900', order: 'order-2' },
    { rank: 2, height: 'h-28', medal: 'bg-gray-300 text-gray-700', order: 'order-1' },
    { rank: 3, height: 'h-20', medal: 'bg-orange-400 text-orange-900', order: 'order-3' },
  ];

  const getRevealStepForRank = (rank: number) => revealOrder.indexOf(rank) + 1;

  const places4and5 = [
    groupsWithPoints[3]?.[0] ?? null,
    groupsWithPoints[4]?.[0] ?? null,
  ];

  return (
    <div className="min-h-screen bg-tan-100 flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Confetti layer */}
      {confettiPieces.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-10">
          {confettiPieces.map((piece) => (
            <div
              key={piece.id}
              className={`absolute ${piece.side === 'left' ? 'confetti-burst-bl' : 'confetti-burst-br'}`}
              style={{
                left: piece.side === 'left' ? '0' : 'auto',
                right: piece.side === 'right' ? '0' : 'auto',
                bottom: '0',
                width: `${piece.size}px`,
                height: `${piece.size * 0.6}px`,
                backgroundColor: piece.color,
                borderRadius: '2px',
                animationDelay: `${piece.delay}s`,
                ['--cx' as string]: `${piece.cx}px`,
                ['--cy' as string]: `${piece.cy}px`,
                ['--cr' as string]: `${piece.cr}deg`,
              }}
            />
          ))}
        </div>
      )}

      {/* Falling confetti after burst */}
      {confettiPieces.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-10">
          {confettiPieces.map((piece) => (
            <div
              key={`fall-${piece.id}`}
              className="absolute confetti-fall"
              style={{
                left: `${50 + (piece.side === 'left' ? -1 : 1) * (10 + Math.random() * 30)}%`,
                top: '0',
                width: `${piece.size}px`,
                height: `${piece.size * 0.6}px`,
                backgroundColor: piece.color,
                borderRadius: '2px',
                animationDelay: `${piece.fallDelay}s`,
                animationDuration: `${piece.fallDuration}s`,
                ['--cr' as string]: `${piece.cr}deg`,
              }}
            />
          ))}
        </div>
      )}

      {isAdmin && (
        <button
          onClick={handleEndCeremony}
          className="fixed top-4 right-4 z-30 flex items-center gap-2 px-5 py-3 rounded-full bg-green-700 text-white font-semibold text-sm hover:bg-green-800 transition-colors shadow-lg"
        >
          <X className="w-5 h-5" strokeWidth={2} />
          Finale beenden
        </button>
      )}

      {/* Countdown phase */}
      {phase === 'countdown' && (
        <div className="flex flex-col items-center justify-center">
          <div className="bg-green-600 rounded-3xl px-8 py-6 mb-8">
            <p className="text-white text-lg font-medium text-center">
              Das Finale beginnt in...
            </p>
          </div>
          <div
            key={countdown}
            className="countdown-pop text-8xl sm:text-9xl font-bold text-green-700"
          >
            {countdown}
          </div>
        </div>
      )}

      {/* Podium phase */}
      {phase === 'podium' && (
        <div className="flex flex-col items-center justify-center w-full max-w-2xl">
          {/* Big green box */}
          <div className="bg-green-600 rounded-3xl p-6 sm:p-10 w-full shadow-2xl relative z-20">
            <h2 className="text-white text-2xl sm:text-3xl font-bold text-center mb-8">
              Siegerpodium
            </h2>

            {/* Podium */}
            <div className="flex items-end justify-center gap-2 sm:gap-4 mb-6">
              {podiumConfig.map(({ rank, height, medal, order }) => {
                const group = getPodiumGroup(rank);
                const user = group?.[0];
                const tieCount = group ? group.length - 1 : 0;
                const stepForRank = getRevealStepForRank(rank);
                const isRevealed = revealStep >= stepForRank && !!user;
                const showWobble = revealStep > stepForRank && !!user;

                return (
                  <div
                    key={rank}
                    className={`flex flex-col items-center ${order}`}
                  >
                    {/* Name above podium */}
                    <div className="mb-2 min-h-[4rem] flex flex-col items-center justify-end">
                      {isRevealed && user && (
                        <div
                          className={`fade-in-up ${showWobble ? 'podium-wobble' : ''}`}
                        >
                          {tieCount > 0 && (
                            <button
                              onClick={() =>
                                setExpandedRanks((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(rank)) next.delete(rank);
                                  else next.add(rank);
                                  return next;
                                })
                              }
                              className="text-white/60 text-[10px] text-center mb-0.5 hover:text-white transition-colors"
                            >
                              {expandedRanks.has(rank) ? '− ausblenden' : `+ ${tieCount}`}
                            </button>
                          )}
                          <button
                            onClick={() => openPopup(user.id)}
                            className="hover:underline decoration-white/50 underline-offset-2"
                          >
                            <p className="text-white text-sm sm:text-base font-semibold text-center">
                              {user.username}
                            </p>
                          </button>
                          <p className="text-white/70 text-xs text-center">
                            {user.displayScore} Punkte
                          </p>
                          {tieCount > 0 && expandedRanks.has(rank) && group && (
                            <div className="mt-1 flex flex-col gap-0.5">
                              {group.slice(1).map((tiedUser) => (
                                <button
                                  key={tiedUser.id}
                                  onClick={() => openPopup(tiedUser.id)}
                                  className="text-white/80 text-xs text-center hover:underline decoration-white/50 underline-offset-2"
                                >
                                  {tiedUser.username}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Medal/crown */}
                    <div className="mb-1 h-8 flex items-center justify-center">
                      {isRevealed && (
                        <span
                          className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${medal} fade-in-up`}
                        >
                          {rank === 1 ? (
                            <Crown className="w-4 h-4" strokeWidth={2} />
                          ) : (
                            rank
                          )}
                        </span>
                      )}
                    </div>

                    {/* Podium block */}
                    <div
                      className={`${height} w-20 sm:w-28 rounded-t-xl flex items-center justify-center podium-rise ${
                        rank === 1
                          ? 'bg-green-800'
                          : rank === 2
                          ? 'bg-green-700'
                          : 'bg-green-700/80'
                      } ${isRevealed ? '' : 'opacity-0'}`}
                      style={{ transitionDelay: `${stepForRank * 100}ms` }}
                    >
                      <span className="text-white text-3xl sm:text-4xl font-bold opacity-50">
                        {rank}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 4th and 5th place */}
            <div className="flex justify-center gap-8 mt-4 min-h-[3rem]">
              {places4and5.map((user, i) => {
                const rank = i + 4;
                const isRevealed = revealStep >= 5 || (revealStep >= 4 && i === 0);
                return (
                  <div key={user?.id || i} className="h-12">
                    {isRevealed && user && (
                      <div className="fade-in-up text-center">
                        <button
                          onClick={() => openPopup(user.id)}
                          className="hover:underline decoration-white/50 underline-offset-2"
                        >
                          <p className="text-white/80 text-sm font-medium">
                            {rank}. {user.username}
                          </p>
                        </button>
                        <p className="text-white/50 text-xs">
                          {user.displayScore} Punkte
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-white/50 text-xs text-center mt-6">
              Tippe auf einen Namen, um den Beitrag zu sehen
            </p>
          </div>
        </div>
      )}

      {/* Post popup modal */}
      {popupUserId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => { setPopupUserId(null); setPopupData(null); }}
        >
          <div
            className="bg-tan-100 rounded-3xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-green-700">
                {top5ForPopup.find((u) => u.id === popupUserId)?.username ?? 'Beitrag'}
              </h3>
              <button
                onClick={() => { setPopupUserId(null); setPopupData(null); }}
                className="p-2 rounded-full bg-green-700 text-white hover:bg-green-800 transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Like / Favorite counts */}
            {popupData && (popupData.likeCount > 0 || popupData.favoriteCount > 0) && (
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-green-700">
                  <Heart className="w-3.5 h-3.5" strokeWidth={2} />
                  {popupData.likeCount}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-yellow-600">
                  <Star className="w-3.5 h-3.5" strokeWidth={2} />
                  {popupData.favoriteCount}
                </span>
              </div>
            )}

            {popupLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {popupData && (
              <>
                {/* Photos */}
                {popupData.photos.filter((p) => p.spot_index < BONUS_SPOT_BASE).length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="w-4 h-4 text-green-600" strokeWidth={1.5} />
                      <p className="text-green-700 text-xs font-medium">Foto-Stops</p>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {popupData.photos
                        .filter((p) => p.spot_index < BONUS_SPOT_BASE)
                        .sort((a, b) => a.spot_index - b.spot_index)
                        .map((photo) => (
                          <div key={photo.id}>
                            <img
                              src={getPhotoUrl(photo.storage_path)}
                              alt={PHOTO_SPOTS[photo.spot_index]?.label ?? 'Photo'}
                              className="w-full aspect-square object-cover rounded-xl cursor-zoom-in transition-transform hover:scale-[1.03]"
                              onClick={() => setModalSrc(getPhotoUrl(photo.storage_path))}
                            />
                            <p className="text-green-600 text-[10px] mt-1 truncate">
                              {PHOTO_SPOTS[photo.spot_index]?.label ?? ''}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Bonus photos */}
                {popupData.photos.filter((p) => p.spot_index >= BONUS_SPOT_BASE).length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="w-4 h-4 text-green-600" strokeWidth={1.5} />
                      <p className="text-green-700 text-xs font-medium">Bonus-Fotos</p>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {popupData.photos
                        .filter((p) => p.spot_index >= BONUS_SPOT_BASE)
                        .sort((a, b) => a.spot_index - b.spot_index)
                        .map((photo) => (
                          <img
                            key={photo.id}
                            src={getPhotoUrl(photo.storage_path)}
                            alt="Bonus"
                            className="w-full aspect-square object-cover rounded-xl cursor-zoom-in transition-transform hover:scale-[1.03]"
                            onClick={() => setModalSrc(getPhotoUrl(photo.storage_path))}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Poll answers */}
                {popupData.pollAnswers.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ListChecks className="w-4 h-4 text-green-600" strokeWidth={1.5} />
                      <p className="text-green-700 text-xs font-medium">Quiz-Ergebnisse</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {popupData.pollAnswers
                        .sort((a, b) => a.poll_index - b.poll_index)
                        .map((ans) => {
                          const poll = POLL_QUESTIONS[ans.poll_index];
                          if (!poll) return null;
                          return (
                            <div key={ans.id} className="bg-green-600 rounded-xl p-3">
                              <p className="text-white text-xs mb-1">
                                {ans.poll_index + 1}. {poll.question}
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="text-white/60 text-xs">
                                  Antwort: {poll.options[ans.selected_option]}
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

                {/* Review answers */}
                {popupData.textEntry && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-green-600" strokeWidth={1.5} />
                      <p className="text-green-700 text-xs font-medium">Rezension</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {[
                        popupData.textEntry.answer_q1,
                        popupData.textEntry.answer_q2,
                        popupData.textEntry.answer_q3,
                        popupData.textEntry.answer_q4,
                      ].map((answer, i) => answer && answer.trim() && (
                        <div key={i} className="bg-green-600 rounded-xl p-3">
                          <p className="text-white/60 text-[10px] mb-1">{i + 1}. {REVIEW_QUESTIONS[i]}</p>
                          <p className="text-white text-sm leading-relaxed">{answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {popupData.photos.length === 0 && popupData.pollAnswers.length === 0 && !popupData.textEntry && (
                  <p className="text-green-600 text-sm text-center py-8">
                    Noch keine Beiträge.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Image zoom modal */}
      {modalSrc && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setModalSrc(null)}
        >
          <img
            src={modalSrc}
            alt="Foto"
            className="max-w-full max-h-full rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setModalSrc(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}
