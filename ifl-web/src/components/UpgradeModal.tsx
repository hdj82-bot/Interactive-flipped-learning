'use client';

import { ArrowRight, Clock } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  plan: string;
  used: number;
  limit: number;
}

export default function UpgradeModal({ open, onClose, onUpgrade, plan, used, limit }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="생성 한도 초과">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
          <span className="text-3xl">🚫</span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          이번 달 생성 가능 편수를 모두 사용했습니다.
        </p>
        <div className="mt-3 inline-flex items-baseline gap-1">
          <span className="text-3xl font-bold text-gray-900">{used}</span>
          <span className="text-lg text-gray-400">/</span>
          <span className="text-3xl font-bold text-gray-900">{limit}</span>
          <span className="text-sm text-gray-500 ml-1">편</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          현재 플랜: <span className="font-semibold">{plan}</span>
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          <Clock className="h-4 w-4" />
          다음 달까지 기다리기
        </button>
        <button
          onClick={onUpgrade}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary-600 text-white py-3 text-sm font-semibold hover:bg-primary-700 transition"
        >
          플랜 업그레이드
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </Modal>
  );
}
