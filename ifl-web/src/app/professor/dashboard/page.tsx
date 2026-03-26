'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  PlusCircle,
  Users,
  BarChart3,
  Clock,
  FileText,
  Video,
  MoreVertical,
  Eye,
} from 'lucide-react';

interface Lecture {
  id: string;
  title: string;
  slug: string;
  status: string;
  slideCount: number;
  studentCount: number;
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  draft: { label: '초안', cls: 'bg-gray-100 text-gray-600' },
  scripted: { label: '스크립트 완료', cls: 'bg-blue-100 text-blue-700' },
  processing: { label: '영상 생성 중', cls: 'bg-yellow-100 text-yellow-700' },
  published: { label: '공개', cls: 'bg-green-100 text-green-700' },
};

export default function DashboardPage() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Lecture[]>('/lectures')
      .then(setLectures)
      .catch(() => setLectures([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">강의 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            등록된 강의를 관리하고 학습 현황을 확인하세요.
          </p>
        </div>
        <Link
          href="/professor/lecture/new"
          className="flex items-center gap-2 rounded-lg bg-primary-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-primary-700 transition"
        >
          <PlusCircle className="h-4 w-4" />
          새 강의
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : lectures.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 py-20 text-center">
          <PlusCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">아직 등록된 강의가 없습니다.</p>
          <Link
            href="/professor/lecture/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-primary-700 transition"
          >
            첫 강의 만들기
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lectures.map((lec) => {
            const st = STATUS_MAP[lec.status] ?? STATUS_MAP.draft;
            return (
              <div
                key={lec.id}
                className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg leading-tight line-clamp-2 flex-1">
                    {lec.title}
                  </h3>
                  <span
                    className={`shrink-0 ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}
                  >
                    {st.label}
                  </span>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-5">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {lec.slideCount ?? 0}슬라이드
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {lec.studentCount}명
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(lec.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <Link
                    href={`/professor/lecture/${lec.id}`}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-2 py-2 text-xs font-medium hover:bg-gray-50 transition"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    스크립트
                  </Link>
                  <Link
                    href={`/professor/lecture/${lec.id}/dashboard`}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-2 py-2 text-xs font-medium hover:bg-gray-50 transition"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    분석
                  </Link>
                  <Link
                    href={`/lecture/${lec.slug}`}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-2 py-2 text-xs font-medium hover:bg-gray-50 transition"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    미리보기
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
