import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Area, Evento } from '@/types';

interface RevisionAreasSelectorsCardProps {
  areas: Area[];
  eventos: Evento[];
  selectedArea: string;
  selectedEvento: string;
  totalParams: number;
  completedParams: number;
  progressPercentage: number;
  onAreaChange: (areaId: string) => void;
  onEventoChange: (eventoId: string) => void;
}

const RevisionAreasSelectorsCard: React.FC<RevisionAreasSelectorsCardProps> = ({
  areas,
  eventos,
  selectedArea,
  selectedEvento,
  totalParams,
  completedParams,
  progressPercentage,
  onAreaChange,
  onEventoChange
}) => {
  return (
    <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="evento" className="text-base font-medium">Seleccionar Evento</Label>
          <Select value={selectedEvento} onValueChange={onEventoChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccione un evento" />
            </SelectTrigger>
            <SelectContent>
              {eventos.map((evento) => (
                <SelectItem key={evento.id} value={evento.id}>
                  {evento.nombre} (ID: {evento.idEvento})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="area" className="text-base font-medium">Seleccionar Área</Label>
          <Select value={selectedArea} onValueChange={onAreaChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccione un área" />
            </SelectTrigger>
            <SelectContent>
              {areas.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedArea && totalParams > 0 && (
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progreso de evaluación</span>
            <span className="font-medium">{completedParams} de {totalParams} parámetros</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RevisionAreasSelectorsCard;
