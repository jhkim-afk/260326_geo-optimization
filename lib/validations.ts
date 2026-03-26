// Zod 스키마 모음 — 폼 유효성 검사 및 API 요청/응답 타입 검증

import { z } from 'zod';

// ─── 인증 관련 ────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.email('올바른 이메일 형식을 입력하세요.'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
});

export const registerSchema = z.object({
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다.').max(50),
  email: z.email('올바른 이메일 형식을 입력하세요.'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
    .regex(/[A-Z]/, '대문자를 포함해야 합니다.')
    .regex(/[0-9]/, '숫자를 포함해야 합니다.'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['confirmPassword'],
});

// ─── 온보딩 / 브랜드 설정 ────────────────────────────────────────────────────

export const brandSetupSchema = z.object({
  name: z.string().min(1, '브랜드명을 입력하세요.').max(100),
  category: z.string().min(1, '카테고리를 선택하세요.'),
  websiteUrl: z.url('올바른 URL 형식을 입력하세요.').optional().or(z.literal('')),
  mainProducts: z
    .array(z.string().min(1))
    .min(1, '주요 상품을 최소 1개 이상 입력하세요.')
    .max(10, '주요 상품은 최대 10개까지 입력 가능합니다.'),
  targetKeywords: z
    .array(z.string().min(1))
    .min(1, '타겟 키워드를 최소 1개 이상 입력하세요.')
    .max(20, '타겟 키워드는 최대 20개까지 입력 가능합니다.'),
  competitors: z
    .array(
      z.object({
        name: z.string().min(1),
        websiteUrl: z.url().optional().or(z.literal('')),
      }),
    )
    .max(3, '경쟁사는 최대 3개까지 입력 가능합니다.'),
});

// ─── GEO 분석 API ─────────────────────────────────────────────────────────────

export const geoAnalyzeSchema = z.object({
  contentInput: z
    .string()
    .min(50, '콘텐츠는 최소 50자 이상 입력해야 합니다.')
    .max(10000, '콘텐츠는 최대 10,000자까지 입력 가능합니다.'),
  contentUrl: z.url('올바른 URL 형식을 입력하세요.').optional().or(z.literal('')),
});

// ─── AI 시뮬레이터 ───────────────────────────────────────────────────────────

export const simulatorSchema = z.object({
  query: z
    .string()
    .min(5, '질문은 최소 5자 이상 입력하세요.')
    .max(500, '질문은 최대 500자까지 입력 가능합니다.'),
});

// ─── 콘텐츠 최적화 ───────────────────────────────────────────────────────────

export const optimizerSchema = z.object({
  contentInput: z
    .string()
    .min(100, '콘텐츠는 최소 100자 이상 입력하세요.')
    .max(10000, '콘텐츠는 최대 10,000자까지 입력 가능합니다.'),
  contentUrl: z.url('올바른 URL 형식을 입력하세요.').optional().or(z.literal('')),
});

// ─── 키워드 변환기 ───────────────────────────────────────────────────────────

export const keywordSchema = z.object({
  keyword: z
    .string()
    .min(1, '키워드를 입력하세요.')
    .max(100, '키워드는 최대 100자까지 입력 가능합니다.'),
});

// ─── 타입 추론 ────────────────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type BrandSetupInput = z.infer<typeof brandSetupSchema>;
export type GeoAnalyzeInput = z.infer<typeof geoAnalyzeSchema>;
export type SimulatorInput = z.infer<typeof simulatorSchema>;
export type OptimizerInput = z.infer<typeof optimizerSchema>;
export type KeywordInput = z.infer<typeof keywordSchema>;

// ─── 이커머스 카테고리 상수 ──────────────────────────────────────────────────

export const ECOMMERCE_CATEGORIES = [
  '패션/의류',
  '뷰티/화장품',
  '식품/건강',
  '전자제품',
  '가구/인테리어',
  '스포츠/아웃도어',
  '육아/유아동',
  '반려동물',
  '도서/문구',
  '자동차/자전거',
  '여행/레저',
  '기타',
] as const;

export type EcommerceCategory = (typeof ECOMMERCE_CATEGORIES)[number];
