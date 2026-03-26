'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Upload, FileUp, X, ChevronDown } from 'lucide-react';

const AVATAR_OPTIONS = [
  { value: 'anna', label: 'Anna (여성, 한국어)' },
  { value: 'josh', label: 'Josh (남성, 한국어)' },
  { value: 'custom', label: '커스텀 아바타' },
];

const VOICE_OPTIONS = [
  { value: 'ko-female-1', label: '한국어 여성 1' },
  { value: 'ko-female-2', label: '한국어 여성 2' },
  { value: 'ko-male-1', label: '한국어 남성 1' },
];

export default function NewLecturePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [avatar, setAvatar] = useState('anna');
  const [voice, setVoice] = useState('ko-female-1');
  const [qaEnabled, setQaEnabled] = useState(true);
  const [assessEnabled, setAssessEnabled] = useState(true);
  const [viewDays, setViewDays] = useState(14);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && isValidFile(f)) setFile(f);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && isValidFile(f)) setFile(f);
  };

  const isValidFile = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    return ['ppt', 'pptx', 'pdf'].includes(ext ?? '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !file) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('file', file);
      formData.append('avatar', avatar);
      formData.append('voice', voice);
      formData.append('qaEnabled', String(qaEnabled));
      formData.append('assessEnabled', String(assessEnabled));
      formData.append('viewDays', String(viewDays));

      const res = await api.upload<{ id: string }>('/lectures', formData);
      router.push(`/professor/lecture/${res.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '강의 생성에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">새 강의 생성</h1>
      <p className="text-sm text-gray-500 mb-8">
        PPT/PDF를 업로드하면 AI가 슬라이드별 스크립트를 자동 생성합니다.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ── 기본 정보 ── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">1</span>
            기본 정보
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">강의 제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 운영체제 3주차 - 프로세스 관리"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">설명 (선택)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="강의에 대한 간단한 설명을 입력하세요."
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none"
              />
            </div>
          </div>
        </section>

        {/* ── 파일 업로드 ── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">2</span>
            강의 자료
          </h2>
          {file ? (
            <div className="flex items-center gap-3 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3">
              <FileUp className="h-5 w-5 text-primary-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
              <button type="button" onClick={() => setFile(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileRef.current?.click()}
              className="rounded-xl border-2 border-dashed border-gray-300 py-12 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition"
            >
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">
                파일을 드래그하거나 <span className="text-primary-600 font-medium">클릭하여 선택</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">PPT, PPTX, PDF (최대 100MB)</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept=".ppt,.pptx,.pdf" onChange={handleFileSelect} className="hidden" />
        </section>

        {/* ── 아바타·음성 설정 ── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">3</span>
            아바타 · 음성
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">아바타</label>
              <div className="relative">
                <select
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                >
                  {AVATAR_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">음성</label>
              <div className="relative">
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                >
                  {VOICE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* ── 학습 설정 ── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">4</span>
            학습 설정
          </h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 cursor-pointer hover:bg-gray-50 transition">
              <div>
                <p className="text-sm font-medium">AI Q&A 활성화</p>
                <p className="text-xs text-gray-500">학습자가 AI에게 강의 관련 질문 가능</p>
              </div>
              <input
                type="checkbox"
                checked={qaEnabled}
                onChange={(e) => setQaEnabled(e.target.checked)}
                className="h-5 w-5 accent-primary-600 rounded"
              />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 cursor-pointer hover:bg-gray-50 transition">
              <div>
                <p className="text-sm font-medium">자동 평가</p>
                <p className="text-xs text-gray-500">시청 완료 후 퀴즈 자동 생성</p>
              </div>
              <input
                type="checkbox"
                checked={assessEnabled}
                onChange={(e) => setAssessEnabled(e.target.checked)}
                className="h-5 w-5 accent-primary-600 rounded"
              />
            </label>
            <div>
              <label className="block text-sm font-medium mb-1.5">시청 가능 기간 (일)</label>
              <input
                type="number"
                min={1}
                max={365}
                value={viewDays}
                onChange={(e) => setViewDays(Number(e.target.value))}
                className="w-32 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>
        </section>

        {error && (
          <p className="rounded-lg bg-red-50 text-red-600 text-sm px-4 py-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={!title.trim() || !file || uploading}
          className="w-full rounded-lg bg-primary-600 text-white px-4 py-3 text-sm font-semibold hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {uploading ? '업로드 및 스크립트 생성 중...' : '강의 생성 및 스크립트 편집으로 이동'}
        </button>
      </form>
    </div>
  );
}
