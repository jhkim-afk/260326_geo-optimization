// Rate Limiting 유틸리티 — DB 기반 사용자별 일일 사용량 관리

import { prisma } from '@/lib/db';
import { DAILY_LIMITS } from '@/lib/claude';

/**
 * 사용자의 오늘 사용량을 확인하고, 초과 시 false 반환
 * 자정에 자동으로 카운터를 리셋
 */
export async function checkAndIncrementUsage(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, dailyUsage: true, lastUsageReset: true },
  });

  if (!user) return false;

  const now = new Date();
  const lastReset = new Date(user.lastUsageReset);
  const isNewDay =
    now.getFullYear() !== lastReset.getFullYear() ||
    now.getMonth() !== lastReset.getMonth() ||
    now.getDate() !== lastReset.getDate();

  const currentUsage = isNewDay ? 0 : user.dailyUsage;
  const limit = DAILY_LIMITS[user.plan] ?? DAILY_LIMITS.FREE;

  if (currentUsage >= limit) return false;

  // 사용량 증가 (트랜잭션 불필요 — 초과해도 한 건 정도 허용)
  await prisma.user.update({
    where: { id: userId },
    data: {
      dailyUsage: isNewDay ? 1 : { increment: 1 },
      lastUsageReset: isNewDay ? now : undefined,
    },
  });

  return true;
}

/**
 * 현재 사용량 및 제한 정보 반환
 */
export async function getUsageInfo(userId: string): Promise<{
  used: number;
  limit: number;
  remaining: number;
  plan: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, dailyUsage: true, lastUsageReset: true },
  });

  if (!user) {
    return { used: 0, limit: DAILY_LIMITS.FREE, remaining: DAILY_LIMITS.FREE, plan: 'FREE' };
  }

  const now = new Date();
  const lastReset = new Date(user.lastUsageReset);
  const isNewDay =
    now.getFullYear() !== lastReset.getFullYear() ||
    now.getMonth() !== lastReset.getMonth() ||
    now.getDate() !== lastReset.getDate();

  const used = isNewDay ? 0 : user.dailyUsage;
  const limit = DAILY_LIMITS[user.plan] ?? DAILY_LIMITS.FREE;
  const remaining = Math.max(0, limit - used);

  return { used, limit, remaining, plan: user.plan };
}
