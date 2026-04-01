"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LectureError({
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
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          강의를 불러올 수 없습니다
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          강의 데이터를 가져오는 중 오류가 발생했습니다.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => unstable_retry()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl px-5 py-2.5 transition"
          >
            다시 시도
          </button>
          <button
            onClick={() => router.push("/professor/dashboard")}
            className="border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-medium rounded-xl px-5 py-2.5 transition"
          >
            목록으로
          </button>
        </div>
      </div>
    </div>
  );
}
