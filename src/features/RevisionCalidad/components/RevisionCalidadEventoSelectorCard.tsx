import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Evento } from '@/types';

interface RevisionCalidadEventoSelectorCardProps {
  selectedEvento: string;
  searchTerm: string;
  filteredEventos: Evento[];
  onEventoChange: (value: string) => void;
}

const RevisionCalidadEventoSelectorCard: React.FC<RevisionCalidadEventoSelectorCardProps> = ({
  selectedEvento,
  searchTerm,
  filteredEventos,
  onEventoChange
}) => {
  return (
    <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
      <Label className="text-base font-medium mb-3 block">Seleccionar Evento</Label>
      <Select value={selectedEvento} onValueChange={onEventoChange}>
        <SelectTrigger className="border-border/50 focus:border-primary/50">
          <SelectValue placeholder="Seleccione un evento..." />
        </SelectTrigger>
        <SelectContent>
          {filteredEventos.length === 0 ? (
            <SelectItem value="no-eventos" disabled>
              {searchTerm ? 'No se encontraron eventos' : 'No hay eventos disponibles'}
            </SelectItem>
          ) : (
            filteredEventos.map((evento) => (
              <SelectItem key={evento.id} value={evento.id}>
                {evento.nombre}
                <span className="text-xs text-muted-foreground ml-2">(ID: {evento.idEvento})</span>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RevisionCalidadEventoSelectorCard;
