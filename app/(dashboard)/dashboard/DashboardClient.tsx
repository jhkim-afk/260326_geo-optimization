// 대시보드 클라이언트 컴포넌트 — 실시간 GEO 분석 + 시각화

'use client';

import { useState } from 'react';
import { Loader2, BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GeoScoreCard, GeoHeroScore } from '@/components/geo/GeoScoreCard';
import { GeoRadarChart } from '@/components/charts/GeoRadarChart';
import { RecommendationList } from '@/components/geo/RecommendationList';
import type { GeoScore, GeoScoreBreakdown, GeoRecommendation } from '@/lib/geo-calculator';

interface BrandInfo {
  name: string;
  category: string;
  competitors: string[];
}

interface DashboardClientProps {
  brand: BrandInfo;
  latestAnalysis: {
    total: number;
    citationRate: number;
    contentStructure: number;
    authorityScore: number;
    brandConsistency: number;
    breakdown: GeoScoreBreakdown[];
    recommendations: GeoRecommendation[];
  } | null;
  recentCount: number;
}

const METRIC_DESCRIPTIONS = {
  citationRate: 'AI 답변에서 인용되기 쉬운 콘텐츠 형식 여부. 통계·수치·FAQ 포함 시 높아집니다.',
  contentStructure: '제목 구조, 목록 활용, 단락 구성 등 AI가 파싱하기 쉬운 형식 여부.',
  authorityScore: '전문성(E)·경험(E)·권위(A)·신뢰(T) 신호 강도. 인증·수상·전문가 언급 등.',
  brandConsistency: '브랜드명·키워드의 일관된 사용 빈도와 경쟁사 대비 언급 비율.',
};

export function DashboardClient({ brand, latestAnalysis, recentCount }: DashboardClientProps) {
  const [contentInput, setContentInput] = useState('');
  const [currentScore, setCurrentScore] = useState<Omit<GeoScore, 'breakdown' | 'recommendations'> & {
    breakdown: GeoScoreBreakdown[];
    recommendations: GeoRecommendation[];
  } | null>(latestAnalysis);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (contentInput.length < 50) {
      setError('콘텐츠를 50자 이상 입력해주세요.');
      return;
    }
    setError('');
    setIsAnalyzing(true);

    try {
      const res = await fetch('/api/geo/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentInput }),
      });

      const json = (await res.json()) as { data?: typeof currentScore; error?: string };
      if (!res.ok || json.error) {
        setError(json.error ?? '분석에 실패했습니다.');
        return;
      }

      if (json.data) setCurrentScore(json.data);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
            GEO 대시보드
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {brand.name} · {brand.category} · 분석 {recentCount}회
          </p>
        </div>
      </div>

      {/* 종합 점수 + 개별 지표 */}
      {currentScore ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <GeoHeroScore totalScore={currentScore.total} />
          <div className="lg:col-span-2 grid grid-cols-2 gap-3">
            <GeoScoreCard
              title="AI 인용 가능성"
              score={currentScore.citationRate}
              description={METRIC_DESCRIPTIONS.citationRate}
              weight={35}
            />
            <GeoScoreCard
              title="콘텐츠 구조화"
              score={currentScore.contentStructure}
              description={METRIC_DESCRIPTIONS.contentStructure}
              weight={25}
            />
            <GeoScoreCard
              title="E-E-A-T 권위"
              score={currentScore.authorityScore}
              description={METRIC_DESCRIPTIONS.authorityScore}
              weight={20}
            />
            <GeoScoreCard
              title="브랜드 일관성"
              score={currentScore.brandConsistency}
              description={METRIC_DESCRIPTIONS.brandConsistency}
              weight={20}
            />
          </div>
        </div>
      ) : (
        // 빈 상태 — 첫 분석 유도
        <Card className="border-dashed border-2 border-indigo-200 bg-indigo-50">
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 text-indigo-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              첫 GEO 분석을 시작하세요
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              아래에 상품 페이지 내용을 붙여넣으면 AI 최적화 점수를 즉시 확인할 수 있습니다.
            </p>
          </CardContent>
        </Card>
      )}

      {/* 콘텐츠 분석 입력 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">콘텐츠 GEO 분석</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="상품 페이지 내용, 브랜드 소개글, 블로그 포스트 등을 붙여넣어 GEO 점수를 분석하세요 (최소 50자)..."
            className="min-h-[140px] resize-none"
            value={contentInput}
            onChange={(e) => setContentInput(e.target.value)}
          />
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{contentInput.length}/10,000자</span>
            <Button onClick={handleAnalyze} disabled={isAnalyzing || contentInput.length < 50}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  GEO 점수 분석
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 레이더 차트 + 추천사항 */}
      {currentScore && (
        <div className="grid lg:grid-cols-2 gap-6">
          <GeoRadarChart
            brandName={brand.name}
            brandScores={{
              citationRate: currentScore.citationRate,
              contentStructure: currentScore.contentStructure,
              authorityScore: currentScore.authorityScore,
              brandConsistency: currentScore.brandConsistency,
            }}
            competitors={[]}
          />
          <RecommendationList recommendations={currentScore.recommendations} />
        </div>
      )}
    </div>
  );
}
