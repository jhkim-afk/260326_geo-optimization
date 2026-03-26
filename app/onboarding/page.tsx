// 온보딩 플로우 — 브랜드 정보 입력 (3단계)

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Brain, Plus, Trash2, ArrowRight, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { brandSetupSchema, ECOMMERCE_CATEGORIES, type BrandSetupInput } from '@/lib/validations';

const STEPS = ['브랜드 기본정보', '키워드 & 상품', '경쟁사 설정'];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [productInput, setProductInput] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<BrandSetupInput>({
    resolver: zodResolver(brandSetupSchema),
    defaultValues: {
      name: '',
      category: '',
      websiteUrl: '',
      mainProducts: [],
      targetKeywords: [],
      competitors: [],
    },
  });

  const { fields: competitorFields, append: appendCompetitor, remove: removeCompetitor } =
    useFieldArray({ control, name: 'competitors' });

  const keywords = watch('targetKeywords');
  const products = watch('mainProducts');

  const addKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed) && keywords.length < 20) {
      setValue('targetKeywords', [...keywords, trimmed]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw: string) => {
    setValue('targetKeywords', keywords.filter((k) => k !== kw));
  };

  const addProduct = () => {
    const trimmed = productInput.trim();
    if (trimmed && !products.includes(trimmed) && products.length < 10) {
      setValue('mainProducts', [...products, trimmed]);
      setProductInput('');
    }
  };

  const removeProduct = (product: string) => {
    setValue('mainProducts', products.filter((p) => p !== product));
  };

  const onSubmit = async (data: BrandSetupInput) => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setError(json.error ?? '저장에 실패했습니다.');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* 헤더 */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <Brain className="h-7 w-7 text-indigo-600" />
          <span className="text-xl font-bold text-gray-900">GEO Studio</span>
        </div>

        {/* 진행 표시 */}
        <div className="flex items-center justify-center mb-8 gap-2">
          {STEPS.map((step, index) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  index < currentStep
                    ? 'bg-indigo-600 text-white'
                    : index === currentStep
                    ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={`text-sm hidden sm:block ${
                  index === currentStep ? 'text-indigo-700 font-medium' : 'text-gray-400'
                }`}
              >
                {step}
              </span>
              {index < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${index < currentStep ? 'bg-indigo-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{STEPS[currentStep]}</CardTitle>
            <CardDescription>
              {currentStep === 0 && '브랜드의 기본 정보를 입력해주세요.'}
              {currentStep === 1 && '분석할 키워드와 주요 상품을 설정하세요.'}
              {currentStep === 2 && '추적할 경쟁사를 최대 3개까지 입력하세요. (선택사항)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2 mb-4">{error}</p>
            )}

            {/* Step 1: 브랜드 기본정보 */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    브랜드명 <span className="text-red-500">*</span>
                  </label>
                  <Input placeholder="예: 닥터블랜드" {...register('name')} />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    카테고리 <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    {...register('category')}
                  >
                    <option value="">카테고리 선택</option>
                    {ECOMMERCE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    웹사이트 URL (선택)
                  </label>
                  <Input placeholder="https://yourbrand.com" {...register('websiteUrl')} />
                  {errors.websiteUrl && <p className="text-xs text-red-500 mt-1">{errors.websiteUrl.message}</p>}
                </div>
              </div>
            )}

            {/* Step 2: 키워드 & 상품 */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    타겟 키워드 <span className="text-red-500">*</span>
                    <span className="text-gray-400 font-normal ml-1">({keywords.length}/20)</span>
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="예: 비건 선크림"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    />
                    <Button type="button" variant="outline" onClick={addKeyword}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[40px]">
                    {keywords.map((kw) => (
                      <Badge
                        key={kw}
                        variant="default"
                        className="cursor-pointer gap-1"
                        onClick={() => removeKeyword(kw)}
                      >
                        {kw} ×
                      </Badge>
                    ))}
                  </div>
                  {errors.targetKeywords && <p className="text-xs text-red-500 mt-1">{errors.targetKeywords.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    주요 상품 <span className="text-red-500">*</span>
                    <span className="text-gray-400 font-normal ml-1">({products.length}/10)</span>
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="예: SPF50+ 비건 선크림 50ml"
                      value={productInput}
                      onChange={(e) => setProductInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addProduct())}
                    />
                    <Button type="button" variant="outline" onClick={addProduct}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[40px]">
                    {products.map((p) => (
                      <Badge
                        key={p}
                        variant="secondary"
                        className="cursor-pointer gap-1"
                        onClick={() => removeProduct(p)}
                      >
                        {p} ×
                      </Badge>
                    ))}
                  </div>
                  {errors.mainProducts && <p className="text-xs text-red-500 mt-1">{errors.mainProducts.message}</p>}
                </div>
              </div>
            )}

            {/* Step 3: 경쟁사 */}
            {currentStep === 2 && (
              <div className="space-y-4">
                {competitorFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder={`경쟁사 ${index + 1} 이름`}
                        {...register(`competitors.${index}.name`)}
                      />
                      <Input
                        placeholder="웹사이트 URL (선택)"
                        {...register(`competitors.${index}.websiteUrl`)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCompetitor(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}

                {competitorFields.length < 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => appendCompetitor({ name: '', websiteUrl: '' })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    경쟁사 추가
                  </Button>
                )}

                {competitorFields.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    경쟁사를 추가하면 GEO 비교 분석을 활용할 수 있습니다.
                  </p>
                )}
              </div>
            )}

            {/* 네비게이션 버튼 */}
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep((s) => s - 1)}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                이전
              </Button>

              {currentStep < STEPS.length - 1 ? (
                <Button type="button" onClick={() => setCurrentStep((s) => s + 1)}>
                  다음
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-1" />
                  )}
                  시작하기
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
