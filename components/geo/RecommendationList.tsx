// GEO 개선 추천사항 목록 컴포넌트

'use client';

import { AlertCircle, ArrowRight, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { GeoRecommendation } from '@/lib/geo-calculator';

interface RecommendationListProps {
  recommendations: GeoRecommendation[];
  isLoading?: boolean;
}

const PRIORITY_CONFIG = {
  high: { label: '높음', variant: 'destructive' as const, icon: AlertCircle },
  medium: { label: '중간', variant: 'warning' as const, icon: TrendingUp },
  low: { label: '낮음', variant: 'secondary' as const, icon: ArrowRight },
};

const CATEGORY_LABELS: Record<GeoRecommendation['category'], string> = {
  citation: 'AI 인용',
  structure: '구조화',
  authority: 'E-E-A-T',
  consistency: '일관성',
};

export function RecommendationList({ recommendations, isLoading = false }: RecommendationListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>GEO 개선 추천사항</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-8">
            콘텐츠를 분석하면 맞춤형 개선 추천사항이 표시됩니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>GEO 개선 추천사항</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec, index) => {
          const config = PRIORITY_CONFIG[rec.priority];
          const Icon = config.icon;

          return (
            <div
              key={index}
              className={cn(
                'rounded-lg border p-4 transition-colors',
                rec.priority === 'high'
                  ? 'border-red-200 bg-red-50'
                  : rec.priority === 'medium'
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-gray-200 bg-gray-50',
              )}
            >
              <div className="flex items-start gap-3">
                <Icon
                  className={cn(
                    'h-4 w-4 mt-0.5 flex-shrink-0',
                    rec.priority === 'high'
                      ? 'text-red-600'
                      : rec.priority === 'medium'
                      ? 'text-yellow-600'
                      : 'text-gray-500',
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{rec.title}</span>
                    <Badge variant={config.variant} className="text-xs">
                      {config.label}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {CATEGORY_LABELS[rec.category]}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{rec.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
