import React from 'react';
import { PieChart, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buildConicGradient } from '../lib/dashboard-utils';
import type { CircularChartSegment } from '../lib/dashboard.types';

interface CircularChartCardProps {
  title: string;
  centerLabel: string;
  icon: React.ReactNode;
  total: number;
  segments: CircularChartSegment[];
}

interface DashboardCircularChartsProps {
  revisionTotal: number;
  rolesTotal: number;
  estadoRevisionSegments: CircularChartSegment[];
  rolesSegments: CircularChartSegment[];
}

const CircularChartCard: React.FC<CircularChartCardProps> = ({
  title,
  centerLabel,
  icon,
  total,
  segments
}) => {
  return (
    <Card className="border border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col xl:flex-row items-center gap-6">
          <div className="relative h-52 w-52 shrink-0">
            <div
              className="absolute inset-0 rounded-full border border-border/70"
              style={{ background: buildConicGradient(segments) }}
            />
            <div className="absolute inset-8 rounded-full bg-card border border-border/60 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold text-foreground">{total}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{centerLabel}</span>
            </div>
          </div>

          <div className="w-full space-y-2">
            {segments.map((segment) => {
              const percentage = total > 0 ? Math.round((segment.value / total) * 100) : 0;
              return (
                <div key={segment.label} className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                    <span className="text-sm font-medium">{segment.label}</span>
                  </div>
                  <div className="text-sm">
                    <span className={`font-semibold ${segment.textClass}`}>{segment.value}</span>
                    <span className="text-muted-foreground"> ({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const DashboardCircularCharts: React.FC<DashboardCircularChartsProps> = ({
  revisionTotal,
  rolesTotal,
  estadoRevisionSegments,
  rolesSegments
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CircularChartCard
        title="Composición Circular de Revisiones"
        centerLabel="Total"
        icon={<PieChart className="h-5 w-5" />}
        total={revisionTotal}
        segments={estadoRevisionSegments}
      />

      <CircularChartCard
        title="Composición Circular de Roles"
        centerLabel="Usuarios"
        icon={<Users className="h-5 w-5" />}
        total={rolesTotal}
        segments={rolesSegments}
      />
    </div>
  );
};

export default DashboardCircularCharts;
