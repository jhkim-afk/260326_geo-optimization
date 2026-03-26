// 키워드 → AI 질문 변환기 페이지

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Loader2, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { keywordSchema, type KeywordInput } from '@/lib/validations';
import type { GeneratedQuestion } from '@/lib/claude';

const EXAMPLE_KEYWORDS = ['비건 선크림', '무선 이어폰', '임산부 영양제', '반려견 사료'];

const DIFFICULTY_CONFIG = {
  low: { label: '쉬움', color: 'text-green-600', bg: 'bg-green-100' },
  medium: { label: '보통', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  high: { label: '어려움', color: 'text-red-600', bg: 'bg-red-100' },
};

function GeoReadinessBar({ score }: { score: number }) {
  const color =
    score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="flex items-center gap-2">
      <Progress
        value={score}
        className={cn(
          'h-1.5 w-24',
          score >= 70
            ? '[&>div]:bg-green-500'
            : score >= 40
            ? '[&>div]:bg-yellow-500'
            : '[&>div]:bg-red-500',
        )}
      />
      <span className={cn('text-xs font-medium w-8', color)}>{score}</span>
    </div>
  );
}

export default function KeywordsPage() {
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCached, setIsCached] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<KeywordInput>({
    resolver: zodResolver(keywordSchema),
  });

  const onSubmit = async (data: KeywordInput) => {
    setError('');
    setQuestions([]);
    setIsLoading(true);
    setCurrentKeyword(data.keyword);

    try {
      const res = await fetch('/api/ai/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: data.keyword }),
      });

      const json = (await res.json()) as {
        data?: GeneratedQuestion[];
        cached?: boolean;
        error?: string;
      };

      if (!res.ok || json.error) {
        setError(json.error ?? '질문 생성에 실패했습니다.');
        return;
      }

      if (json.data) {
        setQuestions(json.data);
        setIsCached(json.cached ?? false);
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const avgReadiness =
    questions.length > 0
      ? Math.round(questions.reduce((sum, q) => sum + q.geoReadiness, 0) / questions.length)
      : 0;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Search className="h-6 w-6 text-amber-600" />
          키워드 → AI 질문 변환기
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          이커머스 키워드를 AI 유저가 실제로 물어볼 법한 질문 10개로 변환하고 GEO 준비도를 확인하세요.
        </p>
      </div>

      {/* 입력 */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder='예: "비건 선크림"'
                {...register('keyword')}
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                변환하기
              </Button>
            </div>
            {errors.keyword && (
              <p className="text-xs text-red-500">{errors.keyword.message}</p>
            )}
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs text-gray-400 self-center">예시 키워드:</span>
              {EXAMPLE_KEYWORDS.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => setValue('keyword', kw)}
                  className="text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-full px-3 py-1 transition-colors"
                >
                  {kw}
                </button>
              ))}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 결과 요약 */}
      {questions.length > 0 && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              &ldquo;{currentKeyword}&rdquo; 관련 AI 질문 패턴
              {isCached && (
                <Badge variant="outline" className="ml-2 text-xs">캐시된 결과</Badge>
              )}
            </h2>
            <p className="text-sm text-gray-500">
              평균 GEO 준비도:{' '}
              <span
                className={cn(
                  'font-bold',
                  avgReadiness >= 70 ? 'text-green-600' : avgReadiness >= 40 ? 'text-yellow-600' : 'text-red-600',
                )}
              >
                {avgReadiness}점
              </span>
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Zap className="h-4 w-4 text-amber-500" />
            10개 질문 생성 완료
          </div>
        </div>
      )}

      {/* 질문 목록 */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {questions.length > 0 && (
        <div className="space-y-3">
          {questions.map((q, index) => {
            const diffConfig = DIFFICULTY_CONFIG[q.difficulty];
            return (
              <Card key={index} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-medium text-gray-400">Q{index + 1}</span>
                        <Badge variant="outline" className="text-xs">{q.intent}</Badge>
                        <span
                          className={cn(
                            'text-xs font-medium rounded-full px-2 py-0.5',
                            diffConfig.bg,
                            diffConfig.color,
                          )}
                        >
                          경쟁도 {diffConfig.label}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mb-2">{q.question}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-gray-400 mb-1">GEO 준비도</p>
                      <GeoReadinessBar score={q.geoReadiness} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 빈 상태 */}
      {!isLoading && questions.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">키워드를 입력하면 AI 질문 패턴 10개를 생성합니다.</p>
        </div>
      )}
    </div>
  );
}
