// 콘텐츠 최적화 제안 API — Claude API로 GEO 개선점 5가지 이내 생성

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { generateOptimizationSuggestions } from '@/lib/claude';
import { checkAndIncrementUsage } from '@/lib/rate-limit';
import { optimizerSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body: unknown = await req.json();
    const parsed = optimizerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { contentInput } = parsed.data;
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
      select: { name: true, targetKeywords: true },
    });

    if (!brand) {
      return NextResponse.json(
        { error: '브랜드 정보를 먼저 설정해주세요.' },
        { status: 400 },
      );
    }

    const result = await generateOptimizationSuggestions(
      contentInput,
      brand.name,
      brand.targetKeywords,
    );

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('[AI_OPTIMIZE_ERROR]', error);
    return NextResponse.json({ error: '최적화 제안 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
