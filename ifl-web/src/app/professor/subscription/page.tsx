'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import UpgradeModal from '@/components/UpgradeModal';
import { Check, Crown, Sparkles, Zap } from 'lucide-react';

/* ── 타입 ─────────────────────────────────────────────────── */
interface Subscription {
  user_id: string;
  plan: string;
  monthly_limit: number;
  started_at: string;
  expires_at: string | null;
}

interface Usage {
  user_id: string;
  plan: string;
  monthly_limit: number;
  used: number;
  remaining: number;
  period: string;
}

/* ── 플랜 정의 ────────────────────────────────────────────── */
const PLANS = [
  {
    id: 'FREE',
    name: 'Free',
    price: '무료',
    limit: 2,
    icon: Sparkles,
    color: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-600',
    btn: 'border-gray-300 text-gray-700 hover:bg-gray-50',
    features: ['월 2편 생성', 'AI 아바타 강의', '기본 Q&A'],
  },
  {
    id: 'BASIC',
    name: 'Basic',
    price: '₩29,000/월',
    limit: 10,
    icon: Zap,
    color: 'border-primary-300',
    badge: 'bg-primary-100 text-primary-700',
    btn: 'bg-primary-600 text-white hover:bg-primary-700',
    features: ['월 10편 생성', 'AI 아바타 강의', '고급 Q&A', '학습 분석 대시보드'],
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: '₩59,000/월',
    limit: 20,
    icon: Crown,
    color: 'border-amber-300',
    badge: 'bg-amber-100 text-amber-700',
    btn: 'bg-amber-500 text-white hover:bg-amber-600',
    features: ['월 20편 생성', 'AI 아바타 강의', '고급 Q&A', '학습 분석 대시보드', '우선 렌더링', '전용 지원'],
  },
] as const;

export default function SubscriptionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    const uid = user.userId;
    Promise.all([
      api.get<Subscription>(`/subscription?user_id=${uid}`),
      api.get<Usage>(`/subscription/usage?user_id=${uid}`),
    ])
      .then(([sub, usg]) => {
        setSubscription(sub);
        setUsage(usg);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleChangePlan = async (planId: string) => {
    if (!user || changing) return;
    if (planId === subscription?.plan) return;

    setChanging(true);
    try {
      const sub = await api.post<Subscription>(
        `/subscription?user_id=${user.userId}`,
        { plan: planId },
      );
      setSubscription(sub);
      // usage 새로고침
      const usg = await api.get<Usage>(`/subscription/usage?user_id=${user.userId}`);
      setUsage(usg);
    } catch {
      /* noop */
    } finally {
      setChanging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  const currentPlan = subscription?.plan ?? 'FREE';
  const used = usage?.used ?? 0;
  const limit = usage?.monthly_limit ?? 2;
  const remaining = usage?.remaining ?? 0;
  const period = usage?.period ?? '';
  const usagePct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isExceeded = remaining <= 0;

  return (
    <div>
      {/* 업그레이드 유도 모달 */}
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={() => {
          setShowUpgradeModal(false);
          // 현재 Free면 Basic으로, Basic이면 Pro로
          const next = currentPlan === 'FREE' ? 'BASIC' : 'PRO';
          handleChangePlan(next);
        }}
        plan={currentPlan}
        used={used}
        limit={limit}
      />

      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">구독 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          현재 플랜과 사용량을 확인하고 업그레이드하세요.
        </p>
      </div>

      {/* ── 사용량 카드 ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">이번 달 사용량</h2>
            <p className="text-xs text-gray-500 mt-0.5">{period}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              PLANS.find((p) => p.id === currentPlan)?.badge ?? 'bg-gray-100 text-gray-600'
            }`}
          >
            {currentPlan} 플랜
          </span>
        </div>

        {/* 사용량 바 */}
        <div className="mb-3">
          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-gray-900">{used}</span>
              <span className="text-lg text-gray-400">/</span>
              <span className="text-lg text-gray-500">{limit}편</span>
            </div>
            <span
              className={`text-sm font-medium ${
                isExceeded ? 'text-red-600' : remaining <= 2 ? 'text-amber-600' : 'text-gray-500'
              }`}
            >
              {isExceeded ? '한도 초과' : `${remaining}편 남음`}
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isExceeded ? 'bg-red-500' : usagePct >= 80 ? 'bg-amber-500' : 'bg-primary-500'
              }`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
        </div>

        {isExceeded && (
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="mt-2 w-full rounded-xl bg-red-50 border border-red-200 text-red-700 py-3 text-sm font-medium hover:bg-red-100 transition"
          >
            한도를 초과했습니다. 플랜을 업그레이드하세요 →
          </button>
        )}
      </div>

      {/* ── 플랜 카드 ───────────────────────────────────────── */}
      <h2 className="text-lg font-bold mb-4">플랜 선택</h2>
      <div className="grid md:grid-cols-3 gap-5">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const PlanIcon = plan.icon;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 bg-white p-6 transition ${
                isCurrent ? `${plan.color} ring-2 ring-offset-2 ring-primary-200` : 'border-gray-200'
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-4 rounded-full bg-primary-600 text-white px-3 py-0.5 text-xs font-semibold">
                  현재 플랜
                </span>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    PLANS.find((p) => p.id === plan.id)?.badge
                  }`}
                >
                  <PlanIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <p className="text-sm text-gray-500">{plan.price}</p>
                </div>
              </div>

              <p className="text-2xl font-bold mb-4">
                월 {plan.limit}편
              </p>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleChangePlan(plan.id)}
                disabled={isCurrent || changing}
                className={`w-full rounded-xl border py-3 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${
                  isCurrent ? 'border-gray-200 text-gray-400 cursor-default' : plan.btn
                }`}
              >
                {isCurrent ? '사용 중' : changing ? '변경 중...' : '선택하기'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
