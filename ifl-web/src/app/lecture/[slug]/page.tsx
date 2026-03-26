'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAttention } from '@/hooks/useAttention';
import LanguageSelectModal from '@/components/LanguageSelectModal';
import MicConsentModal from '@/components/MicConsentModal';
import AttentionPauseOverlay from '@/components/AttentionPauseOverlay';
import ToastContainer, { type ToastData } from '@/components/ui/Toast';
import {
  Play,
  Pause,
  MessageCircleQuestion,
  Send,
  ClipboardCheck,
  WifiOff,
  Globe,
  Volume2,
} from 'lucide-react';

/* ── 타입 ─────────────────────────────────────────────────── */
interface Session {
  id: string;
  status: string;
  progressPct: number;
  watchedSec: number;
  totalSec: number;
}

interface QAEntry {
  question: string;
  answer: string | null;
  loading?: boolean;
  outOfScope?: boolean;
}

/* ── 온보딩 단계 ──────────────────────────────────────────── */
type OnboardingStep = 'language' | 'mic' | 'done';

export default function LecturePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const slug = params.slug as string;

  // 온보딩
  const [step, setStep] = useState<OnboardingStep>('language');
  const [language, setLanguage] = useState('ko');
  const [micGranted, setMicGranted] = useState(false);

  // 세션 & 플레이어
  const [session, setSession] = useState<Session | null>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [offline, setOffline] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Q&A 채팅
  const [qaOpen, setQaOpen] = useState(false);
  const [qaInput, setQaInput] = useState('');
  const [qaHistory, setQaHistory] = useState<QAEntry[]>([]);
  const qaEndRef = useRef<HTMLDivElement>(null);

  // 토스트
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const addToast = useCallback((t: Omit<ToastData, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...t, id }]);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 집중 경고
  const attention = useAttention({
    sessionId: session?.id ?? null,
    playing,
    onPause: () => setPlaying(false),
    addToast,
  });

  /* ── 네트워크 감지 ──────────────────────────────────────── */
  useEffect(() => {
    const onOff = () => {
      setOffline(true);
      if (session) {
        api.patch(`/sessions/${session.id}`, {
          status: 'PAUSED',
          watchedSec: elapsed,
          pauseReason: 'network_disconnect',
        }).catch(() => {});
      }
    };
    const onOn = () => {
      setOffline(false);
      if (session) {
        api.patch(`/sessions/${session.id}`, { status: 'IN_PROGRESS' }).catch(() => {});
      }
    };
    window.addEventListener('offline', onOff);
    window.addEventListener('online', onOn);
    return () => {
      window.removeEventListener('offline', onOff);
      window.removeEventListener('online', onOn);
    };
  }, [session, elapsed]);

  /* ── 타이머 ─────────────────────────────────────────────── */
  useEffect(() => {
    if (playing && !attention.isPaused) {
      timerRef.current = setInterval(() => {
        setElapsed((e) => {
          const next = e + 1;
          attention.updateProgress(next);
          return next;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, attention.isPaused]);

  /* ── Q&A 스크롤 ─────────────────────────────────────────── */
  useEffect(() => {
    qaEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [qaHistory]);

  /* ── 핸들러 ─────────────────────────────────────────────── */
  const handleLanguageSelect = (lang: string) => {
    setLanguage(lang);
    setStep('mic');
  };

  const handleMicConsent = (granted: boolean) => {
    setMicGranted(granted);
    setStep('done');
  };

  const startSession = async () => {
    try {
      const s = await api.post<Session>('/sessions', {
        lectureId: slug,
        totalSec: 3600,
      });
      setSession(s);
      setPlaying(true);
      // 집중 경고 세션도 시작
      if (user) {
        api.post('/attention/session', {
          session_id: s.id,
          user_id: user.userId,
          lecture_id: slug,
        }).catch(() => {});
      }
    } catch {
      /* noop */
    }
  };

  const togglePlay = async () => {
    if (!session) return;
    if (playing) {
      await api.patch(`/sessions/${session.id}`, {
        status: 'PAUSED',
        watchedSec: elapsed,
        pauseReason: 'user_pause',
      }).catch(() => {});
      setPlaying(false);
    } else {
      await api.patch(`/sessions/${session.id}`, { status: 'IN_PROGRESS' }).catch(() => {});
      setPlaying(true);
    }
  };

  const handleResume = async () => {
    await attention.resume();
    setPlaying(true);
    attention.recordInteraction();
  };

  const handleAsk = async () => {
    if (!qaInput.trim() || !session) return;
    const q = qaInput.trim();
    setQaInput('');
    setQaHistory((h) => [...h, { question: q, answer: null, loading: true }]);
    attention.recordInteraction();

    try {
      const res = await api.post<{ answer: string; outOfScope?: boolean }>(
        `/qa/${session.id}`,
        { question: q, language },
      );
      setQaHistory((h) =>
        h.map((e) =>
          e.question === q && e.loading
            ? { ...e, answer: res.answer, loading: false, outOfScope: res.outOfScope }
            : e,
        ),
      );
    } catch {
      setQaHistory((h) =>
        h.map((e) =>
          e.question === q && e.loading
            ? { ...e, answer: '답변을 가져올 수 없습니다.', loading: false }
            : e,
        ),
      );
    }
  };

  const goToAssess = () => router.push(`/lecture/${slug}/assess`);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  /* ── 로딩 ───────────────────────────────────────────────── */
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  /* ── 렌더 ───────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* 온보딩 모달 */}
      <LanguageSelectModal open={step === 'language'} onSelect={handleLanguageSelect} />
      <MicConsentModal open={step === 'mic'} onConsent={handleMicConsent} />

      {/* 토스트 알림 */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* 오프라인 배너 */}
      {offline && (
        <div className="bg-yellow-500 text-black text-sm text-center py-2 flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          네트워크 연결이 끊겼습니다. 재연결 시 자동으로 이어집니다.
        </div>
      )}

      {/* 메인 레이아웃 */}
      <div className="flex h-[calc(100vh-env(safe-area-inset-bottom))]">
        {/* ── 좌측: 비디오 영역 ─────────────────────────────── */}
        <div className="flex-1 flex flex-col p-4">
          {/* 상단 바 */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-sm font-medium text-gray-400 truncate">강의 시청</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setStep('language');
                }}
                className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20 transition"
              >
                <Globe className="h-3.5 w-3.5" />
                {language.toUpperCase()}
              </button>
              {micGranted && <Volume2 className="h-4 w-4 text-green-400" />}
            </div>
          </div>

          {/* 비디오 플레이어 */}
          <div className="relative flex-1 bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
            {!session ? (
              <button
                onClick={startSession}
                disabled={step !== 'done'}
                className="flex flex-col items-center gap-3 text-gray-400 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <div className="h-20 w-20 rounded-full bg-white/10 flex items-center justify-center">
                  <Play className="h-10 w-10 ml-1" />
                </div>
                <span className="text-sm">시청 시작</span>
              </button>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                <p className="text-lg">AI 아바타 강의 영상 영역</p>
              </div>
            )}

            {/* 집중 경고 일시정지 오버레이 */}
            {attention.isPaused && session && (
              <AttentionPauseOverlay
                warningLevel={attention.warningLevel}
                onResume={handleResume}
              />
            )}
          </div>

          {/* 컨트롤 바 */}
          {session && (
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={togglePlay}
                disabled={attention.isPaused}
                className="rounded-full bg-white/10 p-2.5 hover:bg-white/20 transition disabled:opacity-40"
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>

              <div className="flex-1">
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-1000"
                    style={{
                      width: `${session.totalSec > 0 ? (elapsed / session.totalSec) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <span className="text-xs text-gray-400 tabular-nums">
                {formatTime(elapsed)} / {formatTime(session.totalSec)}
              </span>

              <button
                onClick={() => setQaOpen(!qaOpen)}
                className={`rounded-lg px-3 py-2 text-xs flex items-center gap-1.5 transition ${
                  qaOpen ? 'bg-primary-600 text-white' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <MessageCircleQuestion className="h-3.5 w-3.5" />
                Q&A
              </button>

              <button
                onClick={goToAssess}
                className="rounded-lg bg-white/10 px-3 py-2 text-xs flex items-center gap-1.5 hover:bg-white/20 transition"
              >
                <ClipboardCheck className="h-3.5 w-3.5" />
                평가
              </button>
            </div>
          )}
        </div>

        {/* ── 우측: 채팅 패널 ───────────────────────────────── */}
        {qaOpen && session && (
          <div className="w-96 border-l border-gray-800 flex flex-col bg-gray-900/50">
            <div className="px-4 py-3 border-b border-gray-800 text-sm font-medium flex items-center justify-between">
              <span>AI Q&A</span>
              <button
                onClick={() => setQaOpen(false)}
                className="text-gray-500 hover:text-gray-300 text-xs"
              >
                닫기
              </button>
            </div>

            {/* 채팅 메시지 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {qaHistory.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-12">
                  강의 내용에 대해 궁금한 점을 질문하세요.
                </p>
              )}

              {qaHistory.map((entry, i) => (
                <div key={i} className="space-y-2">
                  {/* 질문 (우측) */}
                  <div className="flex justify-end">
                    <div className="bg-primary-600 rounded-xl rounded-br-sm px-4 py-2 text-sm max-w-[85%]">
                      {entry.question}
                    </div>
                  </div>

                  {/* 답변 (좌측) */}
                  <div className="flex justify-start">
                    <div
                      className={`rounded-xl rounded-bl-sm px-4 py-2 text-sm max-w-[85%] ${
                        entry.outOfScope
                          ? 'bg-red-900/40 text-red-300 border border-red-800'
                          : 'bg-gray-800'
                      }`}
                    >
                      {entry.loading ? (
                        <span className="inline-flex gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-500 animate-bounce" />
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:0.15s]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:0.3s]" />
                        </span>
                      ) : (
                        <>
                          {entry.outOfScope && (
                            <span className="block text-xs text-red-400 mb-1 font-medium">
                              ⚠ 강의 범위 외 질문입니다
                            </span>
                          )}
                          {entry.answer}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={qaEndRef} />
            </div>

            {/* 입력 */}
            <div className="p-3 border-t border-gray-800 flex gap-2">
              <input
                type="text"
                value={qaInput}
                onChange={(e) => setQaInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                placeholder="질문을 입력하세요..."
                className="flex-1 rounded-lg bg-gray-800 border-none px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary-500 placeholder-gray-500"
              />
              <button
                onClick={handleAsk}
                disabled={!qaInput.trim()}
                className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm hover:bg-primary-700 disabled:opacity-40 transition"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
