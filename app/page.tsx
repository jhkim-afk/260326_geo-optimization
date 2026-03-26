// 랜딩 페이지 — 로그인/시작하기 CTA

import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BarChart3, Brain, Target, Zap } from 'lucide-react';

export default async function HomePage() {
  const session = await auth();
  if (session) redirect('/dashboard');

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Brain className="h-7 w-7 text-indigo-600" />
          <span className="text-xl font-bold text-gray-900">GEO Studio</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="outline">로그인</Button>
          </Link>
          <Link href="/register">
            <Button>무료로 시작하기</Button>
          </Link>
        </div>
      </header>

      {/* 히어로 */}
      <section className="text-center py-24 px-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <Zap className="h-4 w-4" />
          AI 검색엔진 시대의 새로운 마케팅 전략
        </div>
        <h1 className="text-5xl font-black text-gray-900 mb-6 leading-tight">
          ChatGPT가 내 브랜드를<br />
          <span className="text-indigo-600">추천하게 만드세요</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          GEO(Generative Engine Optimization)로 AI 검색엔진 답변에 브랜드와 상품이
          자주 등장하도록 최적화하세요. 측정하고, 개선하고, 앞서가세요.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/register">
            <Button size="lg" className="text-base px-8">
              무료로 시작하기 →
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-base px-8">
              데모 보기
            </Button>
          </Link>
        </div>
      </section>

      {/* 핵심 기능 */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          GEO 최적화의 모든 것을 한 곳에서
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: BarChart3,
              title: 'GEO 점수 대시보드',
              description: '4개 핵심 지표로 AI 노출 최적화 현황을 한눈에 파악',
              color: 'text-indigo-600 bg-indigo-50',
            },
            {
              icon: Brain,
              title: 'AI 답변 시뮬레이터',
              description: '실제 AI가 내 브랜드를 어떻게 답변하는지 실시간 확인',
              color: 'text-purple-600 bg-purple-50',
            },
            {
              icon: Target,
              title: '콘텐츠 최적화 제안',
              description: '상품 페이지를 GEO 친화적으로 개선하는 구체적 액션',
              color: 'text-pink-600 bg-pink-50',
            },
            {
              icon: Zap,
              title: '키워드 질문 변환기',
              description: '키워드를 AI 유저 질문 패턴으로 변환 + GEO 준비도 분석',
              color: 'text-amber-600 bg-amber-50',
            },
          ].map((feature) => (
            <div key={feature.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className={`inline-flex p-3 rounded-lg ${feature.color} mb-4`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 푸터 */}
      <footer className="text-center py-8 text-sm text-gray-400 border-t border-gray-100 mt-16">
        <p>© 2026 GEO Studio. All rights reserved.</p>
      </footer>
    </main>
  );
}
