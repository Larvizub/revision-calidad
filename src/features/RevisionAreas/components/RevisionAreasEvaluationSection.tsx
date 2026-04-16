import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Save, FileText } from 'lucide-react';
import type { Parametro } from '@/types';
import type { RevisionResult } from '../lib/revision-areas.types';
import { InlineRowsSkeleton } from '@/components/AppSkeletons';

interface RevisionAreasEvaluationSectionProps {
  selectedArea: string;
  selectedEvento: string;
  parametros: Parametro[];
  revisionResults: RevisionResult[];
  comentario: string;
  isLoadingParametros: boolean;
  isSaving: boolean;
  completedParams: number;
  totalParams: number;
  onComentarioChange: (value: string) => void;
  onResultChange: (parametroId: string, resultado: 'cumple' | 'no_cumple' | 'no_aplica') => void;
  onSaveRevision: () => Promise<void>;
}

const RevisionAreasEvaluationSection: React.FC<RevisionAreasEvaluationSectionProps> = ({
  selectedArea,
  selectedEvento,
  parametros,
  revisionResults,
  comentario,
  isLoadingParametros,
  isSaving,
  completedParams,
  totalParams,
  onComentarioChange,
  onResultChange,
  onSaveRevision
}) => {
  return (
    <>
      {selectedArea && (
        <div className="bg-card rounded-lg border border-border/50 shadow-sm overflow-hidden">
          {isLoadingParametros ? (
            <div className="p-4">
              <InlineRowsSkeleton rows={6} />
            </div>
          ) : parametros.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 space-y-2">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No hay parámetros disponibles para esta área</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="font-semibold text-foreground">Parámetro</TableHead>
                    <TableHead className="text-center font-semibold text-foreground w-32">Cumple</TableHead>
                    <TableHead className="text-center font-semibold text-foreground w-32">No Cumple</TableHead>
                    <TableHead className="text-center font-semibold text-foreground w-32">No Aplica</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parametros.map((parametro) => {
                    const currentResult = revisionResults.find((result) => result.parametroId === parametro.id);
                    return (
                      <TableRow key={parametro.id} className="border-border/30 hover:bg-muted/30">
                        <TableCell className="font-medium">{parametro.nombre}</TableCell>
                        <TableCell className="text-center">
                          <input
                            type="radio"
                            name={`parametro-${parametro.id}`}
                            checked={currentResult?.resultado === 'cumple'}
                            onChange={() => onResultChange(parametro.id, 'cumple')}
                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <input
                            type="radio"
                            name={`parametro-${parametro.id}`}
                            checked={currentResult?.resultado === 'no_cumple'}
                            onChange={() => onResultChange(parametro.id, 'no_cumple')}
                            className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <input
                            type="radio"
                            name={`parametro-${parametro.id}`}
                            checked={currentResult?.resultado === 'no_aplica'}
                            onChange={() => onResultChange(parametro.id, 'no_aplica')}
                            className="w-4 h-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {selectedArea && parametros.length > 0 && (
        <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
          <label className="text-base font-medium mb-2 block">Comentario del revisor</label>
          <textarea
            value={comentario}
            onChange={(e) => onComentarioChange(e.target.value)}
            placeholder="Añade aquí comentarios generales sobre la revisión (opcional)..."
            className="w-full min-h-[80px] p-3 rounded-md border border-border/30 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      )}

      {selectedArea && selectedEvento && parametros.length > 0 && (
        <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
            <div className="text-center sm:text-left">
              <p className="text-sm text-muted-foreground">
                Progreso: {completedParams} de {totalParams} parámetros completados
              </p>
              {completedParams === totalParams && totalParams > 0 && (
                <p className="text-sm text-green-600 font-medium mt-1">
                  ✓ Todos los parámetros han sido evaluados
                </p>
              )}
            </div>
            <Button
              onClick={onSaveRevision}
              disabled={isSaving || totalParams === 0 || completedParams !== totalParams}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg font-semibold w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar Revisión'}
            </Button>
          </div>
        </div>
      )}

      {!selectedArea && (
        <div className="bg-card rounded-lg border border-border/50 p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Seleccione un Área</h3>
          <p className="text-muted-foreground">
            Para comenzar la revisión, seleccione un evento y un área de la lista anterior
          </p>
        </div>
      )}
    </>
  );
};

export default RevisionAreasEvaluationSection;
