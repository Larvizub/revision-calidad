import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, Clock, FileText, XCircle } from 'lucide-react';
import type { Parametro, Revision } from '@/types';
import type { VerificacionResult } from '../lib/revision-calidad.types';

interface RevisionCalidadParametrosCardProps {
  selectedRevisionData: Revision;
  parametrosRevision: Parametro[];
  verificacionResults: VerificacionResult[];
  onVerificacionChange: (parametroId: string, verificacion: 'verificado' | 'pendiente' | 'no_cumple') => void;
}

const getResultadoDisplay = (resultado: string) => {
  switch (resultado) {
    case 'cumple':
      return (
        <span className="text-green-600 font-medium flex items-center gap-1">
          <CheckCircle className="h-4 w-4" />
          Cumple
        </span>
      );
    case 'no_cumple':
      return (
        <span className="text-red-600 font-medium flex items-center gap-1">
          <XCircle className="h-4 w-4" />
          No Cumple
        </span>
      );
    case 'no_aplica':
      return (
        <span className="text-gray-600 font-medium flex items-center gap-1">
          <Clock className="h-4 w-4" />
          No Aplica
        </span>
      );
    default:
      return <span className="text-muted-foreground">-</span>;
  }
};

const RevisionCalidadParametrosCard: React.FC<RevisionCalidadParametrosCardProps> = ({
  selectedRevisionData,
  parametrosRevision,
  verificacionResults,
  onVerificacionChange
}) => {
  return (
    <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Parámetros para Verificación</h2>
      </div>

      {parametrosRevision.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 space-y-2">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">No hay parámetros disponibles para esta revisión</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="font-semibold text-foreground">Parámetro</TableHead>
                <TableHead className="text-center font-semibold text-foreground w-32">Resultado Original</TableHead>
                <TableHead className="text-center font-semibold text-foreground w-32">Verificado</TableHead>
                <TableHead className="text-center font-semibold text-foreground w-32">Pendiente</TableHead>
                <TableHead className="text-center font-semibold text-foreground w-32">No Cumple</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parametrosRevision.map((parametro) => {
                const resultadoOriginal = selectedRevisionData.resultados[parametro.id];
                const currentVerificacion = verificacionResults.find((item) => item.parametroId === parametro.id);
                return (
                  <TableRow key={parametro.id} className="border-border/30 hover:bg-muted/30">
                    <TableCell className="font-medium">{parametro.nombre}</TableCell>
                    <TableCell className="text-center">{getResultadoDisplay(resultadoOriginal)}</TableCell>
                    <TableCell className="text-center">
                      <input
                        type="radio"
                        name={`verificacion-${parametro.id}`}
                        checked={currentVerificacion?.verificacion === 'verificado'}
                        onChange={() => onVerificacionChange(parametro.id, 'verificado')}
                        disabled={selectedRevisionData.estado !== 'pendiente'}
                        className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 disabled:opacity-50"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <input
                        type="radio"
                        name={`verificacion-${parametro.id}`}
                        checked={currentVerificacion?.verificacion === 'pendiente'}
                        onChange={() => onVerificacionChange(parametro.id, 'pendiente')}
                        disabled={selectedRevisionData.estado !== 'pendiente'}
                        className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500 disabled:opacity-50"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <input
                        type="radio"
                        name={`verificacion-${parametro.id}`}
                        checked={currentVerificacion?.verificacion === 'no_cumple'}
                        onChange={() => onVerificacionChange(parametro.id, 'no_cumple')}
                        disabled={selectedRevisionData.estado !== 'pendiente'}
                        className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500 disabled:opacity-50"
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
  );
};

export default RevisionCalidadParametrosCard;
