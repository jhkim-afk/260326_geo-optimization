// 키워드 → AI 질문 변환 API — 캐싱 포함

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { convertKeywordToQuestions } from '@/lib/claude';
import { checkAndIncrementUsage } from '@/lib/rate-limit';
import { keywordSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body: unknown = await req.json();
    const parsed = keywordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: '키워드를 올바르게 입력하세요.', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { keyword } = parsed.data;
    const userId = session.user.id;

    // 캐시 확인 (24시간)
    const cached = await prisma.keywordConversion.findFirst({
      where: {
        userId,
        keyword,
        expiresAt: { gt: new Date() },
      },
    });

    if (cached) {
      return NextResponse.json({ cached: true, data: cached.generatedQuestions });
    }

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
      select: { name: true, category: true },
    });

    if (!brand) {
      return NextResponse.json(
        { error: '브랜드 정보를 먼저 설정해주세요.' },
        { status: 400 },
      );
    }

    const result = await convertKeywordToQuestions(keyword, brand.name, brand.category);

    // 결과 캐싱 (24시간)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.keywordConversion.create({
      data: {
        userId,
        keyword,
        generatedQuestions: JSON.parse(JSON.stringify(result.questions)),
        expiresAt,
      },
    });

    return NextResponse.json({ cached: false, data: result.questions });
  } catch (error) {
    console.error('[AI_KEYWORDS_ERROR]', error);
    return NextResponse.json({ error: '질문 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
