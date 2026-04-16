import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Save, FileText, CheckCircle, XCircle, Clock, Calendar, Search, X, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { RevisionLoadingSkeleton } from '@/components/AppSkeletons';
import { Skeleton } from '@/components/ui/skeleton';
import { useRevisionCalidadData } from '../hooks/useRevisionCalidadData';

const RevisionCalidadPage: React.FC = () => {
  const {
    areas,
    eventos,
    selectedEvento,
    setSelectedEvento,
    selectedRevision,
    setSelectedRevision,
    searchTerm,
    setSearchTerm,
    verificacionResults,
    isLoading,
    isSaving,
    comentariosCalidad,
    setComentariosCalidad,
    files,
    setFiles,
    uploading,
    deletingEvidence,
    isAdmin,
    filteredEventos,
    revisionesDelEvento,
    selectedRevisionData,
    selectedArea,
    parametrosRevision,
    completedVerificaciones,
    totalVerificaciones,
    handleDeleteEvidencia,
    handleVerificacionChange,
    handleSaveVerificacion,
    formatDate,
    getEstadoLabel
  } = useRevisionCalidadData();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  if (isLoading) {
    return <RevisionLoadingSkeleton />;
  }

  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="p-4 lg:p-6 space-y-6 min-h-full">
        <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-background border border-border/50 rounded-lg p-4 lg:p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Revisión de Calidad
              </h1>
              <p className="text-muted-foreground mt-2 text-sm lg:text-base">
                Verificación y aprobación de revisiones de parámetros de calidad
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
          <Label className="text-base font-medium mb-3 block">Buscar Eventos</Label>
          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar eventos por nombre o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
                className="pl-10 border-border/50 focus:border-primary/50"
              />
            </div>
            {searchTerm && (
              <Button
                onClick={() => setSearchTerm('')}
                variant="outline"
                className="border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                title="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {searchTerm && (
            <p className="text-sm text-muted-foreground mt-2">
              {filteredEventos.length} evento(s) encontrado(s) de {eventos.length} total
            </p>
          )}
        </div>

        <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
          <Label className="text-base font-medium mb-3 block">Seleccionar Evento</Label>
          <Select
            value={selectedEvento}
            onValueChange={(value) => {
              setSelectedEvento(value);
              setSelectedRevision('');
            }}
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

        {selectedEvento && (
          <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
            <Label className="text-base font-medium mb-3 block">
              Revisiones del Evento ({revisionesDelEvento.length} revisiones)
            </Label>
            <div className="space-y-4">
              <Select value={selectedRevision} onValueChange={setSelectedRevision}>
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
                            <span className="text-xs text-muted-foreground">
                              - {formatDate(revision.fechaRevision)}
                            </span>
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
                        <p className="text-sm mt-1">
                          Verificada el: {formatDate(selectedRevisionData.fechaAprobacion)}
                        </p>
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
        )}

        {selectedRevisionData && (
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
                              onChange={() => handleVerificacionChange(parametro.id, 'verificado')}
                              disabled={selectedRevisionData.estado !== 'pendiente'}
                              className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 disabled:opacity-50"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <input
                              type="radio"
                              name={`verificacion-${parametro.id}`}
                              checked={currentVerificacion?.verificacion === 'pendiente'}
                              onChange={() => handleVerificacionChange(parametro.id, 'pendiente')}
                              disabled={selectedRevisionData.estado !== 'pendiente'}
                              className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500 disabled:opacity-50"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <input
                              type="radio"
                              name={`verificacion-${parametro.id}`}
                              checked={currentVerificacion?.verificacion === 'no_cumple'}
                              onChange={() => handleVerificacionChange(parametro.id, 'no_cumple')}
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
        )}

        {selectedRevisionData?.comentarios && (
          <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
            <Label className="text-sm font-medium mb-2">Comentario del revisor</Label>
            <div className="whitespace-pre-wrap text-sm text-foreground">{selectedRevisionData.comentarios}</div>
          </div>
        )}

        {selectedRevisionData?.comentariosCalidad && (
          <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
            <Label className="text-sm font-medium mb-2">Comentario del verificador</Label>
            <div className="whitespace-pre-wrap text-sm text-foreground">{selectedRevisionData.comentariosCalidad}</div>
          </div>
        )}

        {Array.isArray(selectedRevisionData?.evidencias) && selectedRevisionData.evidencias.length > 0 && (
          <div className="mt-2 bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
            <Label className="text-sm font-medium mb-2 block">Evidencias guardadas</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {selectedRevisionData.evidencias.map((url, index) => (
                <div key={url ?? index} className="relative border border-border/30 rounded overflow-hidden group">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="block" title="Abrir evidencia en una nueva pestaña">
                    <img
                      src={url}
                      alt={`Evidencia ${index + 1}`}
                      className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(ev) => {
                        (ev.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </a>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 flex justify-between">
                    <span>Evidencia {index + 1}</span>
                    <span className="underline">Ver</span>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-white/90 text-red-600 rounded-full p-1 shadow-sm hover:bg-white"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleDeleteEvidencia(url);
                      }}
                      disabled={deletingEvidence === url}
                      title="Eliminar evidencia"
                    >
                      {deletingEvidence === url ? (
                        <Skeleton className="h-3.5 w-3.5 rounded-full" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedRevisionData && (
          <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
            <Label className="text-base font-medium mb-2">Comentario del verificador de calidad</Label>
            <textarea
              value={comentariosCalidad}
              onChange={(e) => setComentariosCalidad(e.target.value)}
              placeholder="Añade aquí comentarios del equipo de calidad (opcional)..."
              className="w-full min-h-[100px] p-3 rounded-md border border-border/30 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
            />

            <Label className="text-sm font-medium mb-2">Evidencias (imágenes) (opcional)</Label>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="border-2 border-dashed border-border/40 rounded-lg p-4 flex items-center gap-4">
                  <div className="w-16 h-16 flex items-center justify-center bg-muted/20 rounded-md">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Arrastra las imágenes aquí o selecciónalas (opcional)</p>
                    <p className="text-xs text-muted-foreground">Formatos: JPG/PNG. Máx 6 archivos, tamaño recomendado 5MB c/u.</p>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 flex flex-col items-end">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const list = e.target.files;
                    if (!list) return;
                    setFiles(Array.from(list).slice(0, 6));
                  }}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md"
                    disabled={uploading}
                  >
                    {uploading ? <Skeleton className="h-4 w-4 rounded-full mr-2" /> : null}
                    <span>{uploading ? 'Subiendo...' : 'Seleccionar archivos'}</span>
                  </Button>
                  <p className="text-xs text-muted-foreground">{files.length} / 6 seleccionados</p>
                </div>
              </div>
            </div>

            {files.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-3">
                {files.map((file, index) => (
                  <div key={index} className="relative border border-border/30 rounded overflow-hidden">
                    <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-28 object-cover" />
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 bg-white/80 text-foreground rounded-full p-1 shadow-sm hover:bg-white"
                      title="Eliminar evidencia"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="p-2 text-xs text-muted-foreground truncate">{file.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedRevisionData && parametrosRevision.length > 0 && (
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
                onClick={handleSaveVerificacion}
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
        )}

        {!selectedEvento && (
          <div className="bg-card rounded-lg border border-border/50 p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Seleccione un Evento</h3>
            <p className="text-muted-foreground">
              Para comenzar la verificación de calidad, seleccione un evento de la lista anterior
            </p>
          </div>
        )}

        {selectedEvento && !selectedRevision && revisionesDelEvento.length === 0 && (
          <div className="bg-card rounded-lg border border-border/50 p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Sin Revisiones</h3>
            <p className="text-muted-foreground">
              No hay revisiones disponibles para este evento
            </p>
          </div>
        )}

        {selectedEvento && !selectedRevision && revisionesDelEvento.length > 0 && (
          <div className="bg-card rounded-lg border border-border/50 p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Seleccione una Revisión</h3>
            <p className="text-muted-foreground">
              Hay {revisionesDelEvento.length} revisiones disponibles para este evento. Seleccione una para verificar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevisionCalidadPage;
