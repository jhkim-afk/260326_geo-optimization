// GEO 분석 API 엔드포인트 — 콘텐츠 입력 시 GEO 점수 계산 및 캐싱

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { calculateGeoScore } from '@/lib/geo-calculator';
import { checkAndIncrementUsage } from '@/lib/rate-limit';
import { geoAnalyzeSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body: unknown = await req.json();
    const parsed = geoAnalyzeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { contentInput, contentUrl } = parsed.data;
    const userId = session.user.id;

    // 캐시 확인 — 같은 콘텐츠로 24시간 이내 분석 결과가 있으면 재사용
    const cached = await prisma.geoAnalysis.findFirst({
      where: {
        userId,
        contentInput,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (cached) {
      return NextResponse.json({
        cached: true,
        data: {
          total: cached.totalScore,
          citationRate: cached.citationRate,
          contentStructure: cached.contentStructure,
          authorityScore: cached.authorityScore,
          brandConsistency: cached.brandConsistency,
          breakdown: cached.breakdown,
          recommendations: cached.recommendations,
        },
      });
    }

    // Rate Limit 검사
    const allowed = await checkAndIncrementUsage(userId);
    if (!allowed) {
      return NextResponse.json(
        { error: '오늘 분석 횟수를 모두 사용했습니다. 내일 다시 시도하거나 플랜을 업그레이드하세요.' },
        { status: 429 },
      );
    }

    // 브랜드 정보 조회
    const brand = await prisma.brand.findUnique({
      where: { userId },
      include: { competitors: true },
    });

    if (!brand) {
      return NextResponse.json(
        { error: '브랜드 정보를 먼저 설정해주세요.' },
        { status: 400 },
      );
    }

    // GEO 점수 계산
    const geoScore = calculateGeoScore({
      brandName: brand.name,
      productPageContent: contentInput,
      targetKeywords: brand.targetKeywords,
      competitorNames: brand.competitors.map((c: { name: string }) => c.name),
    });

    // DB에 결과 저장 (24시간 캐시)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.geoAnalysis.create({
      data: {
        userId,
        brandId: brand.id,
        contentInput,
        contentUrl: contentUrl || null,
        totalScore: geoScore.total,
        citationRate: geoScore.citationRate,
        contentStructure: geoScore.contentStructure,
        authorityScore: geoScore.authorityScore,
        brandConsistency: geoScore.brandConsistency,
        breakdown: JSON.parse(JSON.stringify(geoScore.breakdown)),
        recommendations: JSON.parse(JSON.stringify(geoScore.recommendations)),
        expiresAt,
      },
    });

    return NextResponse.json({ cached: false, data: geoScore });
  } catch (error) {
    console.error('[GEO_ANALYZE_ERROR]', error);
    return NextResponse.json({ error: '분석 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

/** 최근 분석 결과 목록 조회 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get('limit') ?? '10'), 50);

    const analyses = await prisma.geoAnalysis.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        totalScore: true,
        citationRate: true,
        contentStructure: true,
        authorityScore: true,
        brandConsistency: true,
        contentUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ analyses });
  } catch (error) {
    console.error('[GEO_LIST_ERROR]', error);
    return NextResponse.json({ error: '조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
