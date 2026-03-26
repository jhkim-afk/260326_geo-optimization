// AI 답변 시뮬레이터 페이지 — Claude API 스트리밍으로 실시간 답변 시뮬레이션

'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  MessageSquare,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { simulatorSchema, type SimulatorInput } from '@/lib/validations';
import type { SimulationResult } from '@/lib/claude';

const EXAMPLE_QUERIES = [
  '피부 자극 없는 비건 선크림 추천해줘',
  '가성비 좋은 무선 이어폰 뭐가 있어?',
  '임산부도 먹을 수 있는 영양제 알려줘',
  '반려견 관절에 좋은 사료 추천',
];

export default function SimulatorPage() {
  const [streamedText, setStreamedText] = useState('');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<SimulatorInput>({
    resolver: zodResolver(simulatorSchema),
  });

  const query = watch('query') ?? '';

  const onSubmit = async (data: SimulatorInput) => {
    setStreamedText('');
    setResult(null);
    setError('');
    setIsStreaming(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/ai/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: data.query }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setError(json.error ?? '시뮬레이션에 실패했습니다.');
        return;
      }

      // SSE 스트림 처리
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const parsed = JSON.parse(line.slice(6)) as {
              chunk?: string;
              done?: boolean;
              result?: SimulationResult;
              error?: string;
            };

            if (parsed.error) {
              setError(parsed.error);
              break;
            }

            if (parsed.chunk) {
              setStreamedText((prev) => prev + parsed.chunk);
            }

            if (parsed.done && parsed.result) {
              setResult(parsed.result);
            }
          } catch {
            // JSON 파싱 오류는 무시
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError('스트리밍 중 오류가 발생했습니다.');
      }
    } finally {
      setIsStreaming(false);
    }
  };

  // 브랜드 언급 하이라이팅 (간단한 예시)
  const renderAnswer = (text: string) => {
    const answerMatch = text.match(/<answer>([\s\S]*?)<\/answer>/);
    const answer = answerMatch?.[1] ?? text;
    return <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{answer}</p>;
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-purple-600" />
          AI 답변 시뮬레이터
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          실제 AI가 이 질문에 어떻게 답변하는지 시뮬레이션하고 브랜드 언급 여부를 확인하세요.
        </p>
      </div>

      {/* 입력 영역 */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder='예: "피부 자극 없는 비건 선크림 추천해줘"'
                {...register('query')}
                disabled={isStreaming}
                className="flex-1"
              />
              <Button type="submit" disabled={isStreaming || query.length < 5}>
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.query && (
              <p className="text-xs text-red-500">{errors.query.message}</p>
            )}

            {/* 예시 질문 */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-400 self-center">예시:</span>
              {EXAMPLE_QUERIES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setValue('query', q)}
                  className="text-xs bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 rounded-full px-3 py-1 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 에러 */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* 스트리밍 답변 */}
      {(streamedText || isStreaming) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              AI 답변
              {isStreaming && <Loader2 className="h-4 w-4 animate-spin text-purple-600" />}
            </CardTitle>
            <CardDescription>Claude Sonnet이 시뮬레이션한 AI 검색엔진 답변</CardDescription>
          </CardHeader>
          <CardContent>
            {streamedText ? (
              renderAnswer(streamedText)
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 분석 결과 */}
      {result && (
        <div className="grid sm:grid-cols-2 gap-4">
          {/* 브랜드 언급 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">브랜드 언급</CardTitle>
            </CardHeader>
            <CardContent>
              {result.mentionedBrands.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.mentionedBrands.map((brand) => (
                    <Badge key={brand} variant="success">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {brand}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-500">
                  <XCircle className="h-4 w-4 text-red-400" />
                  <span className="text-sm">언급된 브랜드 없음</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 답변 신뢰도 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">답변 신뢰도</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                variant={
                  result.answerConfidence === 'high'
                    ? 'success'
                    : result.answerConfidence === 'medium'
                    ? 'warning'
                    : 'destructive'
                }
                className="text-sm"
              >
                {result.answerConfidence === 'high'
                  ? '높음'
                  : result.answerConfidence === 'medium'
                  ? '중간'
                  : '낮음'}
              </Badge>
            </CardContent>
          </Card>

          {/* 인용 출처 유형 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">인용 출처 유형</CardTitle>
            </CardHeader>
            <CardContent>
              {result.sourceTypesCited.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.sourceTypesCited.map((s) => (
                    <Badge key={s} variant="outline">{s}</Badge>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-gray-400">없음</span>
              )}
            </CardContent>
          </Card>

          {/* 콘텐츠 갭 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                콘텐츠 갭 (개선 기회)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.contentGaps.length > 0 ? (
                <ul className="space-y-1">
                  {result.contentGaps.map((gap) => (
                    <li key={gap} className="text-sm text-gray-600 flex items-start gap-1">
                      <span className="text-indigo-400 mt-0.5">→</span>
                      {gap}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-gray-400">없음</span>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
