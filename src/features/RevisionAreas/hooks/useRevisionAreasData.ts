import { useState, useEffect, useCallback, useMemo } from 'react';
import { DatabaseService } from '@/services/database';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import type { Area, Parametro, Evento } from '@/types';
import type { RevisionResult, RevisionOutcome } from '../lib/revision-areas.types';

export const useRevisionAreasData = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedEvento, setSelectedEvento] = useState<string>('');
  const [eventoIdSearch, setEventoIdSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingParametros, setIsLoadingParametros] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [revisionResults, setRevisionResults] = useState<RevisionResult[]>([]);
  const [isSearchingSkill, setIsSearchingSkill] = useState(false);
  const [comentario, setComentario] = useState('');

  const dbService = useMemo(() => new DatabaseService(), []);
  const { showSuccess, showError } = useToast();
  const { user, userProfile } = useAuth();

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [areasData, eventosData] = await Promise.all([
        dbService.getAreas(),
        dbService.getEventos()
      ]);
      setAreas(areasData.filter((area) => area.estado === 'activo'));
      setEventos(eventosData.filter((evento) => evento.estado === 'activo'));
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
        (parametro) => parametro.idArea === areaId && parametro.estado === 'activo'
      );
      setParametros(areaParametros);

      const initialResults = areaParametros.map((parametro) => ({
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

  const handleEventoIdSearch = async () => {
    const searchVal = eventoIdSearch.trim();
    if (!searchVal) return;

    setIsSearchingSkill(true);
    try {
      const existing = eventos.find(
        (evento) => evento.idEvento.toString() === searchVal || evento.id === searchVal
      );

      if (existing) {
        setSelectedEvento(existing.id);
        showSuccess(`Evento encontrado localmente: ${existing.nombre}`);
        setIsSearchingSkill(false);
        return;
      }

      const skillEvent = await dbService.getSkillEventByIdFromAPI(searchVal);

      if (skillEvent) {
        const newEventoData = {
          idEvento: skillEvent.idEvento,
          nombre: skillEvent.nombre,
          fechaCreacion: new Date().toISOString(),
          estado: 'activo' as const
        };

        const newId = await dbService.createEvento(newEventoData);
        const fullNewEvento = { ...newEventoData, id: newId };

        setEventos((prev) => [...prev, fullNewEvento]);
        setSelectedEvento(newId);
        showSuccess(`Evento importado desde Skill: ${skillEvent.nombre}`);
      } else {
        showError('No se encontró el evento en Skill ni localmente');
      }
    } catch (error) {
      console.error('Error searching event in Skill:', error);
      showError('Error al buscar en Skill: ' + (error as Error).message);
    } finally {
      setIsSearchingSkill(false);
    }
  };

  const handleResultChange = (parametroId: string, resultado: Exclude<RevisionOutcome, null>) => {
    setRevisionResults((prev) =>
      prev.map((item) =>
        item.parametroId === parametroId
          ? { ...item, resultado }
          : item
      )
    );
  };

  const resetForm = () => {
    setSelectedArea('');
    setSelectedEvento('');
    setParametros([]);
    setRevisionResults([]);
    setComentario('');
  };

  const handleSaveRevision = async () => {
    if (!selectedArea || !selectedEvento) {
      showError('Por favor seleccione un área y un evento');
      return;
    }

    const unansweredParams = revisionResults.filter((result) => result.resultado === null);
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
          revisionResults.map((result) => [result.parametroId, result.resultado!])
        ),
        estado: 'pendiente' as const,
        comentarios: comentario?.trim() || undefined
      };

      console.debug('RevisionAreas: payload createRevision ->', revisionData);
      await dbService.createRevision(revisionData);

      showSuccess('Revisión guardada correctamente');
      try {
        window.dispatchEvent(new CustomEvent('revisiones:changed'));
      } catch {
        // no-op en entornos que no soporten CustomEvent
      }

      resetForm();
    } catch (error) {
      console.error('Error saving revision:', error);
      showError('Error al guardar la revisión: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const completedParams = revisionResults.filter((result) => result.resultado !== null).length;
  const totalParams = revisionResults.length;
  const progressPercentage = totalParams > 0 ? (completedParams / totalParams) * 100 : 0;

  return {
    areas,
    eventos,
    parametros,
    selectedArea,
    selectedEvento,
    eventoIdSearch,
    isLoading,
    isLoadingParametros,
    isSaving,
    revisionResults,
    isSearchingSkill,
    comentario,
    completedParams,
    totalParams,
    progressPercentage,
    setEventoIdSearch,
    setComentario,
    handleAreaChange,
    handleEventoChange,
    handleEventoIdSearch,
    handleResultChange,
    handleSaveRevision
  };
};
