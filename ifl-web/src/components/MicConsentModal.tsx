'use client';

import { useState } from 'react';
import { Mic, MicOff, ShieldCheck } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface Props {
  open: boolean;
  onConsent: (granted: boolean) => void;
}

export default function MicConsentModal({ open, onConsent }: Props) {
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');

  const handleAllow = async () => {
    setRequesting(true);
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 권한만 획득하고 스트림은 즉시 해제
      stream.getTracks().forEach((t) => t.stop());
      onConsent(true);
    } catch {
      setError('마이크 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <Modal open={open} closable={false} title="마이크 사용 동의">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
          <Mic className="h-8 w-8 text-primary-600" />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          음성 질문 및 집중도 감지를 위해
          <br />
          마이크 접근 권한이 필요합니다.
        </p>
        <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>녹음 데이터는 서버에 저장되지 않습니다.</span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 text-red-600 text-sm px-4 py-2.5 mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => onConsent(false)}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          <MicOff className="h-4 w-4" />
          건너뛰기
        </button>
        <button
          onClick={handleAllow}
          disabled={requesting}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary-600 text-white py-3 text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition"
        >
          <Mic className="h-4 w-4" />
          {requesting ? '요청 중...' : '허용하기'}
        </button>
      </div>
    </Modal>
  );
}
