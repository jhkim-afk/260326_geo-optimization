// GEO 점수 계산 순수 함수 — 외부 의존성 없이 단독 테스트 가능

// ─── 타입 정의 ────────────────────────────────────────────────────────────────

export interface GeoAnalysisInput {
  brandName: string;
  productPageContent: string;
  targetKeywords: string[];
  competitorNames: string[];
}

export interface GeoScoreBreakdown {
  category: string;
  score: number;
  maxScore: number;
  details: string;
}

export interface GeoRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'citation' | 'structure' | 'authority' | 'consistency';
  title: string;
  description: string;
}

export interface GeoScore {
  total: number;           // 0–100 종합 GEO 점수
  citationRate: number;    // 0–100 인용 가능성
  contentStructure: number; // 0–100 콘텐츠 구조화 점수
  authorityScore: number;  // 0–100 E-E-A-T 권위 점수
  brandConsistency: number; // 0–100 브랜드 일관성 점수
  breakdown: GeoScoreBreakdown[];
  recommendations: GeoRecommendation[];
}

// ─── 가중치 상수 ─────────────────────────────────────────────────────────────

/**
 * GEO Score = (Citation Rate × 0.35) + (Content Structure × 0.25)
 *           + (Authority Score × 0.20) + (Brand Consistency × 0.20)
 */
const WEIGHTS = {
  citationRate: 0.35,
  contentStructure: 0.25,
  authorityScore: 0.20,
  brandConsistency: 0.20,
} as const;

// ─── 개별 지표 계산 함수 ─────────────────────────────────────────────────────

/**
 * 인용 가능성 점수 계산
 * - 통계/수치 포함 여부
 * - 구체적 사실 언급
 * - 출처 명시 여부
 * - FAQ 형식 포함 여부
 */
function calculateCitationRate(content: string): number {
  let score = 0;

  // 숫자/통계 포함 여부 (최대 25점)
  const numberMatches = content.match(/\d+([.,]\d+)?(%|개|원|개월|년|명|배|위|회|kg|ml|mg|위|번)/g);
  const numberScore = Math.min((numberMatches?.length ?? 0) * 5, 25);
  score += numberScore;

  // 구체적 사실 지표어 (최대 20점)
  const factIndicators = [
    '연구', '조사', '분석', '실험', '검증', '인증', '특허',
    'study', 'research', 'survey', 'test', 'certified', 'verified',
  ];
  const factCount = factIndicators.filter((w) => content.toLowerCase().includes(w.toLowerCase())).length;
  score += Math.min(factCount * 4, 20);

  // 출처 명시 (최대 20점)
  const sourceIndicators = ['출처', '참고', '기준', '근거', '데이터', '보고서', 'reference', 'source', 'based on'];
  const sourceCount = sourceIndicators.filter((w) => content.toLowerCase().includes(w.toLowerCase())).length;
  score += Math.min(sourceCount * 5, 20);

  // FAQ/Q&A 형식 포함 여부 (최대 15점)
  const hasFaq = /Q[:\.]|A[:\.]|자주\s*묻는\s*질문|FAQ|질문\s*&?\s*답변/.test(content);
  if (hasFaq) score += 15;

  // 단계별 설명 구조 (최대 20점)
  const hasSteps = /(\d+단계|Step\s*\d+|\d+\.\s+[가-힣A-Z])/.test(content);
  if (hasSteps) score += 10;
  const hasList = /^[-•*]\s+/m.test(content) || /^\d+\.\s+/m.test(content);
  if (hasList) score += 10;

  return Math.min(score, 100);
}

/**
 * 콘텐츠 구조 점수 계산
 * - 제목/소제목 구조
 * - 리스트 활용
 * - 문단 구성
 * - 콘텐츠 길이 적절성
 */
function calculateContentStructure(content: string): number {
  let score = 0;

  // 제목 구조 (최대 25점)
  const headingCount = (content.match(/#{1,3}\s+\S|<h[1-3]>/gi) ?? []).length;
  score += Math.min(headingCount * 5, 25);

  // 리스트 구조 (최대 20점)
  const listItems = content.match(/^[-•*]\s+.+|^\d+\.\s+.+/gm) ?? [];
  score += Math.min(listItems.length * 2, 20);

  // 적절한 콘텐츠 길이 (최대 20점)
  const wordCount = content.replace(/\s+/g, ' ').split(' ').length;
  if (wordCount >= 300 && wordCount <= 2000) {
    score += 20;
  } else if (wordCount >= 150) {
    score += 10;
  } else if (wordCount >= 50) {
    score += 5;
  }

  // 단락 구성 (최대 15점)
  const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 20);
  if (paragraphs.length >= 3) score += 15;
  else if (paragraphs.length >= 2) score += 8;

  // 핵심 키워드 밀도 적절성 (최대 20점)
  // 너무 적거나 너무 많으면 감점
  const totalWords = content.split(/\s+/).length;
  if (totalWords > 100) {
    score += 20;
  } else if (totalWords > 50) {
    score += 10;
  }

  return Math.min(score, 100);
}

/**
 * 권위/신뢰성(E-E-A-T) 점수 계산
 * - 전문성 신호
 * - 경험 언급
 * - 권위 지표
 * - 신뢰성 요소
 */
function calculateAuthorityScore(content: string): number {
  let score = 0;
  const lowerContent = content.toLowerCase();

  // 전문성(Expertise) 신호 (최대 25점)
  const expertiseTerms = [
    '전문', '전문가', '전문의', '박사', '교수', '연구원', '개발자',
    'expert', 'specialist', 'professional', 'certified', 'licensed',
  ];
  const expertiseCount = expertiseTerms.filter((t) => lowerContent.includes(t)).length;
  score += Math.min(expertiseCount * 5, 25);

  // 경험(Experience) 신호 (최대 25점)
  const experienceTerms = ['년 경력', '년간', '출시 이후', '년 역사', '설립', '운영'];
  const yearPattern = /\d+년/;
  if (yearPattern.test(content)) score += 10;
  const experienceCount = experienceTerms.filter((t) => lowerContent.includes(t)).length;
  score += Math.min(experienceCount * 5, 15);

  // 권위(Authoritativeness) 신호 (최대 25점)
  const authorityTerms = ['수상', '인증', '특허', '1위', '국내 최초', '업계 최초', '공식', '공인'];
  const authorityCount = authorityTerms.filter((t) => content.includes(t)).length;
  score += Math.min(authorityCount * 5, 25);

  // 신뢰성(Trustworthiness) 신호 (최대 25점)
  const trustTerms = ['안전', '검증', '보증', '환불', '보장', '투명', '성분', '원산지'];
  const trustCount = trustTerms.filter((t) => content.includes(t)).length;
  score += Math.min(trustCount * 4, 20);

  // 고객 후기/리뷰 언급 (5점)
  if (/리뷰|후기|평점|별점|고객 만족/.test(content)) score += 5;

  return Math.min(score, 100);
}

/**
 * 브랜드 일관성 점수 계산
 * - 브랜드명 일관된 사용
 * - 키워드 반복 노출
 * - 경쟁사 대비 언급 빈도
 */
function calculateBrandConsistency(
  content: string,
  brandName: string,
  targetKeywords: string[],
  competitorNames: string[],
): number {
  let score = 0;

  if (!brandName || !content) return 0;

  // 브랜드명 언급 빈도 (최대 30점)
  const brandMentions = (
    content.match(new RegExp(brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) ?? []
  ).length;

  if (brandMentions >= 5) score += 30;
  else if (brandMentions >= 3) score += 20;
  else if (brandMentions >= 1) score += 10;

  // 타겟 키워드 포함률 (최대 40점)
  if (targetKeywords.length > 0) {
    const keywordHits = targetKeywords.filter((kw) =>
      content.toLowerCase().includes(kw.toLowerCase()),
    ).length;
    const keywordRate = keywordHits / targetKeywords.length;
    score += Math.round(keywordRate * 40);
  } else {
    score += 20; // 키워드 미설정 시 중립 점수
  }

  // 경쟁사 언급 vs 브랜드 언급 비율 (최대 30점)
  if (competitorNames.length > 0) {
    const competitorMentions = competitorNames.reduce((acc, name) => {
      return acc + (content.match(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) ?? []).length;
    }, 0);

    if (brandMentions > competitorMentions) {
      score += 30;
    } else if (brandMentions === competitorMentions) {
      score += 15;
    } else {
      score += 0;
    }
  } else {
    score += 15; // 경쟁사 미설정 시 중립 점수
  }

  return Math.min(score, 100);
}

// ─── 추천사항 생성 ────────────────────────────────────────────────────────────

/**
 * 점수 기반으로 개선 추천사항 자동 생성
 */
function generateRecommendations(
  citationRate: number,
  contentStructure: number,
  authorityScore: number,
  brandConsistency: number,
): GeoRecommendation[] {
  const recommendations: GeoRecommendation[] = [];

  if (citationRate < 60) {
    recommendations.push({
      priority: citationRate < 30 ? 'high' : 'medium',
      category: 'citation',
      title: '통계와 수치 데이터 추가',
      description: '구체적인 수치, 연구 결과, 사용자 데이터를 포함하면 AI가 인용하기 쉬운 콘텐츠가 됩니다. FAQ 형식의 Q&A 섹션 추가를 권장합니다.',
    });
  }

  if (contentStructure < 60) {
    recommendations.push({
      priority: contentStructure < 30 ? 'high' : 'medium',
      category: 'structure',
      title: '콘텐츠 구조화 개선',
      description: '제목(H2, H3), 번호 목록, 불릿 포인트를 활용하여 AI가 파싱하기 쉬운 구조로 개편하세요. 단계별 설명 형식이 특히 효과적입니다.',
    });
  }

  if (authorityScore < 60) {
    recommendations.push({
      priority: authorityScore < 30 ? 'high' : 'medium',
      category: 'authority',
      title: 'E-E-A-T 신호 강화',
      description: '전문가 추천, 인증 마크, 수상 이력, 브랜드 연혁 등의 신뢰 신호를 페이지에 명시적으로 표시하세요.',
    });
  }

  if (brandConsistency < 60) {
    recommendations.push({
      priority: brandConsistency < 30 ? 'high' : 'medium',
      category: 'consistency',
      title: '브랜드명 및 키워드 일관성 개선',
      description: '브랜드명과 주요 키워드를 페이지 전체에서 일관되게 사용하세요. 경쟁사보다 브랜드 관련 용어가 더 자주 등장해야 합니다.',
    });
  }

  // 공통 권장사항
  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'low',
      category: 'structure',
      title: '외부 플랫폼 언급 확대',
      description: '외부 리뷰 사이트, 커뮤니티, 포럼에서의 자연스러운 브랜드 언급을 늘려 멀티플랫폼 신호를 강화하세요.',
    });
  }

  // 우선순위 정렬
  return recommendations.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
}

// ─── 핵심 내보내기 함수 ───────────────────────────────────────────────────────

/**
 * GEO 종합 점수 계산 (순수 함수 — 외부 의존성 없음)
 *
 * @param input - 브랜드명, 콘텐츠, 키워드, 경쟁사 정보
 * @returns GeoScore - 점수 분해 및 추천사항 포함
 */
export function calculateGeoScore(input: GeoAnalysisInput): GeoScore {
  const { brandName, productPageContent, targetKeywords, competitorNames } = input;

  // 개별 지표 계산
  const citationRate = calculateCitationRate(productPageContent);
  const contentStructure = calculateContentStructure(productPageContent);
  const authorityScore = calculateAuthorityScore(productPageContent);
  const brandConsistency = calculateBrandConsistency(
    productPageContent,
    brandName,
    targetKeywords,
    competitorNames,
  );

  // 가중 평균 종합 점수 계산
  const total = Math.round(
    citationRate * WEIGHTS.citationRate +
    contentStructure * WEIGHTS.contentStructure +
    authorityScore * WEIGHTS.authorityScore +
    brandConsistency * WEIGHTS.brandConsistency,
  );

  const breakdown: GeoScoreBreakdown[] = [
    {
      category: 'AI 인용 가능성',
      score: citationRate,
      maxScore: 100,
      details: `통계·수치·FAQ 포함 여부 기준 (가중치 ${WEIGHTS.citationRate * 100}%)`,
    },
    {
      category: '콘텐츠 구조화',
      score: contentStructure,
      maxScore: 100,
      details: `제목·리스트·단락 구성 기준 (가중치 ${WEIGHTS.contentStructure * 100}%)`,
    },
    {
      category: 'E-E-A-T 권위',
      score: authorityScore,
      maxScore: 100,
      details: `전문성·경험·권위·신뢰성 신호 기준 (가중치 ${WEIGHTS.authorityScore * 100}%)`,
    },
    {
      category: '브랜드 일관성',
      score: brandConsistency,
      maxScore: 100,
      details: `브랜드명·키워드 반복 노출 기준 (가중치 ${WEIGHTS.brandConsistency * 100}%)`,
    },
  ];

  const recommendations = generateRecommendations(
    citationRate,
    contentStructure,
    authorityScore,
    brandConsistency,
  );

  return {
    total,
    citationRate,
    contentStructure,
    authorityScore,
    brandConsistency,
    breakdown,
    recommendations,
  };
}

/**
 * 두 GeoScore를 비교하여 델타를 반환
 */
export function compareGeoScores(
  current: GeoScore,
  previous: GeoScore,
): Record<keyof Pick<GeoScore, 'total' | 'citationRate' | 'contentStructure' | 'authorityScore' | 'brandConsistency'>, number> {
  return {
    total: current.total - previous.total,
    citationRate: current.citationRate - previous.citationRate,
    contentStructure: current.contentStructure - previous.contentStructure,
    authorityScore: current.authorityScore - previous.authorityScore,
    brandConsistency: current.brandConsistency - previous.brandConsistency,
  };
}
