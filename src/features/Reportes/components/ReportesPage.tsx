import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Download,
  Filter,
  FileSpreadsheet,
  Search,
  X,
  Trash2
} from 'lucide-react';
import { AppPageSkeleton, InlineRowsSkeleton } from '@/components/AppSkeletons';
import { Skeleton } from '@/components/ui/skeleton';
import type { FiltrosReporte } from '../lib/reportes.types';
import { useReportesData } from '../hooks/useReportesData';

const ReportesPage: React.FC = () => {
  const {
    filtros,
    setFiltros,
    searchTerm,
    setSearchTerm,
    isLoading,
    isGenerating,
    handleGenerateReport,
    isPreviewLoading,
    previewData,
    paginatedPreviewData,
    previewRangeStart,
    previewRangeEnd,
    totalPreviewRows,
    previewPage,
    setPreviewPage,
    totalPreviewPages,
    filteredEventos,
    formatDate,
    getEventoNombre,
    isAdmin,
    handleDeletePreviewRevision
  } = useReportesData();

  if (isLoading) {
    return <AppPageSkeleton actionCount={2} showSearch={false} rows={8} columns={6} />;
  }

  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="p-4 lg:p-6 space-y-6 min-h-full">
        <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-background border border-border/50 rounded-lg p-4 lg:p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Reportes
              </h1>
              <p className="text-muted-foreground mt-2 text-sm lg:text-base">
                Generación y exportación de reportes en PDF y Excel
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Configuración del Reporte</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Tipo de Reporte</Label>
              <Select
                value={filtros.tipoReporte}
                onValueChange={(value: string) => setFiltros((prev) => ({
                  ...prev,
                  tipoReporte: value as FiltrosReporte['tipoReporte'],
                  idEvento: undefined
                }))}
              >
                <SelectTrigger className="border-border/50 focus:border-primary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revisiones_evento">Revisiones por Evento</SelectItem>
                  <SelectItem value="verificaciones_calidad">Verificaciones de Calidad</SelectItem>
                  <SelectItem value="aprobaciones_pendientes">Aprobaciones Pendientes</SelectItem>
                  <SelectItem value="general">Resumen General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filtros.tipoReporte === 'revisiones_evento' && (
              <div className="md:col-span-2">
                <Label className="text-sm font-medium mb-2 block">Buscar y Seleccionar Evento</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar eventos por nombre o ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-border/50 focus:border-primary/50"
                      />
                    </div>
                    {searchTerm && (
                      <Button
                        onClick={() => setSearchTerm('')}
                        variant="outline"
                        size="sm"
                        className="border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Select
                    value={filtros.idEvento || ''}
                    onValueChange={(value) => setFiltros((prev) => ({ ...prev, idEvento: value }))}
                  >
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
                            <span className="text-xs text-muted-foreground ml-2">
                              (ID: {evento.idEvento})
                            </span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {(filtros.tipoReporte === 'verificaciones_calidad' || filtros.tipoReporte === 'general') && (
              <>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Fecha Desde</Label>
                  <Input
                    type="date"
                    value={filtros.fechaDesde || ''}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, fechaDesde: e.target.value }))}
                    className="border-border/50 focus:border-primary/50"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Fecha Hasta</Label>
                  <Input
                    type="date"
                    value={filtros.fechaHasta || ''}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, fechaHasta: e.target.value }))}
                    className="border-border/50 focus:border-primary/50"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Estado</Label>
                  <Select
                    value={filtros.estado || 'todos'}
                    onValueChange={(value: 'todos' | 'pendiente' | 'aprobado' | 'rechazado') => setFiltros((prev) => ({ ...prev, estado: value }))}
                  >
                    <SelectTrigger className="border-border/50 focus:border-primary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los Estados</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="aprobado">Aprobado</SelectItem>
                      <SelectItem value="rechazado">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
            <div>
              <h3 className="text-lg font-semibold mb-1">Generar Reporte</h3>
              <p className="text-sm text-muted-foreground">
                Exporte los datos en formato PDF o Excel
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => handleGenerateReport('pdf')}
                disabled={isGenerating || (filtros.tipoReporte === 'revisiones_evento' && !filtros.idEvento)}
                className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg font-semibold"
              >
                <FileText className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generando...' : 'Exportar PDF'}
              </Button>
              <Button
                onClick={() => handleGenerateReport('excel')}
                disabled={isGenerating || (filtros.tipoReporte === 'revisiones_evento' && !filtros.idEvento)}
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg font-semibold"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generando...' : 'Exportar Excel'}
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Download className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Vista previa de datos para el reporte</h2>
          </div>

          {isPreviewLoading ? (
            <div className="space-y-3">
              <div className="grid grid-cols-6 gap-3">
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
              </div>
              <InlineRowsSkeleton rows={6} />
            </div>
          ) : previewData && previewData.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Evento</TableHead>
                    <TableHead className="font-semibold">Área</TableHead>
                    <TableHead className="font-semibold">Fecha Revisión</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold">Verificado Por</TableHead>
                    <TableHead className="font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPreviewData.length > 0 ? (
                    paginatedPreviewData.map((rev, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{getEventoNombre(rev)}</TableCell>
                        <TableCell>{(rev.area as { nombre?: string })?.nombre || 'N/A'}</TableCell>
                        <TableCell>{rev.fechaRevision ? formatDate(rev.fechaRevision as string) : 'N/A'}</TableCell>
                        <TableCell>{(rev.estado as string) || 'N/A'}</TableCell>
                        <TableCell>{(rev.aprobadoPor as string) || 'N/A'}</TableCell>
                        <TableCell>
                          {isAdmin ? (
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                onClick={async () => {
                                  const confirmDelete = window.confirm('¿Eliminar esta revisión? Esta acción no se puede deshacer.');
                                  if (!confirmDelete) {
                                    return;
                                  }

                                  await handleDeletePreviewRevision(rev);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6}>No hay datos para mostrar</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando {previewRangeStart}-{previewRangeEnd} de {totalPreviewRows} resultados
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewPage((prev) => Math.max(prev - 1, 1))}
                    disabled={previewPage <= 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    Página {previewPage} de {totalPreviewPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewPage((prev) => Math.min(prev + 1, totalPreviewPages))}
                    disabled={previewPage >= totalPreviewPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 space-y-2">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No hay datos para la vista previa con los filtros seleccionados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportesPage;
