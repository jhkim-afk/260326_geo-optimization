// GEO 점수 계산 함수 단위 테스트 — Jest, 커버리지 90% 이상 목표

import {
  calculateGeoScore,
  compareGeoScores,
  type GeoAnalysisInput,
  type GeoScore,
} from '../lib/geo-calculator';

// ─── 테스트 픽스처 ────────────────────────────────────────────────────────────

const MINIMAL_INPUT: GeoAnalysisInput = {
  brandName: 'TestBrand',
  productPageContent: 'This is a short text.',
  targetKeywords: [],
  competitorNames: [],
};

const RICH_INPUT: GeoAnalysisInput = {
  brandName: 'GreenSkin',
  productPageContent: `
# GreenSkin 비건 선크림 SPF50+

## 제품 특징
- 피부과 전문의 추천 (5년 임상 연구 결과)
- 비건 인증 (Korea Vegan Society 공인)
- 95%의 고객이 피부 자극 없음을 경험
- SPF50+ PA++++ 최고 등급

## 자주 묻는 질문 (FAQ)

Q. 민감성 피부에도 사용 가능한가요?
A. 네, GreenSkin 선크림은 피부과 전문의 테스트를 완료하여 민감성 피부에도 안전합니다.

Q. 비건 인증을 받은 제품인가요?
A. 네, 국제 비건 인증 기관으로부터 공식 인증을 받았습니다.

## 성분 및 안전성
모든 성분은 EU 화장품 규정 기준을 충족하며, 동물 실험을 하지 않습니다.
GreenSkin은 2019년 설립 이래 5년간 비건 뷰티 분야 1위를 유지하고 있습니다.

## 고객 후기
평균 별점 4.8점 (리뷰 12,450개 기준)
"피부 트러블 없이 편하게 사용할 수 있어서 매일 사용하고 있어요." - 실제 구매자

출처: 자체 임상 연구 데이터 2024년 기준
`,
  targetKeywords: ['비건 선크림', 'SPF50', '민감성 피부'],
  competitorNames: ['SunBlock Pro', 'NaturalShield'],
};

const COMPETITOR_HEAVY_INPUT: GeoAnalysisInput = {
  brandName: 'MyBrand',
  productPageContent: 'SunBlock Pro is the best. NaturalShield is recommended. MyBrand has products.',
  targetKeywords: ['선크림'],
  competitorNames: ['SunBlock Pro', 'NaturalShield'],
};

// ─── calculateGeoScore 테스트 ─────────────────────────────────────────────────

describe('calculateGeoScore', () => {
  describe('반환 타입 및 범위 검증', () => {
    it('GeoScore 객체를 반환해야 한다', () => {
      const result = calculateGeoScore(MINIMAL_INPUT);
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('citationRate');
      expect(result).toHaveProperty('contentStructure');
      expect(result).toHaveProperty('authorityScore');
      expect(result).toHaveProperty('brandConsistency');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('recommendations');
    });

    it('모든 점수는 0에서 100 사이여야 한다', () => {
      const result = calculateGeoScore(MINIMAL_INPUT);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.total).toBeLessThanOrEqual(100);
      expect(result.citationRate).toBeGreaterThanOrEqual(0);
      expect(result.citationRate).toBeLessThanOrEqual(100);
      expect(result.contentStructure).toBeGreaterThanOrEqual(0);
      expect(result.contentStructure).toBeLessThanOrEqual(100);
      expect(result.authorityScore).toBeGreaterThanOrEqual(0);
      expect(result.authorityScore).toBeLessThanOrEqual(100);
      expect(result.brandConsistency).toBeGreaterThanOrEqual(0);
      expect(result.brandConsistency).toBeLessThanOrEqual(100);
    });

    it('종합 점수는 정수여야 한다', () => {
      const result = calculateGeoScore(MINIMAL_INPUT);
      expect(Number.isInteger(result.total)).toBe(true);
    });

    it('breakdown 배열은 4개 항목을 포함해야 한다', () => {
      const result = calculateGeoScore(MINIMAL_INPUT);
      expect(result.breakdown).toHaveLength(4);
    });
  });

  describe('가중치 공식 검증', () => {
    it('종합 점수가 가중 평균 공식과 일치해야 한다', () => {
      const result = calculateGeoScore(RICH_INPUT);
      // GEO Score = (Citation × 0.35) + (Structure × 0.25) + (Authority × 0.20) + (Consistency × 0.20)
      const expected = Math.round(
        result.citationRate * 0.35 +
        result.contentStructure * 0.25 +
        result.authorityScore * 0.20 +
        result.brandConsistency * 0.20,
      );
      expect(result.total).toBe(expected);
    });
  });

  describe('콘텐츠 품질에 따른 점수 차이', () => {
    it('풍부한 콘텐츠가 최소 콘텐츠보다 높은 점수를 받아야 한다', () => {
      const minimalResult = calculateGeoScore(MINIMAL_INPUT);
      const richResult = calculateGeoScore(RICH_INPUT);
      expect(richResult.total).toBeGreaterThan(minimalResult.total);
    });

    it('FAQ/통계가 포함된 콘텐츠는 인용 점수가 더 높아야 한다', () => {
      const minimalResult = calculateGeoScore(MINIMAL_INPUT);
      const richResult = calculateGeoScore(RICH_INPUT);
      expect(richResult.citationRate).toBeGreaterThan(minimalResult.citationRate);
    });

    it('구조화된 콘텐츠(제목/목록 포함)는 구조 점수가 더 높아야 한다', () => {
      const minimalResult = calculateGeoScore(MINIMAL_INPUT);
      const richResult = calculateGeoScore(RICH_INPUT);
      expect(richResult.contentStructure).toBeGreaterThan(minimalResult.contentStructure);
    });
  });

  describe('브랜드 일관성 점수', () => {
    it('경쟁사보다 브랜드 언급이 많으면 일관성 점수가 높아야 한다', () => {
      const goodBrandInput: GeoAnalysisInput = {
        ...MINIMAL_INPUT,
        brandName: 'MyBrand',
        productPageContent: 'MyBrand offers great products. MyBrand is trusted. MyBrand cares about quality. MyBrand is innovative. MyBrand leads the market.',
        competitorNames: ['Competitor1'],
        targetKeywords: [],
      };
      const result = calculateGeoScore(goodBrandInput);
      expect(result.brandConsistency).toBeGreaterThan(0);
    });

    it('경쟁사 언급이 많고 브랜드 언급이 적으면 일관성 점수가 낮아야 한다', () => {
      const richResult = calculateGeoScore(RICH_INPUT);
      const competitorHeavyResult = calculateGeoScore(COMPETITOR_HEAVY_INPUT);
      // RICH_INPUT은 GreenSkin 언급 多, COMPETITOR_HEAVY_INPUT은 경쟁사 언급 多
      expect(richResult.brandConsistency).toBeGreaterThanOrEqual(
        competitorHeavyResult.brandConsistency,
      );
    });

    it('키워드가 모두 포함된 콘텐츠는 일관성 점수가 올라야 한다', () => {
      const withKeywords: GeoAnalysisInput = {
        brandName: 'MyBrand',
        productPageContent: 'MyBrand 비건 선크림 SPF50 민감성 피부 전용 제품입니다.',
        targetKeywords: ['비건 선크림', 'SPF50', '민감성 피부'],
        competitorNames: [],
      };
      const withoutKeywords: GeoAnalysisInput = {
        ...withKeywords,
        targetKeywords: ['없는키워드1', '없는키워드2'],
      };

      const withResult = calculateGeoScore(withKeywords);
      const withoutResult = calculateGeoScore(withoutKeywords);
      expect(withResult.brandConsistency).toBeGreaterThan(withoutResult.brandConsistency);
    });
  });

  describe('권위/E-E-A-T 점수', () => {
    it('전문가 용어가 많은 콘텐츠는 권위 점수가 높아야 한다', () => {
      const expertInput: GeoAnalysisInput = {
        ...MINIMAL_INPUT,
        productPageContent:
          '피부과 전문의 추천, 국제 인증 획득, 특허 기술 적용, 1위 브랜드, 전문가 임상 연구 결과 검증완료. 수상 실적 다수.',
      };
      const basicInput: GeoAnalysisInput = {
        ...MINIMAL_INPUT,
        productPageContent: '좋은 제품입니다. 사용해보세요.',
      };
      const expertResult = calculateGeoScore(expertInput);
      const basicResult = calculateGeoScore(basicInput);
      expect(expertResult.authorityScore).toBeGreaterThan(basicResult.authorityScore);
    });
  });

  describe('추천사항 생성', () => {
    it('낮은 점수 항목에 대해 추천사항이 생성되어야 한다', () => {
      const result = calculateGeoScore(MINIMAL_INPUT);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('추천사항 우선순위는 high > medium > low 순으로 정렬되어야 한다', () => {
      const result = calculateGeoScore(MINIMAL_INPUT);
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      for (let i = 0; i < result.recommendations.length - 1; i++) {
        expect(priorityOrder[result.recommendations[i].priority]).toBeLessThanOrEqual(
          priorityOrder[result.recommendations[i + 1].priority],
        );
      }
    });

    it('각 추천사항은 category 필드를 포함해야 한다', () => {
      const result = calculateGeoScore(MINIMAL_INPUT);
      const validCategories = ['citation', 'structure', 'authority', 'consistency'];
      result.recommendations.forEach((rec) => {
        expect(validCategories).toContain(rec.category);
      });
    });
  });

  describe('엣지 케이스', () => {
    it('빈 문자열 콘텐츠도 오류 없이 처리해야 한다', () => {
      const emptyInput: GeoAnalysisInput = {
        brandName: 'Brand',
        productPageContent: '',
        targetKeywords: [],
        competitorNames: [],
      };
      expect(() => calculateGeoScore(emptyInput)).not.toThrow();
      const result = calculateGeoScore(emptyInput);
      expect(result.total).toBe(0);
    });

    it('브랜드명에 정규식 특수문자가 포함되어도 오류 없이 처리해야 한다', () => {
      const specialInput: GeoAnalysisInput = {
        brandName: 'Brand+Plus (Special)',
        productPageContent: 'Brand+Plus (Special) is great.',
        targetKeywords: [],
        competitorNames: [],
      };
      expect(() => calculateGeoScore(specialInput)).not.toThrow();
    });

    it('매우 긴 콘텐츠도 100점을 초과하지 않아야 한다', () => {
      const longContent = Array(100).fill(
        '전문가 추천 인증 특허 수상 비건 SPF50 민감성 자극 없는 고객 만족 리뷰 별점 출처 연구 데이터 보고서 FAQ Q. A. 1단계 2단계',
      ).join('\n\n');
      const longInput: GeoAnalysisInput = {
        brandName: 'MyBrand',
        productPageContent: longContent,
        targetKeywords: ['비건', 'SPF50'],
        competitorNames: [],
      };
      const result = calculateGeoScore(longInput);
      expect(result.total).toBeLessThanOrEqual(100);
      expect(result.citationRate).toBeLessThanOrEqual(100);
      expect(result.contentStructure).toBeLessThanOrEqual(100);
      expect(result.authorityScore).toBeLessThanOrEqual(100);
      expect(result.brandConsistency).toBeLessThanOrEqual(100);
    });
  });
});

// ─── compareGeoScores 테스트 ──────────────────────────────────────────────────

describe('compareGeoScores', () => {
  const scoreA: GeoScore = {
    total: 75,
    citationRate: 80,
    contentStructure: 70,
    authorityScore: 65,
    brandConsistency: 85,
    breakdown: [],
    recommendations: [],
  };

  const scoreB: GeoScore = {
    total: 60,
    citationRate: 50,
    contentStructure: 65,
    authorityScore: 70,
    brandConsistency: 55,
    breakdown: [],
    recommendations: [],
  };

  it('현재-이전 점수의 차이를 정확히 계산해야 한다', () => {
    const delta = compareGeoScores(scoreA, scoreB);
    expect(delta.total).toBe(15);
    expect(delta.citationRate).toBe(30);
    expect(delta.contentStructure).toBe(5);
    expect(delta.authorityScore).toBe(-5);
    expect(delta.brandConsistency).toBe(30);
  });

  it('동일한 점수를 비교하면 모두 0이어야 한다', () => {
    const delta = compareGeoScores(scoreA, scoreA);
    expect(delta.total).toBe(0);
    expect(delta.citationRate).toBe(0);
    expect(delta.contentStructure).toBe(0);
    expect(delta.authorityScore).toBe(0);
    expect(delta.brandConsistency).toBe(0);
  });
});
