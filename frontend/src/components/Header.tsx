"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const homeHref = user?.role === "professor" ? "/professor/dashboard" : "/dashboard";

  const navLinks = user?.role === "professor"
    ? [
        { href: "/professor/dashboard", label: "강의 관리" },
        { href: "/professor/lecture/new", label: "새 강의" },
        { href: "/professor/subscription", label: "구독" },
      ]
    : [{ href: "/dashboard", label: "내 강의" }];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href={homeHref} className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">IFL</span>
          <span className="text-sm font-semibold text-gray-900 hidden sm:inline">Interactive Flipped Learning</span>
        </Link>

        {user && (
          <>
            {/* 데스크탑 네비게이션 */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm px-3 py-1.5 rounded-lg transition ${
                    isActive(link.href)
                      ? "text-indigo-700 bg-indigo-50 font-medium"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center gap-2 ml-3 pl-3 border-l border-gray-200">
                <span className="text-xs text-gray-400">{user.role === "professor" ? "교수자" : "학습자"}</span>
                <button onClick={logout} className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 rounded-lg px-2.5 py-1 transition">
                  로그아웃
                </button>
              </div>
            </nav>

            {/* 모바일 햄버거 */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-gray-600" aria-label="메뉴">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </>
        )}
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {user && menuOpen && (
        <>
          <div className="md:hidden fixed inset-0 top-14 bg-black/20 z-30" onClick={() => setMenuOpen(false)} />
          <div className="md:hidden relative z-40 border-t border-gray-200 bg-white px-4 py-3 space-y-1 animate-scale-in">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block text-sm rounded-lg px-3 py-2 transition ${
                  isActive(link.href)
                    ? "text-indigo-700 bg-indigo-50 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 mt-1 border-t border-gray-100 flex items-center justify-between px-3">
              <span className="text-xs text-gray-400">{user.role === "professor" ? "교수자" : "학습자"}</span>
              <button onClick={logout} className="text-xs text-red-500 hover:text-red-700 transition">로그아웃</button>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
