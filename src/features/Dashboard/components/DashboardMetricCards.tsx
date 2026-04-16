import React from 'react';
import { Award, Calendar, MapPin, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardMetrics } from '../lib/dashboard.types';

interface DashboardMetricCardsProps {
  metrics: DashboardMetrics;
}

const DashboardMetricCards: React.FC<DashboardMetricCardsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <span className="text-muted-foreground">
              Eventos con revisiones aprobadas en rango: <span className="font-medium">{metrics.eventos.aprobadosEnRango ?? 0}</span>
            </span>
          </div>
        </CardContent>
      </Card>

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
  );
};

export default DashboardMetricCards;
