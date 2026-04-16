import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DatabaseService } from '@/services/database';
import { storage } from '@/services/firebase';
import { useToast } from '@/hooks/useToast';
import type { Revision, Area, Parametro, Evento } from '@/types';
import type { VerificacionResult, VerificacionOutcome } from '../lib/revision-calidad.types';

export const useRevisionCalidadData = () => {
  const [revisiones, setRevisiones] = useState<Revision[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [selectedEvento, setSelectedEvento] = useState<string>('');
  const [selectedRevision, setSelectedRevision] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [verificacionResults, setVerificacionResults] = useState<VerificacionResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [comentariosCalidad, setComentariosCalidad] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingEvidence, setDeletingEvidence] = useState<string | null>(null);

  const { showSuccess, showError } = useToast();
  const dbService = useMemo(() => new DatabaseService(), []);
  const { userProfile, user } = useAuth();
  const isAdmin = userProfile?.role === 'administrador';

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [revisionesData, areasData, eventosData, parametrosData] = await Promise.all([
        dbService.getRevisiones(),
        dbService.getAreas(),
        dbService.getEventos(),
        dbService.getParametros()
      ]);

      setRevisiones(revisionesData);
      setAreas(areasData);
      setEventos(eventosData);
      setParametros(parametrosData);
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Error al cargar los datos: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [showError, dbService]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const revisionesDelEvento = useMemo(
    () => (selectedEvento ? revisiones.filter((revision) => revision.idEvento === selectedEvento) : []),
    [selectedEvento, revisiones]
  );

  const filteredEventos = useMemo(
    () =>
      searchTerm
        ? eventos.filter(
            (evento) =>
              evento.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
              evento.idEvento.toString().includes(searchTerm)
          )
        : eventos,
    [eventos, searchTerm]
  );

  useEffect(() => {
    if (selectedEvento && searchTerm && !filteredEventos.find((evento) => evento.id === selectedEvento)) {
      setSelectedEvento('');
      setSelectedRevision('');
    }
  }, [selectedEvento, searchTerm, filteredEventos]);

  const selectedRevisionData = revisionesDelEvento.find((revision) => revision.id === selectedRevision);
  const selectedArea = selectedRevisionData ? areas.find((area) => area.id === selectedRevisionData.idArea) : null;

  const parametrosRevision = useMemo(
    () => (selectedRevisionData ? parametros.filter((parametro) => parametro.idArea === selectedRevisionData.idArea) : []),
    [selectedRevisionData, parametros]
  );

  const handleDeleteEvidencia = async (evidenceUrl: string) => {
    if (!selectedRevisionData) {
      showError('Seleccione una revisión para gestionar evidencias');
      return;
    }
    if (!isAdmin) {
      showError('Solo un administrador puede eliminar evidencias');
      return;
    }

    setDeletingEvidence(evidenceUrl);
    try {
      const storageMod = await import('firebase/storage');
      const storageRef = storageMod.ref(storage, evidenceUrl);
      await storageMod.deleteObject(storageRef);

      const remaining = (selectedRevisionData.evidencias || []).filter((url) => url !== evidenceUrl);
      await dbService.updateRevision(selectedRevisionData.id, {
        evidencias: remaining.length ? remaining : []
      });

      setRevisiones((prev) =>
        prev.map((revision) =>
          revision.id === selectedRevisionData.id
            ? { ...revision, evidencias: remaining }
            : revision
        )
      );

      showSuccess('Evidencia eliminada correctamente.');
    } catch (error) {
      console.error('Error deleting evidence:', error);
      showError('No se pudo eliminar la evidencia. Intente nuevamente.');
    } finally {
      setDeletingEvidence(null);
    }
  };

  useEffect(() => {
    const unsubscribe = dbService.onRevisionesChange((updatedRevisiones) => {
      setRevisiones(updatedRevisiones);

      if (selectedRevision) {
        const updated = updatedRevisiones.find((revision) => revision.id === selectedRevision);
        if (updated && updated.verificacionCalidad) {
          const verificacionCalidad = updated.verificacionCalidad as Record<string, unknown>;
          const newVerificacionResults = parametros
            .filter((parametro) => parametro.idArea === updated.idArea)
            .map((parametro) => {
              const raw = verificacionCalidad[parametro.id];
              const verificacion =
                raw === 'verificado' || raw === 'pendiente' || raw === 'no_cumple'
                  ? (raw as 'verificado' | 'pendiente' | 'no_cumple')
                  : null;
              return { parametroId: parametro.id, verificacion };
            });
          setVerificacionResults(newVerificacionResults);
        }
      }
    });

    return () => unsubscribe();
  }, [dbService, parametros, selectedRevision]);

  useEffect(() => {
    const handler = () => {
      loadData();
    };
    window.addEventListener('revisiones:changed', handler as EventListener);
    return () => window.removeEventListener('revisiones:changed', handler as EventListener);
  }, [loadData]);

  useEffect(() => {
    if (selectedRevisionData && parametrosRevision.length > 0) {
      const existingVerificacion = selectedRevisionData.verificacionCalidad || {};
      const newVerificacionResults = parametrosRevision.map((parametro) => ({
        parametroId: parametro.id,
        verificacion: existingVerificacion[parametro.id] || null
      }));
      setVerificacionResults(newVerificacionResults);
    } else {
      setVerificacionResults([]);
    }
  }, [selectedRevisionData, parametrosRevision]);

  const handleVerificacionChange = (parametroId: string, verificacion: Exclude<VerificacionOutcome, null>) => {
    setVerificacionResults((prev) =>
      prev.map((result) =>
        result.parametroId === parametroId
          ? { ...result, verificacion }
          : result
      )
    );
  };

  const handleSaveVerificacion = async () => {
    if (!selectedRevisionData) {
      showError('Por favor seleccione una revisión');
      return;
    }

    const unansweredVerificaciones = verificacionResults.filter((result) => result.verificacion === null);
    if (unansweredVerificaciones.length > 0) {
      showError(`Faltan por verificar ${unansweredVerificaciones.length} parámetro(s)`);
      return;
    }

    setIsSaving(true);
    try {
      const verificacionCalidad = Object.fromEntries(
        verificacionResults.map((result) => [result.parametroId, result.verificacion!])
      );

      const verificaciones = verificacionResults.map((result) => result.verificacion);
      const tienePendiente = verificaciones.includes('pendiente');
      const nuevoEstado: 'aprobado' | 'pendiente' = tienePendiente ? 'pendiente' : 'aprobado';

      let evidenciaUrls: string[] | undefined;
      if (files.length > 0) {
        setUploading(true);
        try {
          const uploadPromises = files.map(async (file, index) => {
            const path = `evidencias/${selectedRevisionData.id}/${Date.now()}-${index}-${file.name}`;
            const storageRef = await import('firebase/storage').then((mod) => mod.ref(storage, path));
            await import('firebase/storage').then((mod) => mod.uploadBytes(storageRef, file));
            const url = await import('firebase/storage').then((mod) => mod.getDownloadURL(storageRef));
            return url;
          });
          evidenciaUrls = await Promise.all(uploadPromises);
        } catch (uploadError) {
          console.error('Error subiendo evidencias:', uploadError);
          showError('Error al subir evidencias. Intente nuevamente.');
          setUploading(false);
          setIsSaving(false);
          return;
        } finally {
          setUploading(false);
        }
      }

      const uid = userProfile?.uid || user?.uid;
      let aprobadoPorNombre = userProfile?.firstName
        ? `${userProfile.firstName}${userProfile.lastName ? ' ' + userProfile.lastName : ''}`
        : userProfile?.displayName || userProfile?.email || 'Usuario';

      if (uid) {
        try {
          const dbUser = await dbService.getUserByUid(uid);
          if (dbUser && dbUser.nombre) {
            aprobadoPorNombre = dbUser.nombre;
          }
        } catch {
          // ignore fallback
        }
      }

      await dbService.updateRevision(selectedRevisionData.id, {
        verificacionCalidad,
        estado: nuevoEstado,
        fechaAprobacion: new Date().toISOString(),
        aprobadoPor: aprobadoPorNombre,
        aprobadoPorUid: uid || undefined,
        comentariosCalidad: comentariosCalidad?.trim() || undefined,
        evidencias: evidenciaUrls && evidenciaUrls.length ? evidenciaUrls : undefined
      });

      console.debug('RevisionCalidad: payload updateRevision ->', {
        verificacionCalidad,
        estado: nuevoEstado,
        aprobadoPor: aprobadoPorNombre,
        aprobadoPorUid: uid || undefined,
        comentariosCalidad: comentariosCalidad?.trim() || undefined,
        evidencias: evidenciaUrls && evidenciaUrls.length ? evidenciaUrls : undefined
      });

      const estadoMensaje = nuevoEstado === 'aprobado' ? 'revisada' : 'marcada como pendiente';
      showSuccess(`Verificación de calidad guardada correctamente. Revisión ${estadoMensaje}.`);

      try {
        const updated = await dbService.getRevisionById(selectedRevisionData.id);
        if (updated) {
          setRevisiones((prev) => prev.map((revision) => (revision.id === updated.id ? updated : revision)));
          setVerificacionResults(
            parametrosRevision.map((parametro) => ({
              parametroId: parametro.id,
              verificacion:
                updated.verificacionCalidad && (updated.verificacionCalidad as Record<string, string>)[parametro.id]
                  ? ((updated.verificacionCalidad as Record<string, string>)[parametro.id] as 'verificado' | 'pendiente' | 'no_cumple')
                  : null
            }))
          );
        } else {
          await loadData();
        }
      } catch {
        await loadData();
      }

      setComentariosCalidad('');
      setFiles([]);
    } catch (error) {
      console.error('Error saving verification:', error);
      showError('Error al guardar la verificación: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const completedVerificaciones = verificacionResults.filter((result) => result.verificacion !== null).length;
  const totalVerificaciones = verificacionResults.length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoLabel = (estado?: string) => {
    if (!estado) return '';
    if (estado === 'pendiente') return 'PENDIENTE';
    if (estado === 'aprobado') return 'REVISADO';
    return estado.toUpperCase();
  };

  return {
    revisiones,
    areas,
    eventos,
    parametros,
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
  };
};
