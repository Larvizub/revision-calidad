import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardTrendCoordinates, DashboardTrendPoint } from '../lib/dashboard.types';

interface DashboardTrendCardProps {
  trendCoordinates: DashboardTrendCoordinates;
  promedioEfectividad: number;
  mejorMes: DashboardTrendPoint;
  ultimoMes: DashboardTrendPoint;
}

const DashboardTrendCard: React.FC<DashboardTrendCardProps> = ({
  trendCoordinates,
  promedioEfectividad,
  mejorMes,
  ultimoMes
}) => {
  return (
    <Card className="border border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <TrendingUp className="h-5 w-5" />
          Tendencia de Efectividad de las Revisiones
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Evolución mensual del porcentaje de revisiones aprobadas.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${trendCoordinates.chartWidth} ${trendCoordinates.chartHeight}`}
            className="w-full min-w-[680px] h-72"
            role="img"
            aria-label="Tendencia de efectividad de revisiones"
          >
            {[0, 25, 50, 75, 100].map((value) => {
              const y = trendCoordinates.chartHeight - trendCoordinates.chartPadding - (value / 100) * (trendCoordinates.chartHeight - trendCoordinates.chartPadding * 2);
              return (
                <g key={value}>
                  <line
                    x1={trendCoordinates.chartPadding}
                    y1={y}
                    x2={trendCoordinates.chartWidth - trendCoordinates.chartPadding}
                    y2={y}
                    stroke="hsl(var(--border))"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={trendCoordinates.chartPadding - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-muted-foreground"
                    fontSize="12"
                  >
                    {value}%
                  </text>
                </g>
              );
            })}

            {trendCoordinates.areaPoints && (
              <polygon
                points={trendCoordinates.areaPoints}
                fill="url(#effectivenessAreaGradient)"
                opacity="0.35"
              />
            )}

            {trendCoordinates.polylinePoints && (
              <polyline
                points={trendCoordinates.polylinePoints}
                fill="none"
                stroke="#16a34a"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {trendCoordinates.points.map((point) => (
              <g key={`${point.label}-${point.x}`}>
                <circle cx={point.x} cy={point.y} r="4.5" fill="#16a34a" />
                <circle cx={point.x} cy={point.y} r="8" fill="#16a34a" opacity="0.15" />
                <text
                  x={point.x}
                  y={trendCoordinates.chartHeight - trendCoordinates.chartPadding + 18}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  fontSize="12"
                >
                  {point.label}
                </text>
                <text
                  x={point.x}
                  y={point.y - 10}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="600"
                  fill="#166534"
                >
                  {point.efectividad}%
                </text>
              </g>
            ))}

            <defs>
              <linearGradient id="effectivenessAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border border-border/50 bg-accent/20 p-3">
            <p className="text-xs text-muted-foreground">Promedio del período</p>
            <p className="text-xl font-bold text-foreground">{promedioEfectividad}%</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-green-50 dark:bg-green-950 p-3">
            <p className="text-xs text-muted-foreground">Mejor mes</p>
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">{mejorMes.label}</p>
            <p className="text-lg font-bold text-green-600">{mejorMes.efectividad}%</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-blue-50 dark:bg-blue-950 p-3">
            <p className="text-xs text-muted-foreground">Último mes</p>
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{ultimoMes.label}</p>
            <p className="text-lg font-bold text-blue-600">{ultimoMes.efectividad}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardTrendCard;
