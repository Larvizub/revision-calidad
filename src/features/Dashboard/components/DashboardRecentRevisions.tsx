import React from 'react';
import { Activity, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardRecentRevision } from '../lib/dashboard.types';

interface DashboardRecentRevisionsProps {
  revisionesRecientes: DashboardRecentRevision[];
}

const DashboardRecentRevisions: React.FC<DashboardRecentRevisionsProps> = ({ revisionesRecientes }) => {
  return (
    <Card className="border border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Activity className="h-5 w-5" />
          Revisiones Recientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {revisionesRecientes.length > 0 ? (
          <div className="space-y-3">
            {revisionesRecientes.map((revision) => (
              <div key={revision.id} className="flex items-center justify-between p-3 bg-accent/20 rounded-lg border border-border/30">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      revision.estado === 'aprobado'
                        ? 'bg-green-500'
                        : revision.estado === 'rechazado'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium">Evento: {revision.eventoNombre || revision.idEvento}</p>
                    <p className="text-xs text-muted-foreground">Área: {revision.areaNombre || revision.idArea}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {new Date(revision.fechaRevision).toLocaleDateString('es-ES')}
                  </p>
                  <p
                    className={`text-xs font-medium capitalize ${
                      revision.estado === 'aprobado'
                        ? 'text-green-600'
                        : revision.estado === 'rechazado'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                    }`}
                  >
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
  );
};

export default DashboardRecentRevisions;
