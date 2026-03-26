// GEO 점수 카드 컴포넌트 — 개별 메트릭 표시 + 툴팁 설명

'use client';

import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, scoreToGrade, gradeToColor } from '@/lib/utils';

interface GeoScoreCardProps {
  title: string;
  score: number;
  previousScore?: number;
  description: string;     // 메트릭 설명 (툴팁용)
  weight?: number;         // 가중치 (%)
  isLoading?: boolean;
  className?: string;
}

// 점수 범위별 배경색
function scoreToBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function GeoScoreCard({
  title,
  score,
  previousScore,
  description,
  weight,
  isLoading = false,
  className,
}: GeoScoreCardProps) {
  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-20 mb-3" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    );
  }

  const grade = scoreToGrade(score);
  const gradeColor = gradeToColor(grade);
  const delta = previousScore !== undefined ? score - previousScore : null;

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1.5">
          {title}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px]">
                <p>{description}</p>
                {weight !== undefined && (
                  <p className="mt-1 font-semibold">GEO 점수 가중치: {weight}%</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">{Math.round(score)}</span>
            <span className="text-lg text-gray-400">/100</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={cn('text-2xl font-bold', gradeColor)}>등급 {grade}</span>
            {delta !== null && (
              <span
                className={cn(
                  'flex items-center text-xs font-medium',
                  delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-gray-500',
                )}
              >
                {delta > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                ) : delta < 0 ? (
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                ) : (
                  <Minus className="h-3 w-3 mr-0.5" />
                )}
                {delta > 0 ? '+' : ''}{delta.toFixed(1)}
              </span>
            )}
          </div>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={cn('h-full rounded-full transition-all duration-700', scoreToBarColor(score))}
            style={{ width: `${score}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// 종합 GEO Score 전용 히어로 카드
interface GeoHeroScoreProps {
  totalScore: number;
  isLoading?: boolean;
}

export function GeoHeroScore({ totalScore, isLoading = false }: GeoHeroScoreProps) {
  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <CardContent className="pt-8 pb-8 flex flex-col items-center">
          <Skeleton className="h-6 w-32 bg-white/20 mb-4" />
          <Skeleton className="h-24 w-36 bg-white/20 mb-4" />
          <Skeleton className="h-4 w-48 bg-white/20" />
        </CardContent>
      </Card>
    );
  }

  const grade = scoreToGrade(totalScore);

  return (
    <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-0 shadow-lg">
      <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
        <p className="text-indigo-200 text-sm font-medium mb-2 uppercase tracking-wider">
          종합 GEO Score
        </p>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-8xl font-black">{Math.round(totalScore)}</span>
          <span className="text-3xl text-indigo-300">/100</span>
        </div>
        <div className="bg-white/20 rounded-full px-4 py-1 mb-4">
          <span className="text-lg font-bold">등급 {grade}</span>
        </div>
        <Progress
          value={totalScore}
          className="w-full max-w-xs bg-white/20 [&>div]:bg-white"
        />
        <p className="mt-3 text-indigo-200 text-xs">
          AI 검색엔진 최적화 종합 점수 (ChatGPT · Claude · Perplexity 기준)
        </p>
      </CardContent>
    </Card>
  );
}
