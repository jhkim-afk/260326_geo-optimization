// GEO 점수 메인 대시보드 — 종합 현황 + 콘텐츠 분석

import type { Metadata } from 'next';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { DashboardClient } from './DashboardClient';

export const metadata: Metadata = { title: 'GEO 대시보드' };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [brand, recentAnalyses] = await Promise.all([
    prisma.brand.findUnique({
      where: { userId: session.user.id },
      include: { competitors: true },
    }),
    prisma.geoAnalysis.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        totalScore: true,
        citationRate: true,
        contentStructure: true,
        authorityScore: true,
        brandConsistency: true,
        contentUrl: true,
        createdAt: true,
        breakdown: true,
        recommendations: true,
      },
    }),
  ]);

  if (!brand) redirect('/onboarding');

  const latestAnalysis = recentAnalyses[0] ?? null;

  return (
    <DashboardClient
      brand={{
        name: brand.name,
        category: brand.category,
        competitors: brand.competitors.map((c: { name: string }) => c.name),
      }}
      latestAnalysis={latestAnalysis ? {
        total: latestAnalysis.totalScore,
        citationRate: latestAnalysis.citationRate,
        contentStructure: latestAnalysis.contentStructure,
        authorityScore: latestAnalysis.authorityScore,
        brandConsistency: latestAnalysis.brandConsistency,
        breakdown: latestAnalysis.breakdown as unknown as import('@/lib/geo-calculator').GeoScoreBreakdown[],
        recommendations: latestAnalysis.recommendations as unknown as import('@/lib/geo-calculator').GeoRecommendation[],
      } : null}
      recentCount={recentAnalyses.length}
    />
  );
}
