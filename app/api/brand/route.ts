// 브랜드 정보 CRUD API

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { brandSetupSchema } from '@/lib/validations';
import { Prisma } from '@prisma/client';

/** 브랜드 정보 조회 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const brand = await prisma.brand.findUnique({
      where: { userId: session.user.id },
      include: { competitors: true },
    });

    return NextResponse.json({ brand });
  } catch (error) {
    console.error('[BRAND_GET_ERROR]', error);
    return NextResponse.json({ error: '조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

/** 브랜드 정보 생성/수정 (upsert) */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body: unknown = await req.json();
    const parsed = brandSetupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { name, category, websiteUrl, mainProducts, targetKeywords, competitors } =
      parsed.data;
    const userId = session.user.id;

    // 기존 브랜드 삭제 후 재생성 (경쟁사 목록 갱신 포함)
    const brand = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existing = await tx.brand.findUnique({ where: { userId } });
      if (existing) {
        await tx.competitor.deleteMany({ where: { brandId: existing.id } });
      }

      return tx.brand.upsert({
        where: { userId },
        create: {
          userId,
          name,
          category,
          websiteUrl: websiteUrl || null,
          mainProducts,
          targetKeywords,
          competitors: {
            create: competitors.map((c) => ({
              name: c.name,
              websiteUrl: c.websiteUrl || null,
            })),
          },
        },
        update: {
          name,
          category,
          websiteUrl: websiteUrl || null,
          mainProducts,
          targetKeywords,
          competitors: {
            create: competitors.map((c) => ({
              name: c.name,
              websiteUrl: c.websiteUrl || null,
            })),
          },
        },
        include: { competitors: true },
      });
    });

    return NextResponse.json({ brand });
  } catch (error) {
    console.error('[BRAND_POST_ERROR]', error);
    return NextResponse.json({ error: '저장 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
