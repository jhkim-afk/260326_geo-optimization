// 콘텐츠 최적화 제안 페이지 — GEO 관점 상품 페이지 개선 제안

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FileText,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Copy,
  CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { optimizerSchema, type OptimizerInput } from '@/lib/validations';
import type { OptimizationResult, OptimizationSuggestion } from '@/lib/claude';

const EFFECT_CONFIG = {
  high: { label: '높음', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  medium: { label: '중간', icon: Minus, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  low: { label: '낮음', icon: TrendingDown, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' },
};

const CATEGORY_LABELS: Record<OptimizationSuggestion['category'], string> = {
  citation: 'AI 인용',
  structure: '구조화',
  authority: 'E-E-A-T',
  consistency: '일관성',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1">
      {copied ? <CheckCheck className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
      {copied ? '복사됨' : '복사'}
    </Button>
  );
}

export default function OptimizerPage() {
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<OptimizerInput>({
    resolver: zodResolver(optimizerSchema),
  });

  const content = watch('contentInput') ?? '';

  const onSubmit = async (data: OptimizerInput) => {
    setError('');
    setResult(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentInput: data.contentInput }),
      });

      const json = (await res.json()) as { data?: OptimizationResult; error?: string };
      if (!res.ok || json.error) {
        setError(json.error ?? '분석에 실패했습니다.');
        return;
      }

      if (json.data) setResult(json.data);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="h-6 w-6 text-pink-600" />
          콘텐츠 최적화 제안
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          상품 페이지나 브랜드 소개글을 입력하면 GEO 관점의 개선점을 5가지 이내로 제안합니다.
        </p>
      </div>

      {/* 입력 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">콘텐츠 입력</CardTitle>
          <CardDescription>
            상품 설명, 브랜드 소개, 블로그 포스트 등을 붙여넣어 GEO 최적화 제안을 받으세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Textarea
              placeholder="상품 페이지 내용을 붙여넣어 주세요 (최소 100자)..."
              className="min-h-[200px] resize-none"
              {...register('contentInput')}
              disabled={isLoading}
            />
            {errors.contentInput && (
              <p className="text-xs text-red-500">{errors.contentInput.message}</p>
            )}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{content.length}/10,000자</span>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AI 분석 중... (약 10~20초)
                  </>
                ) : (
                  '개선 제안 받기'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 전체 평가 */}
      {result?.overallAssessment && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="pt-5 pb-5">
            <p className="text-sm font-medium text-indigo-800 mb-1">AI 종합 평가</p>
            <p className="text-sm text-indigo-700 leading-relaxed">{result.overallAssessment}</p>
          </CardContent>
        </Card>
      )}

      {/* 개선 제안 목록 */}
      {result?.suggestions && result.suggestions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            개선 제안 ({result.suggestions.length}개)
          </h2>
          {result.suggestions.map((suggestion, index) => {
            const config = EFFECT_CONFIG[suggestion.expectedEffect];
            const Icon = config.icon;

            return (
              <Card key={index} className={cn('border', config.bg)}>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-800">제안 {index + 1}</span>
                      <Badge variant="outline" className="text-xs">
                        {CATEGORY_LABELS[suggestion.category]}
                      </Badge>
                      <div className={cn('flex items-center gap-1 text-xs font-medium', config.color)}>
                        <Icon className="h-3 w-3" />
                        예상 효과: {config.label}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        현재 문제점
                      </p>
                      <p className="text-sm text-gray-700">{suggestion.problem}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        개선 방향
                      </p>
                      <p className="text-sm text-gray-700">{suggestion.improvement}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          개선 예시 (즉시 사용 가능)
                        </p>
                        <CopyButton text={suggestion.improvedExample} />
                      </div>
                      <div className="bg-white border border-gray-200 rounded-md p-3">
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {suggestion.improvedExample}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 빈 상태 */}
      {!result && !isLoading && (
        <div className="text-center py-12 text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">콘텐츠를 입력하고 GEO 최적화 제안을 받아보세요.</p>
        </div>
      )}
    </div>
  );
}
