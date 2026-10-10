import { useEffect, useState } from 'react';

type LeaderboardUser = {
  id: string;
  username: string;
  total_score: number;
};

type LeaderboardBarProps = {
  score: number;
  rank: number | null;
  topUsers: LeaderboardUser[];
};

type RollingValueProps = {
  value: string | number;
  className?: string;
};

type Roll = {
  from: string | number;
  to: string | number;
  direction: 'up' | 'down';
};

const podiumPositions = [
  { label: '2.', height: 'h-5', rank: 2 },
  { label: '1.', height: 'h-8', rank: 1 },
  { label: '3.', height: 'h-3', rank: 3 },
];

function RollingValue({ value, className = '' }: RollingValueProps) {
  const [currentValue, setCurrentValue] = useState<string | number>(value);
  const [roll, setRoll] = useState<Roll | null>(null);

  useEffect(() => {
    if (Object.is(value, currentValue)) return;

    const direction =
      typeof value === 'number' && typeof currentValue === 'number' && value < currentValue
        ? 'down'
        : 'up';

    setRoll({ from: currentValue, to: value, direction });
  }, [value, currentValue]);

  const handleRollEnd = () => {
    if (!roll) return;
    setCurrentValue(roll.to);
    setRoll(null);
  };

  return (
    <span className={`roll-window ${className}`}>
      {roll ? (
        <span className={`roll-track roll-${roll.direction}`} onAnimationEnd={handleRollEnd}>
          <span className="roll-old">{roll.from}</span>
          <span className="roll-new">{roll.to}</span>
        </span>
      ) : (
        <span className="roll-static">{currentValue}</span>
      )}
    </span>
  );
}

export default function LeaderboardBar({ score, rank, topUsers }: LeaderboardBarProps) {
  // Group users by score to determine shared podium positions
  const sorted = [...topUsers].sort((a, b) => b.total_score - a.total_score);
  const rankOneUsers = sorted.filter((u) => u.total_score === sorted[0]?.total_score);
  const rankTwoScore = sorted.find((u) => u.total_score !== sorted[0]?.total_score)?.total_score;
  const rankTwoUsers = rankTwoScore !== undefined ? sorted.filter((u) => u.total_score === rankTwoScore) : [];
  const usedScores = new Set([sorted[0]?.total_score, rankTwoScore].filter((v) => v !== undefined));
  const rankThreeScore = sorted.find((u) => !usedScores.has(u.total_score))?.total_score;
  const rankThreeUsers = rankThreeScore !== undefined ? sorted.filter((u) => u.total_score === rankThreeScore) : [];

  const podiumGroups = [rankTwoUsers, rankOneUsers, rankThreeUsers];

  return (
    <div className="fixed bottom-3 left-1/2 z-40 flex h-[88px] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 items-center rounded-3xl bg-white px-4 shadow-[4px_4px_12px_rgba(0,0,0,0.12)] overflow-hidden sm:bottom-5 sm:h-[96px] sm:px-6">
      {/* Wave animation along the bottom edge */}
      <div className="absolute bottom-0 left-0 right-0 h-2 pointer-events-none">
        <svg
          className="progress-wave absolute bottom-0 h-2 w-[200%]"
          viewBox="0 0 1200 8"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,4 C50,0 100,8 150,4 C200,0 250,8 300,4 C350,0 400,8 450,4 C500,0 550,8 600,4 C650,0 700,8 750,4 C800,0 850,8 900,4 C950,0 1000,8 1050,4 C1100,0 1150,8 1200,4 L1200,8 L0,8 Z"
            fill="#000"
          />
          <path
            d="M1200,4 C1250,0 1300,8 1350,4 C1400,0 1450,8 1500,4 C1550,0 1600,8 1650,4 C1700,0 1750,8 1800,4 C1850,0 1900,8 1950,4 C2000,0 2050,8 2100,4 C2150,0 2200,8 2250,4 C2300,0 2350,8 2400,4 L2400,8 L1200,8 Z"
            fill="#000"
          />
        </svg>
      </div>
      <div className="w-16 shrink-0 text-left sm:w-24">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-green-700">Punkte</p>
        <p className="text-2xl font-bold leading-none text-black sm:text-3xl">
          <RollingValue value={score} />
        </p>
      </div>

      <div className="flex min-w-0 flex-1 items-end justify-center gap-2 self-stretch px-2 pt-3 sm:gap-4 sm:px-6">
        {podiumPositions.map((position, idx) => {
          const groupUsers = podiumGroups[idx];

          return (
            <div key={position.label} className="flex min-w-0 flex-1 flex-col items-center justify-end">
              {groupUsers && groupUsers.length > 0 ? (
                <>
                  <div className="flex flex-col items-center mb-1 max-w-full">
                    {groupUsers.map((u) => (
                      <p
                        key={u.id}
                        className="max-w-full truncate text-center text-[10px] font-semibold text-black sm:text-xs leading-tight"
                      >
                        <RollingValue value={u.username} className="max-w-full" />
                      </p>
                    ))}
                  </div>
                  <div className={`w-full max-w-20 bg-black ${position.height}`} aria-label={`Platz ${position.label}`} />
                </>
              ) : (
                <>
                  <div className="mb-1 h-4" />
                  <div className={`w-full max-w-20 bg-gray-200 ${position.height}`} aria-label={`Platz ${position.label} (leer)`} />
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="w-16 shrink-0 text-right sm:w-24">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-green-700">Platz</p>
        <p className="text-2xl font-bold leading-none text-black sm:text-3xl">
          {rank !== null ? <RollingValue value={rank} /> : ''}
        </p>
      </div>
    </div>
  );
}
