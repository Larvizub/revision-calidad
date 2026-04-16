import React from 'react';
import { Award, BarChart3, CheckCircle, Clock, PieChart, Users, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardMetrics } from '../lib/dashboard.types';

interface DashboardStatusRoleCardsProps {
  metrics: DashboardMetrics;
}

const DashboardStatusRoleCards: React.FC<DashboardStatusRoleCardsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
  );
};

export default DashboardStatusRoleCards;
