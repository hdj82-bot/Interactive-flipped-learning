'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LayoutDashboard, PlusCircle, CreditCard, LogOut, User } from 'lucide-react';

const NAV = [
  { href: '/professor/dashboard', label: '강의 관리', icon: LayoutDashboard },
  { href: '/professor/lecture/new', label: '새 강의 생성', icon: PlusCircle },
  { href: '/professor/subscription', label: '구독 관리', icon: CreditCard },
];

function ProfessorShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 text-gray-300 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-gray-800">
          <Link href="/" className="text-lg font-bold text-white">
            IFL Platform
          </Link>
          <span className="block text-xs text-gray-500 mt-0.5">교수자 대시보드</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? 'bg-gray-800 text-white font-medium'
                    : 'hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-800 space-y-3">
          {user && (
            <div className="flex items-center gap-2 px-3 py-1">
              <div className="h-7 w-7 rounded-full bg-gray-700 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <span className="text-xs text-gray-400 truncate">교수자</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm hover:bg-gray-800 hover:text-white transition"
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}

export default function ProfessorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['professor']}>
      <ProfessorShell>{children}</ProfessorShell>
    </ProtectedRoute>
  );
}
