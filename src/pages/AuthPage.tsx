import React, { useState } from 'react'
import LoginForm from '../components/auth/LoginForm'
import SignUpForm from '../components/auth/SignUpForm'

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-br from-snow via-white to-light-gray flex items-center justify-center p-m">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-8 -right-4 w-72 h-72 bg-orange-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-green-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* 로고/브랜딩 영역 */}
      <div className="absolute top-l left-l z-10">
        <div className="flex items-center gap-s">
          <div className="w-8 h-8 bg-blue-500 rounded-apple flex items-center justify-center">
            <span className="text-white font-bold text-body">AI</span>
          </div>
          <span className="text-title font-semibold text-text-primary">StudyAI</span>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 w-full max-w-4xl mx-auto grid lg:grid-cols-2 gap-xxxl items-center">
        {/* 왼쪽: 브랜딩 및 설명 */}
        <div className="hidden lg:block fade-in-up">
          <div className="text-center lg:text-left">
            <h1 className="text-display font-bold text-text-primary mb-m">
              AI와 함께하는<br />
              <span className="text-blue-500">개인 맞춤</span> 학습
            </h1>
            <p className="text-headline text-text-secondary mb-xl">
              자격증 취득부터 취미 스킬 향상까지,<br />
              AI 튜터가 당신만의 학습 계획을 세워드립니다.
            </p>

            {/* 기능 하이라이트 */}
            <div className="space-y-l">
              <div className="flex items-start gap-m">
                <div className="w-10 h-10 bg-blue-100 rounded-apple flex items-center justify-center flex-shrink-0 mt-xs">
                  <div className="w-5 h-5 text-blue-500">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-title font-semibold text-text-primary mb-xs">개인화된 학습 로드맵</h3>
                  <p className="text-body text-text-secondary">당신의 수준과 목표에 맞는 맞춤형 학습 계획</p>
                </div>
              </div>

              <div className="flex items-start gap-m">
                <div className="w-10 h-10 bg-orange-100 rounded-apple flex items-center justify-center flex-shrink-0 mt-xs">
                  <div className="w-5 h-5 text-orange-500">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-title font-semibold text-text-primary mb-xs">AI 튜터와 실시간 대화</h3>
                  <p className="text-body text-text-secondary">언제든지 질문하고 즉시 답변을 받으세요</p>
                </div>
              </div>

              <div className="flex items-start gap-m">
                <div className="w-10 h-10 bg-green-100 rounded-apple flex items-center justify-center flex-shrink-0 mt-xs">
                  <div className="w-5 h-5 text-green-500">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-title font-semibold text-text-primary mb-xs">학습 진도 추적</h3>
                  <p className="text-body text-text-secondary">상세한 분석과 피드백으로 성장을 확인하세요</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 인증 폼 */}
        <div className="fade-in-up-delay">
          {isLogin ? (
            <LoginForm onSwitchToSignUp={() => setIsLogin(false)} />
          ) : (
            <SignUpForm onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </div>
      </div>

      {/* 하단 링크 */}
      <div className="absolute bottom-l left-1/2 transform -translate-x-1/2 z-10">
        <p className="text-caption text-text-tertiary text-center">
          계속 진행하면{' '}
          <a href="#" className="text-blue-500 hover:text-blue-600 transition-colors">
            이용약관
          </a>
          {' '}및{' '}
          <a href="#" className="text-blue-500 hover:text-blue-600 transition-colors">
            개인정보처리방침
          </a>
          에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  )
}

export default AuthPage