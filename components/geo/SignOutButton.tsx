// 로그아웃 버튼 컴포넌트

'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => signOut({ callbackUrl: '/login' })}
      title="로그아웃"
    >
      <LogOut className="h-4 w-4 text-gray-400" />
    </Button>
  );
}
