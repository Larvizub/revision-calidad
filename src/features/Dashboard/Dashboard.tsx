import React from 'react';
import { DashboardLoadingSkeleton } from '@/components/AppSkeletons';
import DashboardCircularCharts from './components/DashboardCircularCharts';
import DashboardErrorState from './components/DashboardErrorState';
import DashboardHeader from './components/DashboardHeader';
import DashboardMetricCards from './components/DashboardMetricCards';
import DashboardRecentRevisions from './components/DashboardRecentRevisions';
import DashboardStatusRoleCards from './components/DashboardStatusRoleCards';
import DashboardTrendCard from './components/DashboardTrendCard';
import { useDashboardData } from './hooks/useDashboardData';

const Dashboard: React.FC = () => {
  const {
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
    trendCoordinates,
    revisionTotal,
    rolesTotal,
    promedioEfectividad,
    mejorMes,
    ultimoMes
  } = useDashboardData();

  if (isLoading) {
    return <DashboardLoadingSkeleton />;
  }

  if (!metrics) {
    return <DashboardErrorState />;
  }

  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="p-4 lg:p-6 space-y-6 min-h-full">
        <DashboardHeader
          fechaDesde={fechaDesde}
          fechaHasta={fechaHasta}
          setFechaDesde={setFechaDesde}
          setFechaHasta={setFechaHasta}
          onApply={() => {
            void loadDashboardData({ fechaDesde, fechaHasta });
          }}
          onClear={clearFilters}
        />

        <DashboardMetricCards metrics={metrics} />

        <DashboardStatusRoleCards metrics={metrics} />

        <DashboardCircularCharts
          revisionTotal={revisionTotal}
          rolesTotal={rolesTotal}
          estadoRevisionSegments={estadoRevisionSegments}
          rolesSegments={rolesSegments}
        />

        <DashboardTrendCard
          trendCoordinates={trendCoordinates}
          promedioEfectividad={promedioEfectividad}
          mejorMes={mejorMes}
          ultimoMes={ultimoMes}
        />

        <DashboardRecentRevisions revisionesRecientes={metrics.revisionesRecientes} />
      </div>
    </div>
  );
};

export default Dashboard;
