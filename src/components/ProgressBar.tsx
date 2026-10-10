import { MAX_POINTS } from '@/lib/data';

type ProgressBarProps = {
  score: number;
};

export default function ProgressBar({ score }: ProgressBarProps) {
  const pct = Math.min((score / MAX_POINTS) * 100, 100);

  return (
    <div className="w-full">
      <div className="relative w-full h-10 bg-white rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-3"
          style={{ width: `${pct}%` }}
        >
          {pct > 15 && (
            <span className="text-white text-xs font-bold">{score}</span>
          )}
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-green-700 text-xs font-semibold">
            {score} / {MAX_POINTS}
          </span>
        </div>
      </div>
    </div>
  );
}
