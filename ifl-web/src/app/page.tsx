'use client';

import Link from 'next/link';
import { BookOpen, MonitorPlay, BarChart3, Brain } from 'lucide-react';

const FEATURES = [
  {
    icon: MonitorPlay,
    title: 'AI 아바타 강의',
    desc: 'PPT를 업로드하면 AI 아바타가 강의 영상을 자동 생성합니다.',
  },
  {
    icon: Brain,
    title: '실시간 Q&A',
    desc: '학습 중 궁금한 점을 AI에게 바로 질문하고 답변을 받을 수 있습니다.',
  },
  {
    icon: BarChart3,
    title: '학습 분석 대시보드',
    desc: '출석률, 정답률, 참여도를 실시간으로 확인할 수 있습니다.',
  },
  {
    icon: BookOpen,
    title: '맞춤형 평가',
    desc: '강의 내용 기반 자동 생성 퀴즈로 학습 성취도를 점검합니다.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <header className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">IFL Platform</span>
          <Link
            href="/auth/login"
            className="rounded-lg bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25 transition"
          >
            로그인
          </Link>
        </nav>

        <div className="max-w-6xl mx-auto px-6 py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Interactive Flipped Learning
          </h1>
          <p className="mt-4 text-lg text-primary-100 max-w-2xl mx-auto">
            AI 아바타가 강의하고, 학습자는 질문하고, 교수자는 분석합니다.
            <br />
            플립러닝의 새로운 기준을 경험하세요.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <Link
              href="/auth/login"
              className="rounded-lg bg-white text-primary-700 px-6 py-3 font-semibold hover:bg-primary-50 transition"
            >
              시작하기
            </Link>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-center mb-12">주요 기능</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-gray-200 p-6 hover:shadow-lg transition"
            >
              <f.icon className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t py-8 text-center text-sm text-gray-500">
        &copy; 2026 IFL Platform. All rights reserved.
      </footer>
    </div>
  );
}
