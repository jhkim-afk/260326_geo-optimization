// 로그인 페이지 — Google OAuth + 이메일/비밀번호

import { Suspense } from 'react';
import { Brain, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <Brain className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-900">GEO Studio</span>
            </div>
          </div>
          <CardTitle className="text-2xl">로그인</CardTitle>
          <CardDescription>계정에 로그인하여 GEO 최적화를 시작하세요</CardDescription>
        </CardHeader>
        <CardContent>
          {/* useSearchParams()는 반드시 Suspense로 래핑해야 빌드 가능 */}
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
            </div>
          }>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
