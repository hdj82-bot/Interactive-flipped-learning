'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Info, XCircle, X } from 'lucide-react';

/* ── 타입 ─────────────────────────────────────────────────── */

export interface ToastData {
  id: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'attention';
  /** @deprecated use type */
  level?: 'info' | 'warning' | 'error';
  durationMs?: number;
  /** @deprecated use durationMs */
  duration?: number;
}

/* ── 집중 경고 3단계 프리셋 ──────────────────────────────── */

export const ATTENTION_TOASTS = {
  level1: { message: '집중해 주세요! 🙏', type: 'info' as const, durationMs: 4000 },
  level2: { message: '대면 수업 때 혼나요! 😅', type: 'warning' as const, durationMs: 5000 },
  level3: { message: '이러면 점수 드릴 수가 없어요 😢', type: 'error' as const, durationMs: 60000 },
} as const;

export function attentionToast(level: 1 | 2 | 3): Omit<ToastData, 'id'> {
  const key = `level${level}` as keyof typeof ATTENTION_TOASTS;
  return ATTENTION_TOASTS[key];
}

/* ── 스타일 매핑 ──────────────────────────────────────────── */

const STYLES = {
  info: { bg: 'bg-blue-600', icon: Info },
  warning: { bg: 'bg-amber-500', icon: AlertTriangle },
  error: { bg: 'bg-red-600', icon: XCircle },
  attention: { bg: 'bg-orange-600', icon: AlertTriangle },
} as const;

/* ── 토스트 아이템 ────────────────────────────────────────── */

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const dur = toast.durationMs ?? toast.duration ?? 5000;
    if (dur <= 0) return;
    const t1 = setTimeout(() => setExiting(true), dur - 300);
    const t2 = setTimeout(() => onDismiss(toast.id), dur);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [toast, onDismiss]);

  const kind = toast.type ?? toast.level ?? 'info';
  const style = STYLES[kind] ?? STYLES.info;
  const Icon = style.icon;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-5 py-3.5 text-white shadow-lg transition-all duration-300 ${
        style.bg
      } ${exiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="text-sm font-medium flex-1">{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} className="shrink-0 hover:opacity-70 transition">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ── 컨테이너 ─────────────────────────────────────────────── */

export default function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
