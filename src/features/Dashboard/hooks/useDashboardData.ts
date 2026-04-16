import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DatabaseService } from '@/services/database';
import { useToast } from '@/hooks/useToast';
import type { Area, Evento, Revision, Usuario } from '@/types';
import type {
  CircularChartSegment,
  DashboardFilters,
  DashboardMetrics,
  DashboardTrendCoordinates,
  DashboardTrendPoint
} from '../lib/dashboard.types';
import {
  buildEstadoRevisionSegments,
  buildRolesSegments,
  buildTrendCoordinates,
  buildTrendData,
  buildTrendSummary,
  computeDashboardMetrics
} from '../lib/dashboard-utils';

interface UseDashboardDataResult {
  metrics: DashboardMetrics | null;
  isLoading: boolean;
  fechaDesde: string | null;
  fechaHasta: string | null;
  setFechaDesde: (value: string | null) => void;
  setFechaHasta: (value: string | null) => void;
  clearFilters: () => void;
  loadDashboardData: (filtros?: DashboardFilters) => Promise<void>;
  estadoRevisionSegments: CircularChartSegment[];
  rolesSegments: CircularChartSegment[];
  trendData: DashboardTrendPoint[];
  trendCoordinates: DashboardTrendCoordinates;
  revisionTotal: number;
  rolesTotal: number;
  promedioEfectividad: number;
  mejorMes: DashboardTrendPoint;
  ultimoMes: DashboardTrendPoint;
}

export const useDashboardData = (): UseDashboardDataResult => {
  const dbService = useMemo(() => new DatabaseService(), []);
  const { showError } = useToast();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fechaDesde, setFechaDesde] = useState<string | null>(null);
  const [fechaHasta, setFechaHasta] = useState<string | null>(null);
  const [usuariosData, setUsuariosData] = useState<Usuario[]>([]);
  const [eventosData, setEventosData] = useState<Evento[]>([]);
  const [areasData, setAreasData] = useState<Area[]>([]);
  const [revisionesData, setRevisionesData] = useState<Revision[]>([]);

  const computingRef = useRef(false);

  const updateMetrics = useCallback((
    usuarios: Usuario[],
    eventos: Evento[],
    areas: Area[],
    revisiones: Revision[],
    filtros: DashboardFilters
  ) => {
    const nextMetrics = computeDashboardMetrics(usuarios, eventos, areas, revisiones, filtros);
    console.debug('Dashboard: computeMetrics - revisionesFiltradas.length=', nextMetrics.revisiones.total, 'filtros=', filtros);
    setMetrics(nextMetrics);
  }, []);

  const loadDashboardData = useCallback(async (filtros?: DashboardFilters) => {
    if (computingRef.current) {
      return;
    }

    const activeFilters = filtros ?? { fechaDesde, fechaHasta };

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
      updateMetrics(usuarios, eventos, areas, revisiones, activeFilters);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showError('Error al cargar datos del dashboard');
    } finally {
      setIsLoading(false);
      computingRef.current = false;
    }
  }, [dbService, fechaDesde, fechaHasta, showError, updateMetrics]);

  useEffect(() => {
    void loadDashboardData({ fechaDesde, fechaHasta });
  }, [loadDashboardData, fechaDesde, fechaHasta]);

  useEffect(() => {
    if (usuariosData.length || eventosData.length || areasData.length || revisionesData.length) {
      updateMetrics(usuariosData, eventosData, areasData, revisionesData, { fechaDesde, fechaHasta });
    }
  }, [fechaDesde, fechaHasta, usuariosData, eventosData, areasData, revisionesData, updateMetrics]);

  useEffect(() => {
    const unsubscribe = dbService.onRevisionesChange((revisiones: Revision[]) => {
      console.debug('Dashboard: onRevisionesChange - received', revisiones.length, 'revisiones');
      setRevisionesData(revisiones);
      updateMetrics(usuariosData, eventosData, areasData, revisiones, { fechaDesde, fechaHasta });
    });

    return () => unsubscribe();
  }, [dbService, usuariosData, eventosData, areasData, fechaDesde, fechaHasta, updateMetrics]);

  useEffect(() => {
    const handler = () => {
      void loadDashboardData({ fechaDesde, fechaHasta });
    };

    window.addEventListener('revisiones:changed', handler as EventListener);
    return () => window.removeEventListener('revisiones:changed', handler as EventListener);
  }, [loadDashboardData, fechaDesde, fechaHasta]);

  const estadoRevisionSegments = useMemo(
    () => buildEstadoRevisionSegments(metrics),
    [metrics]
  );

  const rolesSegments = useMemo(
    () => buildRolesSegments(metrics),
    [metrics]
  );

  const trendData = useMemo(
    () => buildTrendData(revisionesData, { fechaDesde, fechaHasta }),
    [revisionesData, fechaDesde, fechaHasta]
  );

  const trendCoordinates = useMemo(
    () => buildTrendCoordinates(trendData),
    [trendData]
  );

  const { promedioEfectividad, mejorMes, ultimoMes } = useMemo(
    () => buildTrendSummary(trendData),
    [trendData]
  );

  const clearFilters = useCallback(() => {
    setFechaDesde(null);
    setFechaHasta(null);
  }, []);

  return {
    metrics,
    isLoading,
    fechaDesde,
    fechaHasta,
    setFechaDesde,
    setFechaHasta,
    clearFilters,
    loadDashboardData,
    estadoRevisionSegments,
    rolesSegments,
    trendData,
    trendCoordinates,
    revisionTotal: metrics?.revisiones.total ?? 0,
    rolesTotal: metrics?.usuarios.total ?? 0,
    promedioEfectividad,
    mejorMes,
    ultimoMes
  };
};
