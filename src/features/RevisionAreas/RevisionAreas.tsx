import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DatabaseService } from '@/services/database';
import { useToast } from '@/hooks/useToast';
import type { Area, Parametro, Evento } from '@/types';
import { Loader2, Save, FileText, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

interface RevisionResult {
  parametroId: string;
  resultado: 'cumple' | 'no_cumple' | 'no_aplica' | null;
}

const RevisionAreas: React.FC = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedEvento, setSelectedEvento] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingParametros, setIsLoadingParametros] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [revisionResults, setRevisionResults] = useState<RevisionResult[]>([]);

  const dbService = useMemo(() => new DatabaseService(), []);
  const { showSuccess, showError } = useToast();
  const { user, userProfile } = useAuth();
  const [comentario, setComentario] = useState('');

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [areasData, eventosData] = await Promise.all([
        dbService.getAreas(),
        dbService.getEventos()
      ]);
      setAreas(areasData.filter(area => area.estado === 'activo'));
      setEventos(eventosData.filter(evento => evento.estado === 'activo'));
    } catch (error) {
      console.error('Error loading initial data:', error);
      showError('Error al cargar los datos iniciales: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [dbService, showError]);

  const loadParametros = useCallback(async (areaId: string) => {
    if (!areaId) {
      setParametros([]);
      return;
    }
    
    setIsLoadingParametros(true);
    try {
      const allParametros = await dbService.getParametros();
      const areaParametros = allParametros.filter(
        parametro => parametro.idArea === areaId && parametro.estado === 'activo'
      );
      setParametros(areaParametros);
      
      // Inicializar resultados de revisión
      const initialResults = areaParametros.map(parametro => ({
        parametroId: parametro.id,
        resultado: null as RevisionResult['resultado']
      }));
      setRevisionResults(initialResults);
      
    } catch (error) {
      console.error('Error loading parametros:', error);
      showError('Error al cargar los parámetros: ' + (error as Error).message);
    } finally {
      setIsLoadingParametros(false);
    }
  }, [dbService, showError]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (selectedArea) {
      loadParametros(selectedArea);
    } else {
      setParametros([]);
      setRevisionResults([]);
    }
  }, [selectedArea, loadParametros]);

  const handleAreaChange = (areaId: string) => {
    setSelectedArea(areaId);
    setRevisionResults([]);
  };

  const handleEventoChange = (eventoId: string) => {
    setSelectedEvento(eventoId);
  };

  const handleResultChange = (parametroId: string, resultado: 'cumple' | 'no_cumple' | 'no_aplica') => {
    setRevisionResults(prev => 
      prev.map(item => 
        item.parametroId === parametroId 
          ? { ...item, resultado }
          : item
      )
    );
  };

  const handleSaveRevision = async () => {
    if (!selectedArea || !selectedEvento) {
      showError('Por favor seleccione un área y un evento');
      return;
    }

    const unansweredParams = revisionResults.filter(result => result.resultado === null);
    if (unansweredParams.length > 0) {
      showError(`Faltan por evaluar ${unansweredParams.length} parámetro(s)`);
      return;
    }

    setIsSaving(true);
    try {
      const revisionData = {
        idEvento: selectedEvento,
        idArea: selectedArea,
  idUsuario: user?.uid || userProfile?.uid || 'unknown-user',
        fechaRevision: new Date().toISOString(),
        resultados: Object.fromEntries(
          revisionResults.map(result => [result.parametroId, result.resultado!])
        ),
  estado: 'pendiente' as const,
  comentarios: comentario?.trim() || undefined,
      };
      
  console.debug('RevisionAreas: payload createRevision ->', revisionData);
  await dbService.createRevision(revisionData);
      
      showSuccess('Revisión guardada correctamente');
      // Notificar a otras partes de la app que las revisiones cambiaron
      try {
        window.dispatchEvent(new CustomEvent('revisiones:changed'));
      } catch {
        // no-op en entornos que no soporten CustomEvent
      }
      
      // Limpiar formulario
      setSelectedArea('');
      setSelectedEvento('');
      setParametros([]);
      setRevisionResults([]);
  setComentario('');
      
    } catch (error) {
      console.error('Error saving revision:', error);
      showError('Error al guardar la revisión: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  // Filtrado de eventos basado en la búsqueda
  const filteredEventos = useMemo(() => {
    if (!searchTerm.trim()) return eventos;
    return eventos.filter(evento =>
      evento.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evento.idEvento.toString().includes(searchTerm)
    );
  }, [eventos, searchTerm]);

  const completedParams = revisionResults.filter(result => result.resultado !== null).length;
  const totalParams = revisionResults.length;
  const progressPercentage = totalParams > 0 ? (completedParams / totalParams) * 100 : 0;

  if (isLoading) {
    return (
      <div className="h-full w-full bg-background overflow-auto">
        <div className="p-4 lg:p-6 space-y-6 min-h-full">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Cargando datos...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="p-4 lg:p-6 space-y-6 min-h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 lg:p-6 border border-border/50">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Revisión de Áreas
              </h1>
              <p className="text-muted-foreground mt-2 text-sm lg:text-base">
                Evalúa el cumplimiento de parámetros de calidad por área en eventos específicos
              </p>
            </div>
          </div>
        </div>

        {/* Búsqueda de Eventos */}
        <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
          <Label className="text-base font-medium mb-3 block">Buscar Eventos</Label>
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

        {/* Selección de Evento y Área */}
        <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="evento" className="text-base font-medium">Seleccionar Evento</Label>
              <Select value={selectedEvento} onValueChange={handleEventoChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione un evento" />
                </SelectTrigger>
                <SelectContent>
                  {filteredEventos.map((evento) => (
                    <SelectItem key={evento.id} value={evento.id}>
                      {evento.nombre} (ID: {evento.idEvento})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="area" className="text-base font-medium">Seleccionar Área</Label>
              <Select value={selectedArea} onValueChange={handleAreaChange}>
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
          
          {/* Barra de Progreso */}
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

        {/* Tabla de Parámetros */}
        {selectedArea && (
          <div className="bg-card rounded-lg border border-border/50 shadow-sm overflow-hidden">
            {isLoadingParametros ? (
              <div className="flex items-center justify-center h-32">
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Cargando parámetros...</p>
                </div>
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
                      const currentResult = revisionResults.find(r => r.parametroId === parametro.id);
                      return (
                        <TableRow key={parametro.id} className="border-border/30 hover:bg-muted/30">
                          <TableCell className="font-medium">{parametro.nombre}</TableCell>
                          <TableCell className="text-center">
                            <input
                              type="radio"
                              name={`parametro-${parametro.id}`}
                              checked={currentResult?.resultado === 'cumple'}
                              onChange={() => handleResultChange(parametro.id, 'cumple')}
                              className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <input
                              type="radio"
                              name={`parametro-${parametro.id}`}
                              checked={currentResult?.resultado === 'no_cumple'}
                              onChange={() => handleResultChange(parametro.id, 'no_cumple')}
                              className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <input
                              type="radio"
                              name={`parametro-${parametro.id}`}
                              checked={currentResult?.resultado === 'no_aplica'}
                              onChange={() => handleResultChange(parametro.id, 'no_aplica')}
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

          {/* Campo de comentario del revisor */}
          {selectedArea && parametros.length > 0 && (
            <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
              <Label className="text-base font-medium mb-2">Comentario del revisor</Label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Añade aquí comentarios generales sobre la revisión (opcional)..."
                className="w-full min-h-[80px] p-3 rounded-md border border-border/30 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}

        {/* Botón de Guardar Revisión */}
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
                onClick={handleSaveRevision}
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
      </div>
    </div>
  );
};

export default RevisionAreas;
