'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Users,
  CheckCircle2,
  XCircle,
  MessageCircleQuestion,
  DollarSign,
  RefreshCw,
  TrendingUp,
  Monitor,
  Video,
  Loader2,
} from 'lucide-react';

/* ── 타입 ── */
interface AttendanceStudent {
  userId: string;
  name: string;
  studentNumber: string | null;
  type: 'live' | 'vod';
  startedAt: string | null;
  progressPct: number;
  status: string;
}

interface AttendanceData {
  summary: { total: number; live: number; vod: number };
  students: AttendanceStudent[];
}

interface ScoresByType {
  type: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface WrongItem {
  questionText: string;
  questionType: string;
  wrongCount: number;
  wrongAnswers: string[];
}

interface ScoresData {
  totalQuestions: number;
  overallAccuracy: number;
  byType: ScoresByType[];
  byCategory: { category: string; total: number; correct: number; accuracy: number }[];
  wrongAnswerTop: WrongItem[];
}

interface EngagementStudent {
  userId: string;
  name: string;
  studentNumber: string | null;
  qaCount: number;
  respondedCount: number;
  noResponseCnt: number;
  responseRate: number | null;
  watchRatio: number;
}

interface EngagementData {
  summary: {
    totalStudents: number;
    totalQAQuestions: number;
    overallResponseRate: number;
    totalNoResponseEvents: number;
  };
  students: EngagementStudent[];
}

interface CostByCategory {
  category: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  count: number;
}

interface CostData {
  summary: {
    totalRequests: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCostUsd: number;
  };
  byCategory: CostByCategory[];
}

/* ── 탭 정의 ── */
type TabKey = 'attendance' | 'scores' | 'engagement' | 'cost';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'attendance', label: '출석', icon: Users },
  { key: 'scores', label: '정답률', icon: CheckCircle2 },
  { key: 'engagement', label: '참여도', icon: MessageCircleQuestion },
  { key: 'cost', label: '비용', icon: DollarSign },
];

/* ── 유틸 ── */
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = 'primary',
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color?: string;
}) {
  const colors: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`rounded-lg p-2 ${colors[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function ProgressBar({ pct, color = 'bg-primary-500' }: { pct: number; color?: string }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

/* ── 출석 패널 ── */
function AttendancePanel({ lectureId }: { lectureId: string }) {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<AttendanceData>(`/dashboard/${lectureId}/attendance`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lectureId]);

  if (loading) return <PanelLoader />;
  if (!data) return <EmptyState />;

  const { summary, students } = data;

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="전체 수강" value={summary.total} icon={Users} color="primary" sub="명" />
        <StatCard label="실시간 시청" value={summary.live} icon={Monitor} color="green" sub="명" />
        <StatCard label="사후 시청" value={summary.vod} icon={Video} color="amber" sub="명" />
      </div>

      {/* 차트 대용: 비율 바 */}
      {summary.total > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 mb-6">
          <p className="text-sm font-medium mb-3">실시간 vs 사후 시청 비율</p>
          <div className="flex h-6 rounded-full overflow-hidden">
            <div
              className="bg-green-500 flex items-center justify-center text-white text-[10px] font-semibold"
              style={{ width: `${(summary.live / summary.total) * 100}%` }}
            >
              {summary.live > 0 && `${Math.round((summary.live / summary.total) * 100)}%`}
            </div>
            <div
              className="bg-amber-400 flex items-center justify-center text-white text-[10px] font-semibold"
              style={{ width: `${(summary.vod / summary.total) * 100}%` }}
            >
              {summary.vod > 0 && `${Math.round((summary.vod / summary.total) * 100)}%`}
            </div>
          </div>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-green-500" />실시간</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />사후</span>
          </div>
        </div>
      )}

      {/* 학생 테이블 */}
      <Table
        headers={['이름', '학번', '유형', '진도율', '상태']}
        rows={students.map((s) => [
          s.name,
          s.studentNumber ?? '-',
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.type === 'live' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {s.type === 'live' ? '실시간' : '사후'}
          </span>,
          <div className="flex items-center gap-2">
            <ProgressBar pct={s.progressPct} />
            <span className="text-xs w-10 text-right">{s.progressPct}%</span>
          </div>,
          s.status,
        ])}
      />
    </div>
  );
}

/* ── 정답률 패널 ── */
function ScoresPanel({ lectureId }: { lectureId: string }) {
  const [data, setData] = useState<ScoresData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ScoresData>(`/dashboard/${lectureId}/scores`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lectureId]);

  if (loading) return <PanelLoader />;
  if (!data || data.totalQuestions === 0) return <EmptyState msg="아직 평가 데이터가 없습니다." />;

  const TYPE_LABELS: Record<string, string> = {
    MULTIPLE_CHOICE: '객관식',
    TRUE_FALSE: 'OX',
    SHORT_ANSWER: '주관식',
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="전체 정답률" value={`${data.overallAccuracy}%`} icon={TrendingUp} color="primary" />
        <StatCard label="총 문항 수" value={data.totalQuestions} icon={CheckCircle2} color="green" sub="문항" />
        <StatCard
          label="최다 오답 문항"
          value={data.wrongAnswerTop[0]?.wrongCount ?? 0}
          icon={XCircle}
          color="red"
          sub="회 오답"
        />
      </div>

      {/* 유형별 정답률 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 mb-6">
        <p className="text-sm font-medium mb-4">문제 유형별 정답률</p>
        <div className="space-y-3">
          {data.byType.map((t) => (
            <div key={t.type}>
              <div className="flex justify-between text-sm mb-1">
                <span>{TYPE_LABELS[t.type] ?? t.type}</span>
                <span className="font-semibold">{t.accuracy}%</span>
              </div>
              <ProgressBar
                pct={t.accuracy}
                color={t.accuracy >= 80 ? 'bg-green-500' : t.accuracy >= 50 ? 'bg-amber-400' : 'bg-red-500'}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 카테고리별 정답률 */}
      {data.byCategory.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 mb-6">
          <p className="text-sm font-medium mb-4">카테고리별 정답률</p>
          <div className="space-y-3">
            {data.byCategory.map((c) => (
              <div key={c.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{c.category}</span>
                  <span className="font-semibold">{c.accuracy}%</span>
                </div>
                <ProgressBar
                  pct={c.accuracy}
                  color={c.accuracy >= 80 ? 'bg-green-500' : c.accuracy >= 50 ? 'bg-amber-400' : 'bg-red-500'}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 오답 TOP */}
      {data.wrongAnswerTop.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium mb-4">오답 빈도 TOP 문항</p>
          <div className="space-y-3">
            {data.wrongAnswerTop.slice(0, 5).map((w, i) => (
              <div key={i} className="rounded-lg bg-red-50 p-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{w.questionText}</span>
                  <span className="text-red-600 font-semibold">{w.wrongCount}회</span>
                </div>
                <p className="text-xs text-gray-500">
                  오답 유형: {w.wrongAnswers.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 참여도 패널 ── */
function EngagementPanel({ lectureId }: { lectureId: string }) {
  const [data, setData] = useState<EngagementData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<EngagementData>(`/dashboard/${lectureId}/engagement`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lectureId]);

  if (loading) return <PanelLoader />;
  if (!data) return <EmptyState />;

  const { summary, students } = data;

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="수강생" value={summary.totalStudents} icon={Users} sub="명" />
        <StatCard label="Q&A 질문" value={summary.totalQAQuestions} icon={MessageCircleQuestion} color="primary" sub="건" />
        <StatCard
          label="반응률"
          value={`${summary.overallResponseRate}%`}
          icon={TrendingUp}
          color={summary.overallResponseRate >= 70 ? 'green' : 'amber'}
        />
        <StatCard label="무반응" value={summary.totalNoResponseEvents} icon={XCircle} color="red" sub="회" />
      </div>

      <Table
        headers={['이름', '학번', 'Q&A', '반응률', '무반응', '시청률']}
        rows={students.map((s) => [
          s.name,
          s.studentNumber ?? '-',
          `${s.respondedCount}/${s.qaCount}`,
          s.responseRate !== null ? `${s.responseRate}%` : '-',
          <span className={s.noResponseCnt > 2 ? 'text-red-600 font-semibold' : ''}>{s.noResponseCnt}</span>,
          <div className="flex items-center gap-2">
            <ProgressBar pct={s.watchRatio} color={s.watchRatio >= 80 ? 'bg-green-500' : 'bg-amber-400'} />
            <span className="text-xs w-10 text-right">{s.watchRatio}%</span>
          </div>,
        ])}
      />
    </div>
  );
}

/* ── 비용 패널 (30초 폴링) ── */
function CostPanel({ lectureId }: { lectureId: string }) {
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCost = useCallback(() => {
    api.get<CostData>(`/dashboard/${lectureId}/cost`)
      .then(setData)
      .catch(() => {});
  }, [lectureId]);

  useEffect(() => {
    fetchCost();
    setLoading(false);
    const interval = setInterval(fetchCost, 30_000);
    return () => clearInterval(interval);
  }, [fetchCost]);

  if (loading) return <PanelLoader />;
  if (!data) return <EmptyState msg="비용 데이터가 없습니다." />;

  const { summary, byCategory } = data;

  const CATEGORY_LABELS: Record<string, string> = {
    LLM_QA: 'LLM Q&A',
    LLM_ASSESSMENT: 'LLM 평가',
    LLM_SUMMARY: 'LLM 요약',
    STT: '음성 인식',
    TTS: '음성 합성',
    OTHER: '기타',
  };

  const maxCost = Math.max(...byCategory.map((c) => c.costUsd), 0.001);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <RefreshCw className="h-3 w-3" />
          30초마다 자동 갱신
        </p>
        <button
          onClick={fetchCost}
          className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          새로고침
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="총 비용" value={`$${summary.totalCostUsd.toFixed(4)}`} icon={DollarSign} color="primary" />
        <StatCard label="총 요청" value={summary.totalRequests} icon={TrendingUp} color="green" sub="회" />
        <StatCard
          label="총 토큰"
          value={(summary.totalInputTokens + summary.totalOutputTokens).toLocaleString()}
          icon={MessageCircleQuestion}
          color="amber"
          sub="tokens"
        />
      </div>

      {/* 카테고리별 비용 바 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-medium mb-4">카테고리별 비용</p>
        <div className="space-y-4">
          {byCategory.map((c) => (
            <div key={c.category}>
              <div className="flex justify-between text-sm mb-1.5">
                <span>{CATEGORY_LABELS[c.category] ?? c.category}</span>
                <span className="font-mono font-semibold">${c.costUsd.toFixed(4)}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full"
                  style={{ width: `${(c.costUsd / maxCost) * 100}%` }}
                />
              </div>
              <div className="flex gap-4 text-xs text-gray-400 mt-1">
                <span>{c.count}회</span>
                <span>입력 {c.inputTokens.toLocaleString()} tok</span>
                <span>출력 {c.outputTokens.toLocaleString()} tok</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 공통 컴포넌트 ── */
function PanelLoader() {
  return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-7 w-7 animate-spin text-primary-600" />
    </div>
  );
}

function EmptyState({ msg = '데이터가 없습니다.' }: { msg?: string }) {
  return <p className="text-center py-20 text-gray-400 text-sm">{msg}</p>;
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {headers.map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2.5 whitespace-nowrap">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── 메인 페이지 ── */
export default function LectureDashboardPage() {
  const params = useParams();
  const lectureId = params.id as string;
  const [activeTab, setActiveTab] = useState<TabKey>('attendance');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">강의 분석</h1>
        <p className="text-sm text-gray-500 mt-1">
          출석, 학습 성취도, 참여도, API 비용을 실시간으로 확인합니다.
        </p>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === tab.key
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 패널 */}
      {activeTab === 'attendance' && <AttendancePanel lectureId={lectureId} />}
      {activeTab === 'scores' && <ScoresPanel lectureId={lectureId} />}
      {activeTab === 'engagement' && <EngagementPanel lectureId={lectureId} />}
      {activeTab === 'cost' && <CostPanel lectureId={lectureId} />}
    </div>
  );
}
