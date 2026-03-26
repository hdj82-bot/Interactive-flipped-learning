'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import LoadingSpinner from './ui/LoadingSpinner';

type Role = 'professor' | 'student';

interface Props {
  children: React.ReactNode;
  /** 허용할 role 목록. 비어 있으면 로그인만 확인 */
  allowedRoles?: Role[];
  /** 인증 실패 시 리다이렉트 경로 */
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = '/auth/login',
}: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace(redirectTo);
      return;
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      // 역할이 맞지 않으면 해당 역할의 홈으로
      const home = user.role === 'professor' ? '/professor/dashboard' : '/';
      router.replace(home);
    }
  }, [user, loading, allowedRoles, redirectTo, router]);

  if (loading) {
    return <LoadingSpinner fullScreen label="인증 확인 중..." />;
  }

  if (!user) return null;

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
