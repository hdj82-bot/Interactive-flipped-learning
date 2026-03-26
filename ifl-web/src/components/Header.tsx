'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  PlusCircle,
  BookOpen,
  LogOut,
  LogIn,
  User,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const PROFESSOR_NAV: NavItem[] = [
  { href: '/professor/dashboard', label: '강의 관리', icon: LayoutDashboard },
  { href: '/professor/lecture/new', label: '새 강의', icon: PlusCircle },
];

const STUDENT_NAV: NavItem[] = [
  { href: '/', label: '홈', icon: BookOpen },
];

export default function Header() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const navItems: NavItem[] = !user
    ? []
    : user.role === 'professor'
      ? PROFESSOR_NAV
      : STUDENT_NAV;

  const roleLabel = user?.role === 'professor' ? '교수자' : user?.role === 'student' ? '학습자' : null;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
        {/* 로고 */}
        <Link href="/" className="text-lg font-bold text-primary-700 shrink-0">
          IFL
        </Link>

        {/* 네비게이션 */}
        <nav className="flex-1 flex items-center gap-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href) && item.href !== '/';
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition ${
                  active
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 우측: 사용자 정보 */}
        {loading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        ) : user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-primary-600" />
              </div>
              <div className="hidden sm:block">
                {roleLabel && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 uppercase tracking-wider">
                    {roleLabel}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>
        ) : (
          <Link
            href="/auth/login"
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 text-white px-4 py-1.5 text-sm font-medium hover:bg-primary-700 transition"
          >
            <LogIn className="h-4 w-4" />
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}
