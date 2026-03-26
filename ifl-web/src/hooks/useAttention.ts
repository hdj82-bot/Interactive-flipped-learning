'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { ToastData } from '@/components/ui/Toast';

const WARNING_MESSAGES: Record<number, string> = {
  1: '집중해 주세요! 🙏',
  2: '대면 수업 때 혼나요! 😅',
  3: '이러면 점수 드릴 수가 없어요 😢',
};

const HEARTBEAT_INTERVAL = 10_000; // 10초
const NO_RESPONSE_TIMEOUT = 30_000; // 30초

interface AttentionState {
  warningLevel: number;
  isPaused: boolean;
  noResponseCnt: number;
}

interface UseAttentionOptions {
  sessionId: string | null;
  playing: boolean;
  onPause: () => void;
  addToast: (toast: Omit<ToastData, 'id'>) => void;
}

export function useAttention({ sessionId, playing, onPause, addToast }: UseAttentionOptions) {
  const [state, setState] = useState<AttentionState>({
    warningLevel: 0,
    isPaused: false,
    noResponseCnt: 0,
  });

  const lastInteractionRef = useRef(Date.now());
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const noResponseRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const networkUnstableRef = useRef(false);
  const progressRef = useRef(0);

  // 사용자 인터랙션 기록
  const recordInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now();
  }, []);

  // progress 업데이트 (외부에서 호출)
  const updateProgress = useCallback((sec: number) => {
    progressRef.current = sec;
  }, []);

  // 네트워크 상태 감지
  useEffect(() => {
    const onOffline = () => { networkUnstableRef.current = true; };
    const onOnline = () => { networkUnstableRef.current = false; };
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  // 인터랙션 이벤트 리스너
  useEffect(() => {
    const handler = () => recordInteraction();
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
    };
  }, [recordInteraction]);

  // Heartbeat 전송
  useEffect(() => {
    if (!sessionId || !playing) {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      return;
    }

    heartbeatRef.current = setInterval(() => {
      api
        .post('/attention/heartbeat', {
          session_id: sessionId,
          progress_seconds: progressRef.current,
          is_network_unstable: networkUnstableRef.current,
        })
        .catch(() => {});
    }, HEARTBEAT_INTERVAL);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [sessionId, playing]);

  // 무반응 감지
  useEffect(() => {
    if (!sessionId || !playing) {
      if (noResponseRef.current) clearInterval(noResponseRef.current);
      return;
    }

    noResponseRef.current = setInterval(async () => {
      // 네트워크 불안정 시 타이머 중단
      if (networkUnstableRef.current) return;

      const elapsed = Date.now() - lastInteractionRef.current;
      if (elapsed < NO_RESPONSE_TIMEOUT) return;

      try {
        const res = await api.post<{
          warning_level: number;
          message: string | null;
          should_pause: boolean;
          no_response_cnt: number;
        }>('/attention/no-response', { session_id: sessionId });

        setState({
          warningLevel: res.warning_level,
          isPaused: res.should_pause,
          noResponseCnt: res.no_response_cnt,
        });

        if (res.message) {
          const type = res.warning_level >= 3 ? 'error' : res.warning_level >= 2 ? 'warning' : 'info';
          addToast({
            message: res.message,
            type,
            durationMs: res.should_pause ? 60_000 : 5_000,
          });
        }

        if (res.should_pause) {
          onPause();
        }

        // 경고 후 인터랙션 타이머 리셋
        lastInteractionRef.current = Date.now();
      } catch {
        /* 무시 */
      }
    }, 5_000); // 5초마다 체크

    return () => {
      if (noResponseRef.current) clearInterval(noResponseRef.current);
    };
  }, [sessionId, playing, onPause, addToast]);

  // 세션 재개
  const resume = useCallback(async () => {
    if (!sessionId) return;
    try {
      await api.post('/attention/resume', { session_id: sessionId });
      setState((s) => ({ ...s, isPaused: false }));
      lastInteractionRef.current = Date.now();
    } catch {
      /* 무시 */
    }
  }, [sessionId]);

  return {
    ...state,
    recordInteraction,
    updateProgress,
    resume,
  };
}
