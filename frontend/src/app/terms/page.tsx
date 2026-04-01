import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">IFL</span>
            <span className="text-sm font-semibold text-gray-900">IFL Platform</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">이용약관</h1>
        <p className="text-sm text-gray-400 mb-8">최종 수정일: 2025년 3월 31일</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed text-gray-700">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제1조 (목적)</h2>
            <p>
              본 약관은 IFL Platform(이하 &quot;서비스&quot;)이 제공하는 인터랙티브 플립드 러닝 서비스의 이용과 관련하여
              서비스와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제2조 (정의)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>&quot;서비스&quot;란 IFL Platform이 제공하는 AI 기반 강의 영상 생성, 학습 관리, 평가 시스템 등 일체의 온라인 교육 서비스를 말합니다.</li>
              <li>&quot;이용자&quot;란 본 약관에 동의하고 서비스를 이용하는 교수자 및 학습자를 말합니다.</li>
              <li>&quot;교수자&quot;란 강의 자료를 업로드하고 강의를 관리하는 이용자를 말합니다.</li>
              <li>&quot;학습자&quot;란 교수자가 제공한 강의를 수강하는 이용자를 말합니다.</li>
              <li>&quot;콘텐츠&quot;란 서비스 내에서 생성, 업로드, 공유되는 PPT 자료, 영상, 스크립트, 평가 문제 등을 말합니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제3조 (약관의 효력)</h2>
            <p>
              본 약관은 서비스 화면에 게시하거나 기타 방법으로 이용자에게 공지함으로써 효력을 발생합니다.
              서비스는 관련 법령을 위반하지 않는 범위에서 약관을 개정할 수 있으며, 개정 시 적용일 7일 전부터 공지합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제4조 (서비스의 제공)</h2>
            <p>서비스는 다음의 기능을 제공합니다:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>PPT 기반 AI 강의 영상 자동 생성</li>
              <li>AI 아바타 및 TTS를 활용한 영상 렌더링</li>
              <li>학습자 집중도 실시간 추적 및 분석</li>
              <li>AI 기반 평가 문제 자동 생성 및 채점</li>
              <li>RAG 기반 Q&A 시스템</li>
              <li>교수자 대시보드 및 학습 분석</li>
              <li>구독 기반 플랜 관리</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제5조 (이용자의 의무)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>이용자는 타인의 저작권, 초상권 등 지적재산권을 침해하는 콘텐츠를 업로드해서는 안 됩니다.</li>
              <li>이용자는 서비스를 통해 취득한 정보를 서비스의 사전 동의 없이 상업적으로 이용할 수 없습니다.</li>
              <li>이용자는 계정 정보를 안전하게 관리할 의무가 있으며, 제3자에게 양도하거나 공유할 수 없습니다.</li>
              <li>이용자는 서비스의 안정적 운영을 방해하는 행위를 해서는 안 됩니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제6조 (콘텐츠의 권리)</h2>
            <p>
              교수자가 업로드한 PPT 및 강의 자료의 저작권은 해당 교수자에게 있습니다.
              서비스는 이용자가 업로드한 콘텐츠를 서비스 제공 목적에 한해 이용할 수 있으며,
              AI 스크립트 생성, 영상 렌더링 등 서비스 기능 수행을 위해 가공할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제7조 (구독 및 결제)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>유료 플랜(BASIC, PRO)은 월간 구독 방식으로 제공됩니다.</li>
              <li>구독 갱신은 매월 자동으로 이루어지며, 갱신일 전 해지할 수 있습니다.</li>
              <li>무료 플랜은 월 2편의 영상 렌더링이 제공됩니다.</li>
              <li>결제 및 환불은 Stripe 결제 시스템의 정책을 따릅니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제8조 (서비스 중단)</h2>
            <p>
              서비스는 시스템 점검, 장비 교체, 불가항력 등의 사유로 일시적으로 중단될 수 있으며,
              사전 공지 후 중단합니다. 다만 긴급한 경우 사후 공지할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제9조 (면책)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>서비스는 AI가 생성한 콘텐츠(스크립트, 평가 문제, Q&A 답변)의 정확성을 보증하지 않습니다.</li>
              <li>이용자 간 또는 이용자와 제3자 간의 분쟁에 대해 서비스는 관여하지 않습니다.</li>
              <li>천재지변, 기술적 장애 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제10조 (분쟁 해결)</h2>
            <p>
              본 약관과 관련한 분쟁은 대한민국 법률을 적용하며,
              관할 법원은 서비스 운영자의 소재지를 관할하는 법원으로 합니다.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <Link href="/auth/login" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            로그인으로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
}
