import type { Area, Evento, Revision, Usuario } from '@/types';
import type {
  CircularChartSegment,
  DashboardFilters,
  DashboardMetrics,
  DashboardTrendCoordinates,
  DashboardTrendPoint,
  DashboardTrendSummary
} from './dashboard.types';

const EMPTY_TREND_POINT: DashboardTrendPoint = {
  key: 'N/A',
  label: 'Sin datos',
  total: 0,
  aprobadas: 0,
  efectividad: 0
};

export const applyRevisionFilters = (revisiones: Revision[], filtros?: DashboardFilters): Revision[] => {
  let filtradas = revisiones;

  if (filtros?.fechaDesde) {
    const desde = new Date(filtros.fechaDesde);
    filtradas = filtradas.filter((revision) => new Date(revision.fechaRevision) >= desde);
  }

  if (filtros?.fechaHasta) {
    const hastaDate = new Date(filtros.fechaHasta);
    hastaDate.setHours(23, 59, 59, 999);
    filtradas = filtradas.filter((revision) => new Date(revision.fechaRevision) <= hastaDate);
  }

  return filtradas;
};

export const computeDashboardMetrics = (
  usuarios: Usuario[],
  eventos: Evento[],
  areas: Area[],
  revisiones: Revision[],
  filtros?: DashboardFilters
): DashboardMetrics => {
  const revisionesFiltradas = applyRevisionFilters(revisiones, filtros);

  const usuariosMetrics = {
    total: usuarios.length,
    activos: usuarios.filter((usuario) => usuario.estado === 'activo').length,
    administradores: usuarios.filter((usuario) => usuario.rol === 'administrador').length,
    calidad: usuarios.filter((usuario) => usuario.rol === 'calidad').length,
    estandar: usuarios.filter((usuario) => usuario.rol === 'estandar').length
  };

  let eventosAprobadosEnRango = 0;
  try {
    let aprobadas = revisiones.filter((revision) => revision.estado === 'aprobado' && revision.fechaAprobacion);
    if (filtros?.fechaDesde) {
      const desde = new Date(filtros.fechaDesde);
      aprobadas = aprobadas.filter((revision) => new Date(revision.fechaAprobacion!) >= desde);
    }
    if (filtros?.fechaHasta) {
      const hastaDate = new Date(filtros.fechaHasta);
      hastaDate.setHours(23, 59, 59, 999);
      aprobadas = aprobadas.filter((revision) => new Date(revision.fechaAprobacion!) <= hastaDate);
    }
    eventosAprobadosEnRango = new Set(aprobadas.map((revision) => revision.idEvento)).size;
  } catch (error) {
    console.debug('Dashboard: error calculando eventos aprobados en rango', error);
  }

  const eventosMetrics = {
    total: eventos.length,
    activos: eventos.filter((evento) => evento.estado === 'activo').length,
    porRevisar: eventos.filter((evento) => evento.estado === 'activo').length,
    aprobadosEnRango: eventosAprobadosEnRango
  };

  const areasMetrics = {
    total: areas.length,
    activas: areas.filter((area) => area.estado === 'activo').length
  };

  const pendientes = revisionesFiltradas.filter((revision) => revision.estado === 'pendiente').length;
  const aprobadas = revisionesFiltradas.filter((revision) => revision.estado === 'aprobado').length;
  const rechazadas = revisionesFiltradas.filter((revision) => revision.estado === 'rechazado').length;
  const tasaAprobacion = revisionesFiltradas.length > 0
    ? Math.round((aprobadas / revisionesFiltradas.length) * 100)
    : 0;

  const revisionesMetrics = {
    total: revisionesFiltradas.length,
    pendientes,
    aprobadas,
    rechazadas,
    tasaAprobacion
  };

  const eventosById = new Map(eventos.map((evento) => [evento.id, evento]));
  const areasById = new Map(areas.map((area) => [area.id, area]));

  const revisionesRecientes = [...revisionesFiltradas]
    .sort((a, b) => new Date(b.fechaRevision).getTime() - new Date(a.fechaRevision).getTime())
    .slice(0, 5)
    .map((revision) => ({
      ...revision,
      eventoNombre: eventosById.get(revision.idEvento)?.nombre || revision.idEvento,
      areaNombre: areasById.get(revision.idArea)?.nombre || revision.idArea
    }));

  return {
    usuarios: usuariosMetrics,
    eventos: eventosMetrics,
    areas: areasMetrics,
    revisiones: revisionesMetrics,
    revisionesRecientes
  };
};

export const buildConicGradient = (segments: CircularChartSegment[]): string => {
  const total = segments.reduce((acc, segment) => acc + segment.value, 0);
  if (total <= 0) {
    return 'conic-gradient(hsl(var(--muted)) 0% 100%)';
  }

  let cursor = 0;
  const stops = segments.map((segment) => {
    const start = (cursor / total) * 100;
    cursor += segment.value;
    const end = (cursor / total) * 100;
    return `${segment.color} ${start}% ${end}%`;
  });

  return `conic-gradient(${stops.join(', ')})`;
};

export const buildEstadoRevisionSegments = (
  metrics: DashboardMetrics | null
): CircularChartSegment[] => [
  {
    label: 'Aprobadas',
    value: metrics?.revisiones.aprobadas ?? 0,
    color: '#16a34a',
    textClass: 'text-green-600'
  },
  {
    label: 'Pendientes',
    value: metrics?.revisiones.pendientes ?? 0,
    color: '#ca8a04',
    textClass: 'text-yellow-600'
  },
  {
    label: 'Rechazadas',
    value: metrics?.revisiones.rechazadas ?? 0,
    color: '#dc2626',
    textClass: 'text-red-600'
  }
];

export const buildRolesSegments = (metrics: DashboardMetrics | null): CircularChartSegment[] => [
  {
    label: 'Administradores',
    value: metrics?.usuarios.administradores ?? 0,
    color: '#dc2626',
    textClass: 'text-red-600'
  },
  {
    label: 'Calidad',
    value: metrics?.usuarios.calidad ?? 0,
    color: '#2563eb',
    textClass: 'text-blue-600'
  },
  {
    label: 'Estándar',
    value: metrics?.usuarios.estandar ?? 0,
    color: '#16a34a',
    textClass: 'text-green-600'
  }
];

export const buildTrendData = (revisiones: Revision[], filtros: DashboardFilters): DashboardTrendPoint[] => {
  const filteredRevisiones = applyRevisionFilters(revisiones, filtros);
  const formatter = new Intl.DateTimeFormat('es-ES', { month: 'short', year: '2-digit' });

  const toMonthKey = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const fromMonthKey = (key: string): Date => {
    const [year, month] = key.split('-').map(Number);
    return new Date(year, month - 1, 1);
  };

  const monthBuckets = new Map<string, { total: number; aprobadas: number }>();

  filteredRevisiones.forEach((revision) => {
    const revisionDate = new Date(revision.fechaRevision);
    if (Number.isNaN(revisionDate.getTime())) {
      return;
    }

    const key = toMonthKey(new Date(revisionDate.getFullYear(), revisionDate.getMonth(), 1));
    const bucket = monthBuckets.get(key) ?? { total: 0, aprobadas: 0 };
    bucket.total += 1;
    if (revision.estado === 'aprobado') {
      bucket.aprobadas += 1;
    }
    monthBuckets.set(key, bucket);
  });

  let orderedKeys = Array.from(monthBuckets.keys()).sort();

  if (orderedKeys.length === 0) {
    const currentMonth = new Date();
    orderedKeys = Array.from({ length: 6 }, (_, idx) => {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - (5 - idx), 1);
      return toMonthKey(date);
    });
  } else if (orderedKeys.length > 6) {
    orderedKeys = orderedKeys.slice(-6);
  }

  return orderedKeys.map((key) => {
    const bucket = monthBuckets.get(key) ?? { total: 0, aprobadas: 0 };
    const efectividad = bucket.total > 0 ? Math.round((bucket.aprobadas / bucket.total) * 100) : 0;
    return {
      key,
      label: formatter.format(fromMonthKey(key)).replace('.', ''),
      total: bucket.total,
      aprobadas: bucket.aprobadas,
      efectividad
    };
  });
};

export const buildTrendCoordinates = (trendData: DashboardTrendPoint[]): DashboardTrendCoordinates => {
  const chartWidth = 760;
  const chartHeight = 280;
  const chartPadding = 34;

  if (trendData.length === 0) {
    return {
      chartWidth,
      chartHeight,
      chartPadding,
      points: [],
      polylinePoints: '',
      areaPoints: ''
    };
  }

  const denominator = Math.max(trendData.length - 1, 1);
  const drawableWidth = chartWidth - chartPadding * 2;

  const points = trendData.map((point, index) => {
    const x = trendData.length === 1
      ? chartWidth / 2
      : chartPadding + (index / denominator) * drawableWidth;
    const y = chartHeight - chartPadding - (point.efectividad / 100) * (chartHeight - chartPadding * 2);

    return {
      x,
      y,
      label: point.label,
      efectividad: point.efectividad
    };
  });

  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(' ');
  const firstX = points[0]?.x ?? chartPadding;
  const lastX = points[points.length - 1]?.x ?? (chartWidth - chartPadding);
  const baselineY = chartHeight - chartPadding;
  const areaPoints = `${firstX},${baselineY} ${polylinePoints} ${lastX},${baselineY}`;

  return {
    chartWidth,
    chartHeight,
    chartPadding,
    points,
    polylinePoints,
    areaPoints
  };
};

export const buildTrendSummary = (trendData: DashboardTrendPoint[]): DashboardTrendSummary => {
  const promedioEfectividad = trendData.length > 0
    ? Math.round(trendData.reduce((acc, point) => acc + point.efectividad, 0) / trendData.length)
    : 0;

  const mejorMes = trendData.reduce(
    (best, current) => (current.efectividad > best.efectividad ? current : best),
    trendData[0] ?? EMPTY_TREND_POINT
  );

  const ultimoMes = trendData[trendData.length - 1] ?? EMPTY_TREND_POINT;

  return {
    promedioEfectividad,
    mejorMes,
    ultimoMes
  };
};
