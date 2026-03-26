// Prisma v7 클라이언트 싱글턴 — PgAdapter 사용, 개발 환경 핫 리로드 중복 인스턴스 방지
// Proxy 패턴으로 빌드 타임에는 초기화하지 않고 실제 요청 시점에 지연 초기화

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다.');
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// Proxy를 사용해 모듈 로드 시점이 아닌 첫 프로퍼티 접근 시점에 클라이언트를 초기화
// 이렇게 하면 빌드 중 DATABASE_URL이 없어도 에러가 발생하지 않음
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getClient();
    const val = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === 'function' ? (val as Function).bind(client) : val;
  },
});
