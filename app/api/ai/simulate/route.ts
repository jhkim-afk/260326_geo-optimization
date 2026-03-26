// AI 답변 시뮬레이터 API — Claude API 스트리밍 응답 (SSE)

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { simulateAiAnswer, parseSimulationResponse } from '@/lib/claude';
import { checkAndIncrementUsage } from '@/lib/rate-limit';
import { simulatorSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body: unknown = await req.json();
    const parsed = simulatorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: '질문을 올바르게 입력하세요.', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { query } = parsed.data;
    const userId = session.user.id;

    // Rate Limit 검사
    const allowed = await checkAndIncrementUsage(userId);
    if (!allowed) {
      return NextResponse.json(
        { error: '오늘 분석 횟수를 모두 사용했습니다.' },
        { status: 429 },
      );
    }

    // 브랜드 정보 조회
    const brand = await prisma.brand.findUnique({
      where: { userId },
      select: { name: true },
    });

    // SSE 스트리밍 응답
    const encoder = new TextEncoder();
    let fullText = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of simulateAiAnswer(query, brand?.name)) {
            fullText += chunk;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`),
            );
          }

          // 스트리밍 완료 후 파싱하여 DB 저장
          const result = parseSimulationResponse(fullText);
          const brandMentioned = brand
            ? result.mentionedBrands.some((b) =>
                b.toLowerCase().includes(brand.name.toLowerCase()),
              )
            : false;

          await prisma.aiSimulation.create({
            data: {
              userId,
              query,
              answer: result.answer,
              mentionedBrands: result.mentionedBrands,
              sourceTypesCited: result.sourceTypesCited,
              answerConfidence: result.answerConfidence,
              contentGaps: result.contentGaps,
              brandMentioned,
            },
          });

          // 완료 이벤트 전송
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, result })}\n\n`,
            ),
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : '알 수 없는 오류';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[AI_SIMULATE_ERROR]', error);
    return NextResponse.json({ error: '시뮬레이션 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
