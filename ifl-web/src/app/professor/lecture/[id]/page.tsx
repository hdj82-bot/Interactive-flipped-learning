'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Save,
  Play,
  ChevronLeft,
  ChevronRight,
  MessageCircleQuestion,
  Plus,
  Trash2,
  GripVertical,
  BarChart3,
  Loader2,
  Check,
} from 'lucide-react';

/* ── 타입 ── */
interface Slide {
  index: number;
  imageUrl: string;
  script: string;
  durationSec: number;
  qaTimings: QATiming[];
}

interface QATiming {
  id: string;
  offsetSec: number;
  question: string;
}

interface Lecture {
  id: string;
  title: string;
  status: string;
  slides: Slide[];
}

/* ── 타임라인 바 컴포넌트 ── */
function TimelineBar({
  slides,
  activeIndex,
  onSelect,
}: {
  slides: Slide[];
  activeIndex: number;
  onSelect: (i: number) => void;
}) {
  const totalDuration = slides.reduce((s, sl) => s + sl.durationSec, 0);
  let accumulated = 0;

  return (
    <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden flex">
      {slides.map((slide, i) => {
        const pct = totalDuration > 0 ? (slide.durationSec / totalDuration) * 100 : 100 / slides.length;
        const left = accumulated;
        accumulated += pct;
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            title={`슬라이드 ${i + 1} (${slide.durationSec}초)`}
            className={`relative h-full border-r border-white/60 transition-colors ${
              i === activeIndex
                ? 'bg-primary-500 text-white'
                : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
            }`}
            style={{ width: `${pct}%` }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold">
              {i + 1}
            </span>
            {/* Q&A 핀 마커 */}
            {slide.qaTimings.map((qa) => {
              const pinPct = slide.durationSec > 0 ? (qa.offsetSec / slide.durationSec) * 100 : 50;
              return (
                <span
                  key={qa.id}
                  className="absolute bottom-0 h-2.5 w-1.5 bg-amber-400 rounded-t-sm"
                  style={{ left: `${pinPct}%` }}
                  title={`Q: ${qa.question} @ ${qa.offsetSec}s`}
                />
              );
            })}
          </button>
        );
      })}
    </div>
  );
}

/* ── 메인 페이지 ── */
export default function ScriptEditorPage() {
  const params = useParams();
  const router = useRouter();
  const lectureId = params.id as string;

  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // 로드
  useEffect(() => {
    api
      .get<Lecture>(`/lectures/${lectureId}`)
      .then((data) => {
        setLecture(data);
        setSlides(data.slides ?? []);
      })
      .catch(() => router.push('/professor/dashboard'))
      .finally(() => setLoading(false));
  }, [lectureId, router]);

  const active = slides[activeIndex] ?? null;

  // 스크립트 수정
  const updateScript = useCallback(
    (text: string) => {
      setSlides((prev) =>
        prev.map((s, i) => (i === activeIndex ? { ...s, script: text } : s)),
      );
      setSaved(false);
    },
    [activeIndex],
  );

  // 슬라이드 시간 수정
  const updateDuration = useCallback(
    (sec: number) => {
      setSlides((prev) =>
        prev.map((s, i) => (i === activeIndex ? { ...s, durationSec: Math.max(5, sec) } : s)),
      );
      setSaved(false);
    },
    [activeIndex],
  );

  // Q&A 타이밍 핀 추가
  const addQAPin = useCallback(() => {
    setSlides((prev) =>
      prev.map((s, i) => {
        if (i !== activeIndex) return s;
        const newPin: QATiming = {
          id: `qa-${Date.now()}`,
          offsetSec: Math.floor(s.durationSec / 2),
          question: '',
        };
        return { ...s, qaTimings: [...s.qaTimings, newPin] };
      }),
    );
    setSaved(false);
  }, [activeIndex]);

  // Q&A 핀 수정
  const updateQAPin = useCallback(
    (pinId: string, field: 'offsetSec' | 'question', value: string | number) => {
      setSlides((prev) =>
        prev.map((s, i) => {
          if (i !== activeIndex) return s;
          return {
            ...s,
            qaTimings: s.qaTimings.map((q) =>
              q.id === pinId ? { ...q, [field]: value } : q,
            ),
          };
        }),
      );
      setSaved(false);
    },
    [activeIndex],
  );

  // Q&A 핀 삭제
  const removeQAPin = useCallback(
    (pinId: string) => {
      setSlides((prev) =>
        prev.map((s, i) => {
          if (i !== activeIndex) return s;
          return { ...s, qaTimings: s.qaTimings.filter((q) => q.id !== pinId) };
        }),
      );
      setSaved(false);
    },
    [activeIndex],
  );

  // 저장
  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/lectures/${lectureId}/slides`, { slides });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      /* noop */
    } finally {
      setSaving(false);
    }
  };

  // 네비게이션
  const goPrev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const goNext = () => setActiveIndex((i) => Math.min(slides.length - 1, i + 1));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!lecture || slides.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        슬라이드 데이터가 없습니다.
      </div>
    );
  }

  const totalDuration = slides.reduce((s, sl) => s + sl.durationSec, 0);
  const formatDuration = (sec: number) => `${Math.floor(sec / 60)}분 ${sec % 60}초`;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* ── 상단 헤더 ── */}
      <div className="flex items-center justify-between px-1 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold truncate max-w-md">{lecture.title}</h1>
          <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-0.5">
            {slides.length}슬라이드 · {formatDuration(totalDuration)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/professor/lecture/${lectureId}/dashboard`)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 transition"
          >
            <BarChart3 className="h-4 w-4" />
            대시보드
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            } disabled:opacity-60`}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? '저장 중...' : saved ? '저장됨' : '저장'}
          </button>
        </div>
      </div>

      {/* ── 타임라인 ── */}
      <div className="px-1 py-3">
        <TimelineBar slides={slides} activeIndex={activeIndex} onSelect={setActiveIndex} />
      </div>

      {/* ── 메인 에디터 영역 ── */}
      <div className="flex flex-1 gap-5 min-h-0 px-1">
        {/* 좌측: 스크립트 편집 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 슬라이드 네비게이션 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button onClick={goPrev} disabled={activeIndex === 0} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold">
                슬라이드 {activeIndex + 1}
                <span className="text-gray-400 font-normal"> / {slides.length}</span>
              </span>
              <button onClick={goNext} disabled={activeIndex === slides.length - 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <label className="text-gray-500">재생 시간:</label>
              <input
                type="number"
                min={5}
                max={600}
                value={active?.durationSec ?? 30}
                onChange={(e) => updateDuration(Number(e.target.value))}
                className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm text-center outline-none focus:border-primary-500"
              />
              <span className="text-gray-400 text-xs">초</span>
            </div>
          </div>

          {/* 스크립트 텍스트 에디터 */}
          <textarea
            value={active?.script ?? ''}
            onChange={(e) => updateScript(e.target.value)}
            placeholder="이 슬라이드의 강의 스크립트를 입력하세요..."
            className="flex-1 rounded-xl border border-gray-200 bg-white p-4 text-sm leading-relaxed resize-none outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-200"
          />

          {/* Q&A 타이밍 핀 설정 */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <MessageCircleQuestion className="h-4 w-4 text-amber-500" />
                질문 타이밍 핀
              </h3>
              <button
                onClick={addQAPin}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium transition"
              >
                <Plus className="h-3.5 w-3.5" />
                추가
              </button>
            </div>

            {active && active.qaTimings.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">
                핀을 추가하면 해당 시점에 학습자에게 질문이 팝업됩니다.
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {active?.qaTimings.map((pin) => (
                  <div
                    key={pin.id}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                  >
                    <GripVertical className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                    <input
                      type="number"
                      min={0}
                      max={active.durationSec}
                      value={pin.offsetSec}
                      onChange={(e) => updateQAPin(pin.id, 'offsetSec', Number(e.target.value))}
                      className="w-14 rounded-md border border-gray-300 px-2 py-1 text-xs text-center outline-none focus:border-primary-500"
                    />
                    <span className="text-xs text-gray-400">초</span>
                    <input
                      type="text"
                      value={pin.question}
                      onChange={(e) => updateQAPin(pin.id, 'question', e.target.value)}
                      placeholder="질문 내용"
                      className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-xs outline-none focus:border-primary-500"
                    />
                    <button
                      onClick={() => removeQAPin(pin.id)}
                      className="text-gray-300 hover:text-red-500 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 우측: 슬라이드 미리보기 */}
        <div className="w-[420px] shrink-0 flex flex-col">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden flex-1 flex flex-col">
            {/* 슬라이드 이미지 */}
            <div className="flex-1 bg-gray-100 flex items-center justify-center p-2">
              {active?.imageUrl ? (
                <img
                  src={active.imageUrl}
                  alt={`슬라이드 ${activeIndex + 1}`}
                  className="max-h-full max-w-full object-contain rounded"
                />
              ) : (
                <div className="text-gray-400 text-sm text-center">
                  <Play className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  슬라이드 미리보기
                </div>
              )}
            </div>

            {/* 슬라이드 썸네일 리스트 */}
            <div className="border-t border-gray-200 p-2">
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {slides.map((sl, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`shrink-0 w-16 h-10 rounded border-2 overflow-hidden transition ${
                      i === activeIndex
                        ? 'border-primary-500 ring-1 ring-primary-300'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    {sl.imageUrl ? (
                      <img src={sl.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-500 font-medium">
                        {i + 1}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
