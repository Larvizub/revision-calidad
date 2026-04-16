import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar, CheckCircle } from 'lucide-react';
import type { Area, Evento, Revision } from '@/types';

interface RevisionCalidadRevisionSelectorCardProps {
  selectedRevision: string;
  revisionesDelEvento: Revision[];
  areas: Area[];
  eventos: Evento[];
  selectedEvento: string;
  selectedArea: Area | null | undefined;
  selectedRevisionData?: Revision;
  onRevisionChange: (value: string) => void;
  getEstadoLabel: (estado?: string) => string;
  formatDate: (date: string) => string;
}

const RevisionCalidadRevisionSelectorCard: React.FC<RevisionCalidadRevisionSelectorCardProps> = ({
  selectedRevision,
  revisionesDelEvento,
  areas,
  eventos,
  selectedEvento,
  selectedArea,
  selectedRevisionData,
  onRevisionChange,
  getEstadoLabel,
  formatDate
}) => {
  return (
    <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
      <Label className="text-base font-medium mb-3 block">
        Revisiones del Evento ({revisionesDelEvento.length} revisiones)
      </Label>
      <div className="space-y-4">
        <Select value={selectedRevision} onValueChange={onRevisionChange}>
          <SelectTrigger className="border-border/50 focus:border-primary/50">
            <SelectValue placeholder="Seleccione una revisión..." />
          </SelectTrigger>
          <SelectContent>
            {revisionesDelEvento.length === 0 ? (
              <SelectItem value="no-revisiones" disabled>
                No hay revisiones para este evento
              </SelectItem>
            ) : (
              revisionesDelEvento.map((revision) => {
                const area = areas.find((item) => item.id === revision.idArea);
                const estadoColor = revision.estado === 'pendiente' ? 'text-yellow-600' : 'text-green-600';
                return (
                  <SelectItem key={revision.id} value={revision.id}>
                    <span className="flex items-center gap-2">
                      {area?.nombre || 'Área'}
                      <span className={`text-xs font-medium ${estadoColor}`}>
                        ({getEstadoLabel(revision.estado)})
                      </span>
                      <span className="text-xs text-muted-foreground">- {formatDate(revision.fechaRevision)}</span>
                    </span>
                  </SelectItem>
                );
              })
            )}
          </SelectContent>
        </Select>

        {selectedRevisionData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border">
              <div>
                <p className="text-sm font-medium text-foreground">Evento:</p>
                <p className="text-sm text-muted-foreground">{eventos.find((evento) => evento.id === selectedEvento)?.nombre}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Área:</p>
                <p className="text-sm text-muted-foreground">{selectedArea?.nombre}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Estado:</p>
                <p className={`text-sm font-medium ${selectedRevisionData.estado === 'pendiente' ? 'text-yellow-600' : 'text-green-600'}`}>
                  {getEstadoLabel(selectedRevisionData.estado)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Fecha de Revisión:
                </p>
                <p className="text-sm text-muted-foreground">{formatDate(selectedRevisionData.fechaRevision)}</p>
              </div>
            </div>

            {selectedRevisionData.estado !== 'pendiente' && selectedRevisionData.verificacionCalidad && (
              <div className="p-4 rounded-lg border bg-green-50 border-green-200 text-green-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <p className="font-medium">
                    Revisión ya verificada - Estado: {selectedRevisionData.estado.toUpperCase()}
                  </p>
                </div>
                {selectedRevisionData.fechaAprobacion && (
                  <p className="text-sm mt-1">Verificada el: {formatDate(selectedRevisionData.fechaAprobacion)}</p>
                )}
                {selectedRevisionData.aprobadoPor && (
                  <p className="text-sm">Por: {selectedRevisionData.aprobadoPor}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RevisionCalidadRevisionSelectorCard;
