// 사용량 조회 API

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUsageInfo } from '@/lib/rate-limit';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const usage = await getUsageInfo(session.user.id);
    return NextResponse.json({ usage });
  } catch (error) {
    console.error('[USAGE_GET_ERROR]', error);
    return NextResponse.json({ error: '조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
