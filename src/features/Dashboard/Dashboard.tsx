import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatabaseService } from '@/services/database';
import { useToast } from '@/hooks/useToast';
import type { Revision, Usuario, Evento, Area } from '@/types';
import { 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  MapPin,
  FileText,
  Award,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  TrendingUp
} from 'lucide-react';
import { DashboardLoadingSkeleton } from '@/components/AppSkeletons';

// dbService will be created lazily inside the component to ensure recinto is set before instantiation

interface DashboardMetrics {
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
  revisionesRecientes: Revision[];
}

interface CircularChartSegment {
  label: string;
  value: number;
  color: string;
  textClass: string;
}

const buildConicGradient = (segments: CircularChartSegment[]): string => {
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

const Dashboard: React.FC = () => {
  // Crear instancia de DatabaseService cuando el componente se monta (después de que main.tsx haya seteado el recinto)
  const dbService = useMemo(() => new DatabaseService(), []);
  type RecentRevision = Revision & { eventoNombre?: string; areaNombre?: string };
  const { showError } = useToast();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fechaDesde, setFechaDesde] = useState<string | null>(null);
  const [fechaHasta, setFechaHasta] = useState<string | null>(null);
  // Guardar datasets base para recomputar métricas sin re-fetch (usuarios/eventos/áreas cambian menos)
  const [usuariosData, setUsuariosData] = useState<Usuario[]>([]);
  const [eventosData, setEventosData] = useState<Evento[]>([]);
  const [areasData, setAreasData] = useState<Area[]>([]);
  const [revisionesData, setRevisionesData] = useState<Revision[]>([]);
  const computingRef = useRef(false);

  const aplicarFiltrosRevisiones = useCallback((revisiones: Revision[], filtros?: { fechaDesde?: string | null; fechaHasta?: string | null }) => {
    let filtradas = revisiones;
    if (filtros?.fechaDesde) {
      const desde = new Date(filtros.fechaDesde);
      filtradas = filtradas.filter(r => new Date(r.fechaRevision) >= desde);
    }
    if (filtros?.fechaHasta) {
      const hastaDate = new Date(filtros.fechaHasta);
      hastaDate.setHours(23, 59, 59, 999);
      filtradas = filtradas.filter(r => new Date(r.fechaRevision) <= hastaDate);
    }
    return filtradas;
  }, []);

  const computeMetrics = useCallback((
    usuarios: Usuario[],
    eventos: Evento[],
    areas: Area[],
    revisiones: Revision[],
    filtros?: { fechaDesde?: string | null; fechaHasta?: string | null }
  ) => {
    const revisionesFiltradas = aplicarFiltrosRevisiones(revisiones, filtros);

    // Usuarios
    const usuariosMetrics = {
      total: usuarios.length,
      activos: usuarios.filter(u => u.estado === 'activo').length,
      administradores: usuarios.filter(u => u.rol === 'administrador').length,
      calidad: usuarios.filter(u => u.rol === 'calidad').length,
      estandar: usuarios.filter(u => u.rol === 'estandar').length
    };

    // Eventos con revisiones aprobadas en rango (usar fechaAprobacion)
    let eventosAprobadosEnRango = 0;
    try {
      let aprobadas = revisiones.filter(r => r.estado === 'aprobado' && r.fechaAprobacion);
      if (filtros?.fechaDesde) {
        const desde = new Date(filtros.fechaDesde);
        aprobadas = aprobadas.filter(r => new Date(r.fechaAprobacion!) >= desde);
      }
      if (filtros?.fechaHasta) {
        const hastaDate = new Date(filtros.fechaHasta);
        hastaDate.setHours(23, 59, 59, 999);
        aprobadas = aprobadas.filter(r => new Date(r.fechaAprobacion!) <= hastaDate);
      }
      eventosAprobadosEnRango = new Set(aprobadas.map(r => r.idEvento)).size;
    } catch (e) {
      console.debug('Dashboard: error calculando eventos aprobados en rango', e);
    }

    const eventosMetrics = {
      total: eventos.length,
      activos: eventos.filter(e => e.estado === 'activo').length,
      porRevisar: eventos.filter(e => e.estado === 'activo').length, // Placeholder lógica específica
      aprobadosEnRango: eventosAprobadosEnRango
    };

    const areasMetrics = {
      total: areas.length,
      activas: areas.filter(a => a.estado === 'activo').length
    };

    const pendientes = revisionesFiltradas.filter(r => r.estado === 'pendiente').length;
    const aprobadas = revisionesFiltradas.filter(r => r.estado === 'aprobado').length;
    const rechazadas = revisionesFiltradas.filter(r => r.estado === 'rechazado').length;
    const tasaAprobacion = revisionesFiltradas.length > 0
      ? Math.round((aprobadas / revisionesFiltradas.length) * 100)
      : 0;

    const revisionesMetrics = {
      total: revisionesFiltradas.length, // corregido para consistencia con filtros
      pendientes,
      aprobadas,
      rechazadas,
      tasaAprobacion
    };

    const revisionesRecientes = [...revisionesFiltradas]
      .sort((a, b) => new Date(b.fechaRevision).getTime() - new Date(a.fechaRevision).getTime())
      .slice(0, 5)
      .map(r => {
        const eventoObj = eventos.find(e => e.id === r.idEvento);
        const areaObj = areas.find(a => a.id === r.idArea);
        return {
          ...r,
          eventoNombre: eventoObj?.nombre || r.idEvento,
          areaNombre: areaObj?.nombre || r.idArea
        };
      });

  console.debug('Dashboard: computeMetrics - revisionesFiltradas.length=', revisionesFiltradas.length, 'filtros=', filtros);
  setMetrics({
      usuarios: usuariosMetrics,
      eventos: eventosMetrics,
      areas: areasMetrics,
      revisiones: revisionesMetrics,
      revisionesRecientes: revisionesRecientes as Revision[]
    });
  }, [aplicarFiltrosRevisiones]);

  const loadDashboardData = useCallback(async (filtros?: { fechaDesde?: string | null; fechaHasta?: string | null }) => {
  if (computingRef.current) return;
    computingRef.current = true;
    setIsLoading(true);
    try {
      const [usuarios, eventos, areas, revisiones] = await Promise.all([
        dbService.getUsuarios(),
        dbService.getEventos(),
        dbService.getAreas(),
        dbService.getRevisiones()
      ]);
      setUsuariosData(usuarios);
      setEventosData(eventos);
      setAreasData(areas);
      setRevisionesData(revisiones);
      computeMetrics(usuarios, eventos, areas, revisiones, filtros);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showError('Error al cargar datos del dashboard');
    } finally {
      setIsLoading(false);
      computingRef.current = false;
    }
  }, [computeMetrics, showError, dbService]);

  useEffect(() => {
    loadDashboardData({ fechaDesde, fechaHasta });
  }, [loadDashboardData, fechaDesde, fechaHasta]);

  // Recalcular métricas cuando cambien filtros y ya tengamos datasets en memoria
  useEffect(() => {
    if (usuariosData.length || eventosData.length || areasData.length || revisionesData.length) {
      computeMetrics(usuariosData, eventosData, areasData, revisionesData, { fechaDesde, fechaHasta });
    }
  }, [fechaDesde, fechaHasta, usuariosData, eventosData, areasData, revisionesData, computeMetrics]);

  // Suscripción en tiempo real a revisiones
  useEffect(() => {
    const unsubscribe = dbService.onRevisionesChange((rev: Revision[]) => {
      console.debug('Dashboard: onRevisionesChange - received', rev.length, 'revisiones');
      setRevisionesData(rev);
      computeMetrics(usuariosData, eventosData, areasData, rev, { fechaDesde, fechaHasta });
    });
    return () => unsubscribe();
  }, [dbService, usuariosData, eventosData, areasData, computeMetrics, fechaDesde, fechaHasta]);

  // Listener a eventos globales (fallback si otros módulos disparan eventos manualmente)
  useEffect(() => {
    const handler = () => loadDashboardData({ fechaDesde, fechaHasta });
    window.addEventListener('revisiones:changed', handler as EventListener);
    return () => window.removeEventListener('revisiones:changed', handler as EventListener);
  }, [loadDashboardData, fechaDesde, fechaHasta]);

  const estadoRevisionSegments = useMemo<CircularChartSegment[]>(() => [
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
  ], [metrics]);

  const rolesSegments = useMemo<CircularChartSegment[]>(() => [
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
  ], [metrics]);

  const trendData = useMemo(() => {
    const filteredRevisiones = aplicarFiltrosRevisiones(revisionesData, { fechaDesde, fechaHasta });
    const formatter = new Intl.DateTimeFormat('es-ES', { month: 'short', year: '2-digit' });

    const toMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const fromMonthKey = (key: string) => {
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
      const effectiveness = bucket.total > 0 ? Math.round((bucket.aprobadas / bucket.total) * 100) : 0;
      return {
        key,
        label: formatter.format(fromMonthKey(key)).replace('.', ''),
        total: bucket.total,
        aprobadas: bucket.aprobadas,
        efectividad: effectiveness
      };
    });
  }, [aplicarFiltrosRevisiones, revisionesData, fechaDesde, fechaHasta]);

  const trendCoordinates = useMemo(() => {
    const chartWidth = 760;
    const chartHeight = 280;
    const chartPadding = 34;

    if (trendData.length === 0) {
      return {
        chartWidth,
        chartHeight,
        chartPadding,
        points: [] as Array<{ x: number; y: number; label: string; efectividad: number }>,
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

    return { chartWidth, chartHeight, chartPadding, points, polylinePoints, areaPoints };
  }, [trendData]);

  const revisionTotal = metrics?.revisiones.total ?? 0;
  const rolesTotal = metrics?.usuarios.total ?? 0;
  const promedioEfectividad = trendData.length > 0
    ? Math.round(trendData.reduce((acc, point) => acc + point.efectividad, 0) / trendData.length)
    : 0;
  const mejorMes = trendData.reduce(
    (best, current) => (current.efectividad > best.efectividad ? current : best),
    trendData[0] ?? { label: 'Sin datos', efectividad: 0, total: 0, aprobadas: 0, key: 'N/A' }
  );
  const ultimoMes = trendData[trendData.length - 1] ?? { label: 'Sin datos', efectividad: 0, total: 0, aprobadas: 0, key: 'N/A' };

  if (isLoading) {
    return <DashboardLoadingSkeleton />;
  }

  if (!metrics) {
    return (
      <div className="h-full w-full bg-background overflow-auto">
        <div className="p-4 lg:p-6 space-y-6 min-h-full">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">Error al cargar los datos</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="p-4 lg:p-6 space-y-6 min-h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 lg:p-6 border border-border/50">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Dashboard de Control
              </h1>
              <p className="text-muted-foreground mt-2 text-sm lg:text-base">
                Panel de métricas y estadísticas del sistema de revisión de calidad
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-3 text-sm text-muted-foreground w-full">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Actualizado: {new Date().toLocaleString('es-ES')}</span>
                <span className="sm:hidden text-xs">{new Date().toLocaleDateString('es-ES')}</span>
              </div>

              {/* Filtros por rango de fechas - diseño móvil apilado */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <Label className="text-xs">Desde</Label>
                  <Input
                    type="date"
                    value={fechaDesde ?? ''}
                    onChange={e => setFechaDesde(e.target.value || null)}
                    className="w-full sm:w-auto max-w-[160px]"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <Label className="text-xs">Hasta</Label>
                  <Input
                    type="date"
                    value={fechaHasta ?? ''}
                    onChange={e => setFechaHasta(e.target.value || null)}
                    className="w-full sm:w-auto max-w-[160px]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  className="inline-flex items-center justify-center rounded-md border border-border px-3 py-1 text-sm hover:bg-accent/50"
                  onClick={() => loadDashboardData({ fechaDesde, fechaHasta })}
                >
                  Aplicar
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-md px-3 py-1 text-sm text-muted-foreground hover:bg-transparent hover:underline"
                  onClick={() => { setFechaDesde(null); setFechaHasta(null); }}
                >
                  Limpiar
                </button>
              </div>
            </div>
            {/* Debug info removed */}
          </div>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Usuarios */}
          <Card className="border border-border/50 hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios Totales</CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{metrics.usuarios.total}</div>
              <div className="text-xs text-muted-foreground mt-2">
                <span className="text-green-600 font-medium">{metrics.usuarios.activos} activos</span>
                <span className="mx-2">•</span>
                <span>{metrics.usuarios.total - metrics.usuarios.activos} inactivos</span>
              </div>
            </CardContent>
          </Card>

          {/* Eventos */}
          <Card className="border border-border/50 hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Eventos</CardTitle>
              <Calendar className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-purple-600">{metrics.eventos.total}</div>
                <div className="text-xs text-muted-foreground mt-2">
                  <span className="text-green-600 font-medium">{metrics.eventos.activos} activos</span>
                  <span className="mx-2">•</span>
                  <span className="text-muted-foreground">Eventos con revisiones aprobadas en rango: <span className="font-medium">{metrics.eventos.aprobadosEnRango ?? 0}</span></span>
                </div>
            </CardContent>
          </Card>

          {/* Áreas */}
          <Card className="border border-border/50 hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Áreas</CardTitle>
              <MapPin className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{metrics.areas.total}</div>
              <div className="text-xs text-muted-foreground mt-2">
                <span className="text-green-600 font-medium">{metrics.areas.activas} activas</span>
              </div>
            </CardContent>
          </Card>

          {/* Tasa de Aprobación */}
          <Card className="border border-border/50 hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de Aprobación</CardTitle>
              <Award className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{metrics.revisiones.tasaAprobacion}%</div>
              <div className="text-xs text-muted-foreground mt-2">
                De {metrics.revisiones.total} revisiones totales
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos y Estadísticas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Estado de Revisiones */}
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <PieChart className="h-5 w-5" />
                Estado de Revisiones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Aprobadas</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{metrics.revisiones.aprobadas}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium">Pendientes</span>
                  </div>
                  <span className="text-2xl font-bold text-yellow-600">{metrics.revisiones.pendientes}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Rechazadas</span>
                  </div>
                  <span className="text-2xl font-bold text-red-600">{metrics.revisiones.rechazadas}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Distribución de Roles */}
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <BarChart3 className="h-5 w-5" />
                Distribución de Roles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Administradores</span>
                  </div>
                  <span className="text-2xl font-bold text-red-600">{metrics.usuarios.administradores}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Calidad</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{metrics.usuarios.calidad}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Estándar</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{metrics.usuarios.estandar}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos circulares */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <PieChart className="h-5 w-5" />
                Composición Circular de Revisiones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col xl:flex-row items-center gap-6">
                <div className="relative h-52 w-52 shrink-0">
                  <div
                    className="absolute inset-0 rounded-full border border-border/70"
                    style={{ background: buildConicGradient(estadoRevisionSegments) }}
                  />
                  <div className="absolute inset-8 rounded-full bg-card border border-border/60 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-bold text-foreground">{revisionTotal}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Total</span>
                  </div>
                </div>

                <div className="w-full space-y-2">
                  {estadoRevisionSegments.map((segment) => {
                    const percentage = revisionTotal > 0 ? Math.round((segment.value / revisionTotal) * 100) : 0;
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

          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Users className="h-5 w-5" />
                Composición Circular de Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col xl:flex-row items-center gap-6">
                <div className="relative h-52 w-52 shrink-0">
                  <div
                    className="absolute inset-0 rounded-full border border-border/70"
                    style={{ background: buildConicGradient(rolesSegments) }}
                  />
                  <div className="absolute inset-8 rounded-full bg-card border border-border/60 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-bold text-foreground">{rolesTotal}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Usuarios</span>
                  </div>
                </div>

                <div className="w-full space-y-2">
                  {rolesSegments.map((segment) => {
                    const percentage = rolesTotal > 0 ? Math.round((segment.value / rolesTotal) * 100) : 0;
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
        </div>

        {/* Tendencia de efectividad */}
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

        {/* Actividad Reciente */}
        <Card className="border border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Activity className="h-5 w-5" />
              Revisiones Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.revisionesRecientes.length > 0 ? (
              <div className="space-y-3">
                {metrics.revisionesRecientes.map((revision) => (
                  <div key={revision.id} className="flex items-center justify-between p-3 bg-accent/20 rounded-lg border border-border/30">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${
                        revision.estado === 'aprobado' ? 'bg-green-500' :
                        revision.estado === 'rechazado' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">Evento: {(revision as RecentRevision).eventoNombre || revision.idEvento}</p>
                        <p className="text-xs text-muted-foreground">Área: {(revision as RecentRevision).areaNombre || revision.idArea}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {new Date(revision.fechaRevision).toLocaleDateString('es-ES')}
                      </p>
                      <p className={`text-xs font-medium capitalize ${
                        revision.estado === 'aprobado' ? 'text-green-600' :
                        revision.estado === 'rechazado' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {revision.estado}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay revisiones recientes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
