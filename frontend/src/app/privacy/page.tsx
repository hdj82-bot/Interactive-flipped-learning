import Link from "next/link";

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">개인정보처리방침</h1>
        <p className="text-sm text-gray-400 mb-8">최종 수정일: 2025년 3월 31일</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed text-gray-700">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. 개인정보의 수집 항목 및 방법</h2>
            <p>서비스는 회원가입 및 서비스 제공을 위해 다음 개인정보를 수집합니다:</p>

            <h3 className="font-medium text-gray-800 mt-4 mb-2">필수 수집 항목</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Google 계정 정보: 이메일 주소, 이름, 프로필 이미지</li>
              <li>교수자 추가 정보: 학교명, 소속 학과</li>
              <li>학습자 추가 정보: 학번</li>
            </ul>

            <h3 className="font-medium text-gray-800 mt-4 mb-2">서비스 이용 과정에서 자동 수집되는 정보</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>학습 활동 데이터: 영상 시청 시간, 진행률, 집중도 지표</li>
              <li>평가 데이터: 문제 응답, 정답률, 응답 시각</li>
              <li>Q&A 데이터: 질문 내용, AI 답변</li>
              <li>서비스 이용 기록: 접속 시간, IP 주소, 브라우저 정보</li>
            </ul>

            <h3 className="font-medium text-gray-800 mt-4 mb-2">수집 방법</h3>
            <p>Google OAuth 2.0 인증, 서비스 이용 과정에서의 자동 수집, 이용자의 직접 입력</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. 개인정보의 수집 및 이용 목적</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>회원 식별 및 인증</li>
              <li>강의 콘텐츠 제공 및 학습 관리</li>
              <li>AI 기반 서비스 제공 (스크립트 생성, 문제 출제, Q&A)</li>
              <li>학습 분석 및 교수자 대시보드 제공</li>
              <li>집중도 모니터링 및 학습 효과 분석</li>
              <li>구독 결제 처리 및 고객 지원</li>
              <li>서비스 개선 및 통계 분석</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. 개인정보의 보유 및 이용 기간</h2>
            <p>이용자의 개인정보는 수집 목적이 달성된 후 지체 없이 파기합니다. 다만, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>회원 탈퇴 시: 즉시 파기 (단, 법적 보존 의무가 있는 경우 제외)</li>
              <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
              <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
              <li>접속에 관한 기록: 3개월 (통신비밀보호법)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. 개인정보의 제3자 제공</h2>
            <p>서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우 예외로 합니다:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령에 의하거나 수사기관의 요청이 있는 경우</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. 개인정보 처리 위탁</h2>
            <p>서비스는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁하고 있습니다:</p>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-sm border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-2 font-medium text-gray-700">수탁업체</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">위탁 업무</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2">Google Cloud</td>
                    <td className="px-4 py-2">OAuth 인증, TTS (음성 합성)</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2">Amazon Web Services</td>
                    <td className="px-4 py-2">파일 저장 (S3)</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2">Anthropic</td>
                    <td className="px-4 py-2">AI 스크립트/문제 생성, Q&A 답변</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2">OpenAI</td>
                    <td className="px-4 py-2">텍스트 임베딩 (검색용)</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2">HeyGen</td>
                    <td className="px-4 py-2">AI 아바타 영상 생성</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2">ElevenLabs</td>
                    <td className="px-4 py-2">음성 합성 (TTS)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Stripe</td>
                    <td className="px-4 py-2">결제 처리</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. 이용자의 권리</h2>
            <p>이용자는 다음의 권리를 행사할 수 있습니다:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>개인정보 열람 요구</li>
              <li>개인정보 정정 및 삭제 요구</li>
              <li>개인정보 처리 정지 요구</li>
              <li>회원 탈퇴 (계정 삭제)</li>
            </ul>
            <p className="mt-2">
              위 권리 행사는 서비스 내 설정 또는 이메일을 통해 요청할 수 있으며,
              서비스는 요청을 받은 후 지체 없이 처리합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. 개인정보의 안전성 확보 조치</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>개인정보 암호화: JWT 토큰 기반 인증, HTTPS 통신</li>
              <li>접근 통제: 역할 기반 접근 제어 (교수자/학습자)</li>
              <li>로그 관리: 접근 기록 및 이상 행위 모니터링</li>
              <li>데이터 백업: 정기적인 데이터베이스 백업 (30일 보관)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. 쿠키 사용</h2>
            <p>
              서비스는 쿠키를 직접 사용하지 않으며, 인증 토큰은 브라우저의 localStorage에 저장됩니다.
              Google OAuth 인증 과정에서 Google의 쿠키 정책이 적용될 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. 개인정보 보호책임자</h2>
            <p>
              개인정보 처리에 관한 문의, 불만, 피해구제 등은 아래 담당자에게 연락하시기 바랍니다.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 mt-3">
              <p>개인정보 보호책임자</p>
              <p className="text-gray-500 mt-1">이메일: privacy@ifl-platform.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. 방침 변경</h2>
            <p>
              본 개인정보처리방침은 법령, 정책 또는 서비스 변경에 따라 수정될 수 있으며,
              변경 시 서비스 내 공지를 통해 안내합니다.
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
