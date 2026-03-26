// 공통 유틸리티 함수 모음

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 날짜를 한국어 형식으로 포맷 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/** 점수를 등급으로 변환 */
export function scoreToGrade(score: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  if (score >= 90) return 'S';
  if (score >= 75) return 'A';
  if (score >= 60) return 'B';
  if (score >= 45) return 'C';
  return 'D';
}

/** 등급별 색상 클래스 반환 */
export function gradeToColor(grade: string): string {
  const map: Record<string, string> = {
    S: 'text-purple-600',
    A: 'text-green-600',
    B: 'text-blue-600',
    C: 'text-yellow-600',
    D: 'text-red-600',
  };
  return map[grade] ?? 'text-gray-600';
}

/** 점수 변화 방향 계산 */
export function scoreDelta(current: number, previous: number): number {
  return Math.round((current - previous) * 10) / 10;
}
