// 일일 사용량 배지 컴포넌트

'use client';

import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface UsageInfo {
  used: number;
  limit: number;
  remaining: number;
  plan: string;
}

export function UsageBadge() {
  const [usage, setUsage] = useState<UsageInfo | null>(null);

  useEffect(() => {
    fetch('/api/usage')
      .then((r) => r.json())
      .then((data: { usage: UsageInfo }) => setUsage(data.usage))
      .catch(() => null);
  }, []);

  if (!usage) return <Skeleton className="h-12 w-full rounded-lg" />;

  const usagePercent = usage.limit === Infinity ? 0 : (usage.used / usage.limit) * 100;

  return (
    <div className="px-1">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Zap className="h-3 w-3" />
          <span>오늘 사용량</span>
        </div>
        <span className="text-xs font-medium text-gray-700">
          {usage.used}/{usage.limit === Infinity ? '∞' : usage.limit}
        </span>
      </div>
      {usage.limit !== Infinity && (
        <Progress
          value={usagePercent}
          className={`h-1.5 ${usagePercent >= 80 ? '[&>div]:bg-red-500' : ''}`}
        />
      )}
    </div>
  );
}
