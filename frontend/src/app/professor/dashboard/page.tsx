"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Lecture { id: string; title: string; slug: string; is_published: boolean; }

export default function ProfessorDashboardPage() {
  const router = useRouter();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setError(null);
      try {
        const { data: courses } = await api.get("/api/courses");
        const allLectures: Lecture[] = [];
        for (const c of courses) {
          const { data: lecs } = await api.get(`/api/courses/${c.id}/lectures`);
          allLectures.push(...lecs);
        }
        setLectures(allLectures);
      } catch {
        setError("강의 목록을 불러오지 못했습니다.");
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingSpinner fullScreen label="강의 목록 불러오는 중..." />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">강의 관리</h1>
        <button onClick={() => router.push("/professor/lecture/new")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition w-full sm:w-auto">
          새 강의 만들기
        </button>
      </div>

      {error ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl px-5 py-2.5 transition">
            다시 시도
          </button>
        </div>
      ) : lectures.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-700 mb-1">아직 강의가 없습니다</p>
          <p className="text-sm text-gray-400 mb-6">PPT를 업로드하면 AI가 자동으로 강의 영상을 생성합니다.</p>
          <button onClick={() => router.push("/professor/lecture/new")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-2.5 text-sm font-medium transition">
            첫 강의 만들기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lectures.map((lec) => (
            <div key={lec.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-gray-300 transition group">
              <h3 className="font-semibold text-gray-900 mb-2 truncate">{lec.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${lec.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {lec.is_published ? "공개" : "비공개"}
              </span>
              <div className="mt-4 flex gap-2">
                <button onClick={() => router.push(`/professor/lecture/${lec.id}`)}
                  className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-2 transition font-medium">
                  스크립트 편집
                </button>
                <button onClick={() => router.push(`/professor/lecture/${lec.id}/dashboard`)}
                  className="flex-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg px-3 py-2 transition font-medium">
                  학습 분석
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
