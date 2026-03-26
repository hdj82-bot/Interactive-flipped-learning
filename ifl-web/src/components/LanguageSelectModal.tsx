'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import Modal from '@/components/ui/Modal';

const LANGUAGES = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
] as const;

interface Props {
  open: boolean;
  onSelect: (lang: string) => void;
}

export default function LanguageSelectModal({ open, onSelect }: Props) {
  const [selected, setSelected] = useState('ko');

  return (
    <Modal open={open} closable={false} title="언어 선택">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-5">
        <Globe className="h-4 w-4" />
        <span>강의 자막 및 인터페이스 언어를 선택하세요.</span>
      </div>

      <div className="space-y-2 mb-6">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setSelected(lang.code)}
            className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
              selected === lang.code
                ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-xl">{lang.flag}</span>
            <span className="text-sm font-medium">{lang.label}</span>
            {lang.code === 'ko' && (
              <span className="ml-auto text-xs text-gray-400">기본</span>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={() => onSelect(selected)}
        className="w-full rounded-xl bg-primary-600 text-white py-3 text-sm font-semibold hover:bg-primary-700 transition"
      >
        선택 완료
      </button>
    </Modal>
  );
}
