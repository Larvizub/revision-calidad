import type { Revision } from '@/types';

export interface DashboardFilters {
  fechaDesde?: string | null;
  fechaHasta?: string | null;
}

export interface DashboardRecentRevision extends Revision {
  eventoNombre?: string;
  areaNombre?: string;
}

export interface DashboardMetrics {
  usuarios: {
    total: number;
    activos: number;
    administradores: number;
    calidad: number;
    estandar: number;
  };
  eventos: {
    total: number;
    activos: number;
    porRevisar: number;
    aprobadosEnRango?: number;
  };
  areas: {
    total: number;
    activas: number;
  };
  revisiones: {
    total: number;
    pendientes: number;
    aprobadas: number;
    rechazadas: number;
    tasaAprobacion: number;
  };
  revisionesRecientes: DashboardRecentRevision[];
}

export interface CircularChartSegment {
  label: string;
  value: number;
  color: string;
  textClass: string;
}

export interface DashboardTrendPoint {
  key: string;
  label: string;
  total: number;
  aprobadas: number;
  efectividad: number;
}

export interface DashboardTrendCoordinatePoint {
  x: number;
  y: number;
  label: string;
  efectividad: number;
}

export interface DashboardTrendCoordinates {
  chartWidth: number;
  chartHeight: number;
  chartPadding: number;
  points: DashboardTrendCoordinatePoint[];
  polylinePoints: string;
  areaPoints: string;
}

export interface DashboardTrendSummary {
  promedioEfectividad: number;
  mejorMes: DashboardTrendPoint;
  ultimoMes: DashboardTrendPoint;
}
