// 루트 레이아웃 — GEO SaaS 플랫폼

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'GEO Studio — AI 검색 최적화 플랫폼',
    template: '%s | GEO Studio',
  },
  description:
    'ChatGPT, Claude, Perplexity 등 AI 검색엔진에 브랜드와 상품이 더 자주 노출되도록 최적화하는 B2B SaaS 플랫폼',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
