'use client';

interface Props {
  /** 전체 화면 모드 (min-h-screen 중앙 정렬) */
  fullScreen?: boolean;
  /** 크기: sm(16px) md(32px) lg(48px) */
  size?: 'sm' | 'md' | 'lg';
  /** 라벨 (접근성 + 시각 텍스트) */
  label?: string;
}

const SIZES = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-4', lg: 'h-12 w-12 border-4' };

export default function LoadingSpinner({ fullScreen, size = 'md', label }: Props) {
  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`animate-spin rounded-full border-primary-600 border-t-transparent ${SIZES[size]}`}
        role="status"
        aria-label={label ?? '로딩 중'}
      />
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">{spinner}</div>
    );
  }

  return spinner;
}
