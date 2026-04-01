"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LectureViewerError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-900/50 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">
          강의를 불러올 수 없습니다
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          강의 영상을 가져오는 중 오류가 발생했습니다.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => unstable_retry()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl px-5 py-2.5 transition"
          >
            다시 시도
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="border border-gray-600 hover:border-gray-500 text-gray-300 text-sm font-medium rounded-xl px-5 py-2.5 transition"
          >
            대시보드로
          </button>
        </div>
      </div>
    </div>
  );
}
