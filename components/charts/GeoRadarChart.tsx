// GEO 경쟁사 비교 레이더 차트 — Recharts 기반

'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface RadarDataPoint {
  category: string;
  [brandName: string]: number | string;
}

interface GeoRadarChartProps {
  brandName: string;
  brandScores: {
    citationRate: number;
    contentStructure: number;
    authorityScore: number;
    brandConsistency: number;
  };
  competitors?: Array<{
    name: string;
    citationRate: number;
    contentStructure: number;
    authorityScore: number;
    brandConsistency: number;
  }>;
  isLoading?: boolean;
}

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export function GeoRadarChart({
  brandName,
  brandScores,
  competitors = [],
  isLoading = false,
}: GeoRadarChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-72 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const data: RadarDataPoint[] = [
    {
      category: 'AI 인용 가능성',
      [brandName]: brandScores.citationRate,
      ...Object.fromEntries(competitors.map((c) => [c.name, c.citationRate])),
    },
    {
      category: '콘텐츠 구조화',
      [brandName]: brandScores.contentStructure,
      ...Object.fromEntries(competitors.map((c) => [c.name, c.contentStructure])),
    },
    {
      category: 'E-E-A-T 권위',
      [brandName]: brandScores.authorityScore,
      ...Object.fromEntries(competitors.map((c) => [c.name, c.authorityScore])),
    },
    {
      category: '브랜드 일관성',
      [brandName]: brandScores.brandConsistency,
      ...Object.fromEntries(competitors.map((c) => [c.name, c.brandConsistency])),
    },
  ];

  const allBrands = [brandName, ...competitors.map((c) => c.name)];

  return (
    <Card>
      <CardHeader>
        <CardTitle>GEO 경쟁사 비교</CardTitle>
        <CardDescription>
          4개 핵심 지표에서 경쟁사 대비 GEO 최적화 현황
        </CardDescription>
      </CardHeader>
      <CardContent>
        {competitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <p className="text-sm">경쟁사를 추가하면 비교 분석을 확인할 수 있습니다.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data}>
              <PolarGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
              />
              <Tooltip
                formatter={(value, name) => [
                  `${Math.round(Number(value))}점`,
                  String(name),
                ]}
              />
              <Legend />
              {allBrands.map((name, index) => (
                <Radar
                  key={name}
                  name={name}
                  dataKey={name}
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={index === 0 ? 0.2 : 0.05}
                  strokeWidth={index === 0 ? 2 : 1.5}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
