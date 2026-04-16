import React from 'react';
import { Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DashboardHeaderProps {
  fechaDesde: string | null;
  fechaHasta: string | null;
  setFechaDesde: (value: string | null) => void;
  setFechaHasta: (value: string | null) => void;
  onApply: () => void;
  onClear: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  fechaDesde,
  fechaHasta,
  setFechaDesde,
  setFechaHasta,
  onApply,
  onClear
}) => {
  return (
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

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1">
              <Label className="text-xs">Desde</Label>
              <Input
                type="date"
                value={fechaDesde ?? ''}
                onChange={(event) => setFechaDesde(event.target.value || null)}
                className="w-full sm:w-auto max-w-[160px]"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1">
              <Label className="text-xs">Hasta</Label>
              <Input
                type="date"
                value={fechaHasta ?? ''}
                onChange={(event) => setFechaHasta(event.target.value || null)}
                className="w-full sm:w-auto max-w-[160px]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-border px-3 py-1 text-sm hover:bg-accent/50"
              onClick={onApply}
            >
              Aplicar
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md px-3 py-1 text-sm text-muted-foreground hover:bg-transparent hover:underline"
              onClick={onClear}
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
