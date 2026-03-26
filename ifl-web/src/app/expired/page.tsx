'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';

export default function ExpiredPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-orange-100 text-orange-500 mb-6">
          <Clock className="h-10 w-10" />
        </div>

        <h1 className="text-2xl font-bold mb-2">시청 기간이 만료되었습니다</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          이 강의의 시청 가능 기간이 종료되었습니다.
          <br />
          교수자에게 문의하여 기간을 연장하거나,
          <br />
          다른 강의를 확인해 보세요.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="rounded-lg bg-primary-600 text-white px-6 py-3 text-sm font-semibold hover:bg-primary-700 transition"
          >
            홈으로 돌아가기
          </Link>
          <Link
            href="/auth/login"
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium hover:bg-gray-50 transition"
          >
            다시 로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
