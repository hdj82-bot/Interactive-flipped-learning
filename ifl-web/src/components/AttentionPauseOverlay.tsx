'use client';

import { Play } from 'lucide-react';

const WARNINGS = [
  {
    level: 1,
    emoji: '🙏',
    title: '집중해 주세요!',
    desc: '잠시 활동이 없었습니다. 계속 시청하려면 아래 버튼을 눌러주세요.',
    bg: 'from-amber-900/90 to-amber-950/90',
    btn: 'bg-amber-500 hover:bg-amber-600',
  },
  {
    level: 2,
    emoji: '😅',
    title: '대면 수업 때 혼나요!',
    desc: '두 번째 경고입니다. 집중해서 강의를 시청해 주세요.',
    bg: 'from-orange-900/90 to-orange-950/90',
    btn: 'bg-orange-500 hover:bg-orange-600',
  },
  {
    level: 3,
    emoji: '😢',
    title: '이러면 점수 드릴 수가 없어요',
    desc: '마지막 경고입니다. 이후에도 집중하지 않으면 출석이 인정되지 않을 수 있습니다.',
    bg: 'from-red-900/90 to-red-950/90',
    btn: 'bg-red-500 hover:bg-red-600',
  },
];

interface Props {
  warningLevel: number;
  onResume: () => void;
}

export default function AttentionPauseOverlay({ warningLevel, onResume }: Props) {
  const idx = Math.max(0, Math.min(warningLevel, 3) - 1);
  const warn = WARNINGS[idx];

  return (
    <div
      className={`absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-b ${warn.bg} backdrop-blur-sm`}
    >
      <span className="text-6xl mb-5 drop-shadow-lg">{warn.emoji}</span>
      <h2 className="text-2xl font-bold text-white mb-2">{warn.title}</h2>
      <p className="text-sm text-white/70 text-center max-w-xs mb-8 leading-relaxed">
        {warn.desc}
      </p>
      <button
        onClick={onResume}
        className={`flex items-center gap-2 rounded-xl px-8 py-3.5 text-white font-semibold text-sm shadow-lg transition active:scale-95 ${warn.btn}`}
      >
        <Play className="h-5 w-5" />
        계속 보기
      </button>

      {/* 경고 레벨 인디케이터 */}
      <div className="flex gap-1.5 mt-6">
        {[1, 2, 3].map((l) => (
          <div
            key={l}
            className={`h-1.5 w-6 rounded-full transition-colors ${
              l <= warningLevel ? 'bg-white' : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
