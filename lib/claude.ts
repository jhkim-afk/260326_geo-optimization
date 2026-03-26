// Gemini AI 클라이언트 및 타입 정의 — 서버사이드 전용
// 모델: gemini-3-flash-preview (Google Generative AI)

import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── 타입 정의 ────────────────────────────────────────────────────────────────

export interface SimulationResult {
  answer: string;
  mentionedBrands: string[];
  sourceTypesCited: string[];
  answerConfidence: 'high' | 'medium' | 'low';
  contentGaps: string[];
}

export interface OptimizationSuggestion {
  problem: string;       // 문제점 (현재 상태)
  improvement: string;   // 개선 방향 (구체적 액션)
  expectedEffect: 'high' | 'medium' | 'low'; // 예상 효과
  improvedExample: string; // 개선된 텍스트 예시
  category: 'citation' | 'structure' | 'authority' | 'consistency';
}

export interface OptimizationResult {
  suggestions: OptimizationSuggestion[];
  overallAssessment: string;
}

export interface GeneratedQuestion {
  question: string;
  intent: string;         // 검색 의도
  geoReadiness: number;   // 현재 GEO 준비도 0-100
  difficulty: 'low' | 'medium' | 'high';
}

export interface KeywordConversionResult {
  keyword: string;
  questions: GeneratedQuestion[];
}

// ─── 사용 모델 상수 ──────────────────────────────────────────────────────────

const GEMINI_MODEL = 'gemini-3-flash-preview';

// ─── Gemini 클라이언트 싱글턴 ─────────────────────────────────────────────────

let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
    }
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
}

// GEO 시뮬레이션 시스템 프롬프트
const SIMULATION_SYSTEM_PROMPT = `You are simulating how an AI search engine answers e-commerce queries.
Given the user's query, provide a natural, helpful answer as an AI assistant would.
Mention relevant brands, products, and sources when appropriate.
After the answer, provide a JSON block with:
{
  "mentioned_brands": [],
  "source_types_cited": [],
  "answer_confidence": "high|medium|low",
  "content_gaps": []
}

Format your response as:
<answer>
Your natural answer here
</answer>
<analysis>
{"mentioned_brands": [...], "source_types_cited": [...], "answer_confidence": "...", "content_gaps": [...]}
</analysis>`;

// ─── AI 답변 시뮬레이션 ──────────────────────────────────────────────────────

/**
 * AI 답변 시뮬레이터: 주어진 질문에 대해 AI가 어떻게 답변하는지 시뮬레이션
 * Gemini API를 SSE 스트리밍으로 호출
 */
export async function* simulateAiAnswer(
  query: string,
  brandName?: string,
): AsyncGenerator<string> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: SIMULATION_SYSTEM_PROMPT,
  });

  const userMessage = brandName
    ? `Query: ${query}\n\nContext: The user's brand is "${brandName}". Check if this brand gets mentioned naturally in the answer.`
    : `Query: ${query}`;

  const result = await model.generateContentStream(userMessage);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      yield text;
    }
  }
}

/**
 * 시뮬레이션 응답 텍스트를 파싱하여 구조화된 결과를 반환
 */
export function parseSimulationResponse(rawText: string): SimulationResult {
  const answerMatch = rawText.match(/<answer>([\s\S]*?)<\/answer>/);
  const analysisMatch = rawText.match(/<analysis>([\s\S]*?)<\/analysis>/);

  const answer = answerMatch?.[1]?.trim() ?? rawText;

  let mentionedBrands: string[] = [];
  let sourceTypesCited: string[] = [];
  let answerConfidence: 'high' | 'medium' | 'low' = 'medium';
  let contentGaps: string[] = [];

  if (analysisMatch?.[1]) {
    try {
      const parsed = JSON.parse(analysisMatch[1].trim()) as {
        mentioned_brands?: string[];
        source_types_cited?: string[];
        answer_confidence?: string;
        content_gaps?: string[];
      };
      mentionedBrands = parsed.mentioned_brands ?? [];
      sourceTypesCited = parsed.source_types_cited ?? [];
      answerConfidence =
        (parsed.answer_confidence as 'high' | 'medium' | 'low') ?? 'medium';
      contentGaps = parsed.content_gaps ?? [];
    } catch {
      // JSON 파싱 실패 시 빈 값으로 유지
    }
  }

  return { answer, mentionedBrands, sourceTypesCited, answerConfidence, contentGaps };
}

// ─── 콘텐츠 최적화 제안 ──────────────────────────────────────────────────────

/**
 * 상품 페이지 콘텐츠를 분석하여 GEO 관점의 최적화 제안 생성
 */
export async function generateOptimizationSuggestions(
  content: string,
  brandName: string,
  targetKeywords: string[],
): Promise<OptimizationResult> {
  const client = getGeminiClient();

  const systemPrompt = `You are a GEO (Generative Engine Optimization) expert specializing in e-commerce content.
Analyze the given content and provide up to 5 specific, actionable optimization suggestions to improve how AI search engines like ChatGPT, Gemini, and Perplexity cite and mention this brand/product.

GEO Optimization Principles:
1. Citable content: Include statistics, specific numbers, and clear facts
2. Structured information: FAQ, lists, step-by-step formats
3. E-E-A-T signals: Expertise, Experience, Authoritativeness, Trustworthiness
4. Semantic completeness: Questions and answers complete within one page
5. Brand consistency: Consistent use of brand name, product names, category terms

Respond in Korean with this exact JSON format:
{
  "suggestions": [
    {
      "problem": "현재 문제점",
      "improvement": "구체적인 개선 방향",
      "expectedEffect": "high|medium|low",
      "improvedExample": "즉시 사용 가능한 개선 텍스트 예시",
      "category": "citation|structure|authority|consistency"
    }
  ],
  "overallAssessment": "전반적인 GEO 현황 평가 (2-3문장)"
}`;

  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemPrompt,
  });

  const userMessage = `Brand: ${brandName}
Target Keywords: ${targetKeywords.join(', ')}

Content to analyze:
${content}`;

  const result = await model.generateContent(userMessage);
  const rawText = result.response.text();

  // JSON 블록 추출
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI 응답에서 JSON을 파싱할 수 없습니다.');
  }

  const parsed = JSON.parse(jsonMatch[0]) as OptimizationResult;
  return parsed;
}

// ─── 키워드 → AI 질문 변환 ───────────────────────────────────────────────────

/**
 * e-commerce 키워드를 실제 유저가 AI에게 물어볼 법한 질문 패턴으로 변환
 */
export async function convertKeywordToQuestions(
  keyword: string,
  brandName: string,
  category: string,
): Promise<KeywordConversionResult> {
  const client = getGeminiClient();

  const systemPrompt = `You are an expert in understanding how consumers use AI search engines for e-commerce decisions.
Convert e-commerce keywords into natural questions that real users would ask AI assistants like ChatGPT or Gemini.

For each question, assess the GEO readiness score (0-100) based on how well a typical brand in this category would be positioned to appear in AI answers.

Respond in Korean with this exact JSON format:
{
  "questions": [
    {
      "question": "자연스러운 한국어 질문",
      "intent": "검색 의도 (추천/비교/정보/구매)",
      "geoReadiness": 75,
      "difficulty": "low|medium|high"
    }
  ]
}

Generate exactly 10 questions covering different user intents: recommendation, comparison, information, and purchase decision.`;

  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemPrompt,
  });

  const userMessage = `Keyword: ${keyword}
Brand: ${brandName}
Category: ${category}`;

  const result = await model.generateContent(userMessage);
  const rawText = result.response.text();

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI 응답에서 JSON을 파싱할 수 없습니다.');
  }

  const parsed = JSON.parse(jsonMatch[0]) as { questions: GeneratedQuestion[] };
  return { keyword, questions: parsed.questions };
}

// ─── Rate Limit 검사 ─────────────────────────────────────────────────────────

export const DAILY_LIMITS: Record<string, number> = {
  FREE: 10,
  PRO: 100,
  AGENCY: Infinity,
};
