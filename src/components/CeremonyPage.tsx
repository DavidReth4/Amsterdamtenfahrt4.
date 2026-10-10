import { useState, useEffect, useRef, useMemo } from 'react';
import { Crown, X } from 'lucide-react';
import {
  supabase,
  ADMIN_USERNAME,
  type GrachtenUser,
  type CeremonyState,
} from '@/lib/supabase';

type CeremonyPageProps = {
  currentUser: GrachtenUser;
  onCeremonyEnd: () => void;
};

type RankedUser = {
  id: string;
  username: string;
  total_score: number;
};

export default function CeremonyPage({ currentUser, onCeremonyEnd }: CeremonyPageProps) {
  const [phase, setPhase] = useState<'countdown' | 'podium'>('countdown');
  const [countdown, setCountdown] = useState(10);
  const [rankedUsers, setRankedUsers] = useState<RankedUser[]>([]);
  const [revealStep, setRevealStep] = useState(0);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
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

  const colors = ['#ffffff', '#f0f0f0', '#e8e8e8', '#fafafa'];

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
    const { data, error } = await supabase
      .from('grachten_users')
      .select('id, username, total_score')
      .neq('username', ADMIN_USERNAME)
      .order('total_score', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load ranked users:', error);
      return;
    }
    setRankedUsers((data || []) as RankedUser[]);
  };

  const autoSubmitAll = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    try {
      const { data: users } = await supabase
        .from('grachten_users')
        .select('id')
        .neq('username', ADMIN_USERNAME);

      if (!users) return;

      for (const u of users) {
        await supabase
          .from('grachten_users')
          .update({ total_score: u.total_score })
          .eq('id', u.id);
      }
    } catch (err) {
      console.error('Auto-submit failed:', err);
    }
  };

  const handleEndCeremony = async () => {
    await supabase
      .from('ceremony_state')
      .update({ is_active: false, phase: 'ended', ended_at: new Date().toISOString() })
      .eq('id', 1);
    onCeremonyEnd();
  };

  const top3 = rankedUsers.slice(0, 3);
  const places4and5 = rankedUsers.slice(3, 5);

  const podiumConfig = [
    { rank: 1, height: 'h-40', medal: 'bg-yellow-400 text-yellow-900', order: 'order-2' },
    { rank: 2, height: 'h-28', medal: 'bg-gray-300 text-gray-700', order: 'order-1' },
    { rank: 3, height: 'h-20', medal: 'bg-orange-400 text-orange-900', order: 'order-3' },
  ];

  const getPodiumUser = (rank: number) => top3[rank - 1];

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
                const user = getPodiumUser(rank);
                const isRevealed = revealStep >= rank;
                const showWobble = revealStep > rank;

                return (
                  <div
                    key={rank}
                    className={`flex flex-col items-center ${order}`}
                  >
                    {/* Name above podium */}
                    <div className="mb-2 h-12 flex items-center justify-center">
                      {isRevealed && user && (
                        <div
                          className={`fade-in-up ${showWobble ? 'podium-wobble' : ''}`}
                        >
                          <p className="text-white text-sm sm:text-base font-semibold text-center">
                            {user.username}
                          </p>
                          <p className="text-white/70 text-xs text-center">
                            {user.total_score} Punkte
                          </p>
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
                      style={{ transitionDelay: `${rank * 100}ms` }}
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
                        <p className="text-white/80 text-sm font-medium">
                          {rank}. {user.username}
                        </p>
                        <p className="text-white/50 text-xs">
                          {user.total_score} Punkte
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
