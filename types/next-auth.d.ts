// NextAuth.js 세션 타입 확장

import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      plan: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
