// 대시보드 공통 레이아웃 — 사이드바 + 탑바

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { SignOutButton } from '@/components/geo/SignOutButton';
import { UsageBadge } from '@/components/geo/UsageBadge';
import { Brain, BarChart3, MessageSquare, FileText, Search } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'GEO 대시보드', icon: BarChart3 },
  { href: '/simulator', label: 'AI 시뮬레이터', icon: MessageSquare },
  { href: '/optimizer', label: '콘텐츠 최적화', icon: FileText },
  { href: '/keywords', label: '키워드 변환기', icon: Search },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // 온보딩 미완료 체크는 각 페이지에서 처리 (성능상 이유)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* 사이드바 */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-indigo-600" />
            <span className="text-lg font-bold text-gray-900">GEO Studio</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-3">
          <UsageBadge />
          <div className="flex items-center gap-2 px-1">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">
                {session.user.name ?? session.user.email}
              </p>
              <p className="text-xs text-gray-400">{session.user.plan ?? 'FREE'} 플랜</p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
