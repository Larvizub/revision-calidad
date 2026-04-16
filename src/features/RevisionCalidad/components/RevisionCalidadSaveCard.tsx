import React from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import type { Revision } from '@/types';

interface RevisionCalidadSaveCardProps {
  selectedRevisionData: Revision;
  completedVerificaciones: number;
  totalVerificaciones: number;
  isSaving: boolean;
  onSave: () => Promise<void>;
}

const RevisionCalidadSaveCard: React.FC<RevisionCalidadSaveCardProps> = ({
  selectedRevisionData,
  completedVerificaciones,
  totalVerificaciones,
  isSaving,
  onSave
}) => {
  return (
    <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
        <div className="text-center sm:text-left">
          <p className="text-sm text-muted-foreground">
            Progreso: {completedVerificaciones} de {totalVerificaciones} parámetros verificados
          </p>
          {completedVerificaciones === totalVerificaciones && totalVerificaciones > 0 && (
            <p className="text-sm text-green-600 font-medium mt-1">
              ✓ Todos los parámetros han sido verificados
            </p>
          )}
          {selectedRevisionData.estado !== 'pendiente' && (
            <p className="text-sm text-orange-600 font-medium mt-1">
              ⚠️ Esta revisión ya ha sido verificada
            </p>
          )}
        </div>
        <Button
          onClick={onSave}
          disabled={
            isSaving ||
            totalVerificaciones === 0 ||
            completedVerificaciones !== totalVerificaciones ||
            selectedRevisionData.estado !== 'pendiente'
          }
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg font-semibold w-full sm:w-auto disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving
            ? 'Guardando...'
            : selectedRevisionData.estado !== 'pendiente'
              ? 'Ya Verificada'
              : 'Guardar Verificación'}
        </Button>
      </div>
    </div>
  );
};

export default RevisionCalidadSaveCard;
