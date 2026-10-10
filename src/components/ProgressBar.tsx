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
        {/* Wave animation along the bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-2 pointer-events-none overflow-hidden">
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
      </div>
    </div>
  );
}
