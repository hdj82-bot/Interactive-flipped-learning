'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft, Trophy, RefreshCw, ClipboardCheck } from 'lucide-react';

interface Question {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  text: string;
  options?: string[];
  correctAnswer?: string;
}

interface SubmitResult {
  totalQuestions: number;
  correctCount: number;
  results: { questionId: string; isCorrect: boolean; correctAnswer: string }[];
}

export default function AssessPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  const startAssessment = async () => {
    setLoading(true);
    try {
      const data = await api.get<Question[]>(`/assessment/${slug}/questions`);
      setQuestions(data);
      setStarted(true);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  };

  const setAnswer = (qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const submit = async () => {
    setLoading(true);
    try {
      const payload = questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] ?? '',
      }));
      const res = await api.post<SubmitResult>(`/assessment/${slug}/submit`, {
        answers: payload,
      });
      setResult(res);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  };

  const retry = () => {
    setResult(null);
    setAnswers({});
    setStarted(false);
  };

  const allAnswered = questions.every((q) => answers[q.id]?.trim());

  /* ── 결과 화면 ──────────────────────────────────────────── */
  if (result) {
    const pct = Math.round((result.correctCount / result.totalQuestions) * 100);
    const grade = pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F';

    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          {/* 점수 카드 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center mb-8">
            <div
              className={`inline-flex items-center justify-center h-24 w-24 rounded-full mb-4 ${
                pct >= 80
                  ? 'bg-green-100 text-green-600'
                  : pct >= 50
                    ? 'bg-yellow-100 text-yellow-600'
                    : 'bg-red-100 text-red-600'
              }`}
            >
              <div className="text-center">
                <Trophy className="h-6 w-6 mx-auto mb-1" />
                <span className="text-2xl font-bold">{grade}</span>
              </div>
            </div>
            <h1 className="text-xl font-bold mb-1">평가 완료</h1>
            <p className="text-gray-500 mb-2">
              {result.totalQuestions}문항 중 {result.correctCount}문항 정답
            </p>
            <p className="text-3xl font-bold text-gray-900">{pct}점</p>
          </div>

          {/* 문항별 결과 */}
          <div className="space-y-3 mb-8">
            {questions.map((q, i) => {
              const r = result.results.find((x) => x.questionId === q.id);
              return (
                <div
                  key={q.id}
                  className={`flex items-start gap-3 rounded-xl px-5 py-4 border ${
                    r?.isCorrect
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  {r?.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                  )}
                  <div className="text-sm flex-1">
                    <p className="font-medium">
                      {i + 1}. {q.text}
                    </p>
                    {answers[q.id] && (
                      <p className="text-gray-500 mt-1">내 답: {answers[q.id]}</p>
                    )}
                    {!r?.isCorrect && (
                      <p className="text-red-600 mt-1 font-medium">정답: {r?.correctAnswer}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 하단 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/lecture/${slug}`)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              강의로 돌아가기
            </button>
            <button
              onClick={retry}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary-600 text-white py-3 text-sm font-semibold hover:bg-primary-700 transition"
            >
              <RefreshCw className="h-4 w-4" />
              다시 풀기
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── 시작 전 ────────────────────────────────────────────── */
  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-5">
            <ClipboardCheck className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="text-xl font-bold mb-2">학습 평가</h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            강의 내용을 기반으로 생성된 퀴즈입니다.
            <br />
            객관식과 주관식 문제가 출제됩니다.
          </p>
          <button
            onClick={startAssessment}
            disabled={loading}
            className="w-full rounded-xl bg-primary-600 text-white px-6 py-3.5 text-sm font-semibold hover:bg-primary-700 disabled:opacity-40 transition"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                문제 생성 중...
              </span>
            ) : (
              '평가 시작'
            )}
          </button>
          <button
            onClick={() => router.push(`/lecture/${slug}`)}
            className="mt-3 text-sm text-gray-500 hover:text-gray-700 transition"
          >
            강의로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  /* ── 문제 풀이 ──────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">학습 평가</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              모든 문항에 답변 후 제출해 주세요.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-xs font-bold text-primary-700">
                {Object.keys(answers).filter((k) => answers[k]?.trim()).length}
              </span>
            </div>
            <span className="text-sm text-gray-400">/ {questions.length}</span>
          </div>
        </div>

        {/* 프로그레스 바 */}
        <div className="h-1.5 bg-gray-200 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{
              width: `${questions.length > 0 ? (Object.keys(answers).filter((k) => answers[k]?.trim()).length / questions.length) * 100 : 0}%`,
            }}
          />
        </div>

        {/* 문항 */}
        <div className="space-y-6">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className={`bg-white rounded-xl border p-6 transition ${
                answers[q.id]?.trim() ? 'border-primary-200' : 'border-gray-200'
              }`}
            >
              <p className="font-medium mb-4">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold mr-2">
                  {i + 1}
                </span>
                {q.text}
              </p>

              {/* 객관식 */}
              {q.type === 'MULTIPLE_CHOICE' && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <label
                      key={oi}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition ${
                        answers[q.id] === opt
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={() => setAnswer(q.id, opt)}
                        className="accent-primary-600"
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* O/X */}
              {q.type === 'TRUE_FALSE' && (
                <div className="flex gap-3">
                  {['O', 'X'].map((v) => (
                    <button
                      key={v}
                      onClick={() => setAnswer(q.id, v)}
                      className={`flex-1 rounded-xl border py-3.5 text-sm font-medium transition ${
                        answers[q.id] === v
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}

              {/* 주관식 */}
              {q.type === 'SHORT_ANSWER' && (
                <textarea
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  placeholder="답을 입력하세요"
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none"
                />
              )}
            </div>
          ))}
        </div>

        {/* 제출 */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={submit}
            disabled={!allAnswered || loading}
            className="flex items-center gap-2 rounded-xl bg-primary-600 text-white px-8 py-3.5 text-sm font-semibold hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                채점 중...
              </>
            ) : (
              <>
                제출하기
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
