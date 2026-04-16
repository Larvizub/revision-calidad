import { useCallback, useEffect, useMemo, useState } from 'react';
import { DatabaseService } from '@/services/database';
import { useToast } from '@/hooks/useToast';
import { readExcelFirstSheetRows } from '@/lib/excel';
import type { Evento } from '@/types';
import {
  buildInitialSkillDate,
  dedupeEventosById,
  INITIAL_EVENTO_CONFIRM_DIALOG,
  INITIAL_EVENTO_FORM_DATA,
  normalizeSkillName,
  parseEventosExcelRows
} from '../lib/eventos-utils';
import type {
  EventoFormData,
  EventoImportPayload,
  UseEventosDataResult
} from '../lib/eventos.types';

export const useEventosData = (): UseEventosDataResult => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);
  const [isSkillLoading, setIsSkillLoading] = useState(false);
  const [skillDate, setSkillDate] = useState(buildInitialSkillDate());
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [confirmDialog, setConfirmDialog] = useState(INITIAL_EVENTO_CONFIRM_DIALOG);
  const [formData, setFormData] = useState<EventoFormData>(INITIAL_EVENTO_FORM_DATA);

  const dbService = useMemo(() => new DatabaseService(), []);
  const { showSuccess, showError } = useToast();

  const resetForm = useCallback(() => {
    setFormData(INITIAL_EVENTO_FORM_DATA);
  }, []);

  const loadEventos = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dbService.getEventos();
      setEventos(data);
    } catch (error) {
      console.error('Error loading eventos:', error);
      showError('Error al cargar los eventos: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [dbService, showError]);

  useEffect(() => {
    void loadEventos();
  }, [loadEventos]);

  const handleSearch = useCallback(async () => {
    try {
      if (searchTerm.trim()) {
        const results = await dbService.searchEventos(searchTerm);
        setEventos(results);
      } else {
        await loadEventos();
      }
    } catch (error) {
      console.error('Error searching eventos:', error);
      showError('Error al buscar eventos: ' + (error as Error).message);
    }
  }, [dbService, loadEventos, searchTerm, showError]);

  const handleCreate = useCallback(async () => {
    if (!formData.idEvento || !formData.nombre.trim()) {
      showError('Por favor complete todos los campos');
      return;
    }

    setIsCreating(true);
    try {
      const eventoData = {
        idEvento: parseInt(formData.idEvento, 10),
        nombre: formData.nombre.trim(),
        fechaCreacion: new Date().toISOString(),
        estado: 'activo' as const
      };

      const newEventoId = await dbService.createEvento(eventoData);

      const newEvento: Evento = {
        id: newEventoId,
        ...eventoData
      };

      setEventos((prev) => [...prev, newEvento]);
      setIsDialogOpen(false);
      resetForm();
      showSuccess('Evento creado correctamente');
    } catch (error) {
      console.error('Error creating evento:', error);
      showError('Error al crear el evento: ' + (error as Error).message);
    } finally {
      setIsCreating(false);
    }
  }, [dbService, formData.idEvento, formData.nombre, resetForm, showError, showSuccess]);

  const handleUpdate = useCallback(async () => {
    if (!editingEvento) {
      return;
    }

    if (!formData.idEvento || !formData.nombre.trim()) {
      showError('Por favor complete todos los campos');
      return;
    }

    try {
      const updatedData = {
        idEvento: parseInt(formData.idEvento, 10),
        nombre: formData.nombre.trim()
      };

      await dbService.updateEvento(editingEvento.id, updatedData);

      setEventos((prev) => prev.map((evento) => (
        evento.id === editingEvento.id
          ? { ...evento, ...updatedData }
          : evento
      )));

      setIsDialogOpen(false);
      setEditingEvento(null);
      resetForm();
      showSuccess('Evento actualizado correctamente');
    } catch (error) {
      console.error('Error updating evento:', error);
      showError('Error al actualizar el evento: ' + (error as Error).message);
    }
  }, [dbService, editingEvento, formData.idEvento, formData.nombre, resetForm, showError, showSuccess]);

  const handleDelete = useCallback((id: string, nombre: string) => {
    setConfirmDialog({
      isOpen: true,
      eventoId: id,
      eventoName: nombre
    });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setConfirmDialog(INITIAL_EVENTO_CONFIRM_DIALOG);
  }, []);

  const confirmDelete = useCallback(async () => {
    try {
      await dbService.deleteEvento(confirmDialog.eventoId);
      setEventos((prev) => prev.filter((evento) => evento.id !== confirmDialog.eventoId));
      showSuccess('Evento eliminado correctamente');
      closeDeleteDialog();
    } catch (error) {
      console.error('Error deleting evento:', error);
      showError('Error al eliminar el evento: ' + (error as Error).message);
    }
  }, [closeDeleteDialog, confirmDialog.eventoId, dbService, showError, showSuccess]);

  const handleImportExcel = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const jsonData = await readExcelFirstSheetRows(file, null);

      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        showError('El archivo parece estar vacío o no tiene una hoja válida.');
        return;
      }

      const parsed = parseEventosExcelRows(jsonData);

      if (!parsed.idKey || !parsed.nameKey) {
        const available = parsed.availableHeaders.join(', ');
        showError(`No se encontraron columnas identificables. Columnas detectadas: ${available}. Asegúrese de incluir 'ID Evento' y 'Nombre'.`);
        return;
      }

      if (parsed.rows.length === 0) {
        showError('No se encontraron filas válidas en el archivo. Asegúrese de que exista la columna "ID Evento" y "Nombre" con valores válidos.');
        return;
      }

      const uniqueRows = dedupeEventosById(parsed.rows);

      const existingEventos = await dbService.getEventos();
      const existingIds = new Set(existingEventos.map((evento) => Number(evento.idEvento)));

      const toCreate = uniqueRows.filter((row) => !existingIds.has(row.idEvento));
      const skippedExisting = uniqueRows.length - toCreate.length;

      if (toCreate.length === 0) {
        showError(`Ningún registro para importar; ${skippedExisting} fila(s) tenían ID ya existente.`);
        return;
      }

      const now = new Date().toISOString();
      const eventosToImport: EventoImportPayload[] = toCreate.map((row) => ({
        idEvento: row.idEvento,
        nombre: row.nombre,
        fechaCreacion: now,
        estado: 'activo'
      }));

      await dbService.importEventosFromExcel(eventosToImport);
      await loadEventos();
      showSuccess(`Importados ${eventosToImport.length} eventos. ${skippedExisting} fila(s) omitida(s) por duplicado.`);
    } catch (error) {
      console.error('Error importing Excel:', error);
      showError('Error al importar el archivo Excel');
    } finally {
      event.target.value = '';
    }
  }, [dbService, loadEventos, showError, showSuccess]);

  const handleImportSkill = useCallback(async () => {
    setIsSkillLoading(true);
    try {
      const month = parseInt(skillDate.month, 10);
      const year = parseInt(skillDate.year, 10);

      const skillEvents = await dbService.getSkillEventsFromAPI(month, year);
      if (!skillEvents || skillEvents.length === 0) {
        showError('No se hallaron eventos en Skill para este período.');
        return;
      }

      const currentDB = await dbService.getEventos();

      let created = 0;
      let updated = 0;
      let deleted = 0;
      const processedNames = new Set<string>();

      for (const skillEvent of skillEvents) {
        const skillId = Number(skillEvent.idEvento);
        const skillName = skillEvent.nombre.trim();
        const normName = normalizeSkillName(skillName);

        if (processedNames.has(normName)) {
          continue;
        }
        processedNames.add(normName);

        const matchesInDB = currentDB.filter((evento) => normalizeSkillName(evento.nombre) === normName);

        if (matchesInDB.length > 0) {
          const official = matchesInDB.find((evento) => Number(evento.idEvento) === skillId);

          if (official) {
            for (const match of matchesInDB) {
              if (match.id !== official.id) {
                await dbService.deleteEvento(match.id);
                deleted += 1;
              }
            }
            if (official.nombre !== skillName) {
              await dbService.updateEvento(official.id, { nombre: skillName });
            }
          } else {
            const first = matchesInDB[0];
            await dbService.updateEvento(first.id, { idEvento: skillId, nombre: skillName });
            updated += 1;

            for (let index = 1; index < matchesInDB.length; index += 1) {
              await dbService.deleteEvento(matchesInDB[index].id);
              deleted += 1;
            }
          }
        } else {
          const byId = currentDB.find((evento) => Number(evento.idEvento) === skillId);
          if (byId) {
            await dbService.updateEvento(byId.id, { nombre: skillName });
            updated += 1;
          } else {
            await dbService.createEvento({
              idEvento: skillId,
              nombre: skillName,
              fechaCreacion: new Date().toISOString(),
              estado: 'activo'
            });
            created += 1;
          }
        }
      }

      setSearchTerm('');
      await loadEventos();
      showSuccess(`Limpieza exitosa: ${created} nuevos, ${updated} actualizados, ${deleted} duplicados eliminados.`);
      setIsSkillDialogOpen(false);
    } catch (error) {
      console.error('Error sincronizando Skill:', error);
      showError('Error al conectar con Skill API.');
    } finally {
      setIsSkillLoading(false);
    }
  }, [dbService, loadEventos, showError, showSuccess, skillDate.month, skillDate.year]);

  const openEditDialog = useCallback((evento: Evento) => {
    setEditingEvento(evento);
    setFormData({
      idEvento: evento.idEvento.toString(),
      nombre: evento.nombre
    });
    setIsDialogOpen(true);
  }, []);

  const openCreateDialog = useCallback(() => {
    setEditingEvento(null);
    resetForm();
    setIsDialogOpen(true);
  }, [resetForm]);

  return {
    eventos,
    searchTerm,
    isLoading,
    isCreating,
    isDialogOpen,
    isSkillDialogOpen,
    isSkillLoading,
    skillDate,
    editingEvento,
    confirmDialog,
    formData,
    setSearchTerm,
    setIsDialogOpen,
    setIsSkillDialogOpen,
    setSkillDate,
    setFormData,
    handleSearch,
    handleCreate,
    handleUpdate,
    handleDelete,
    confirmDelete,
    closeDeleteDialog,
    handleImportExcel,
    handleImportSkill,
    openEditDialog,
    openCreateDialog
  };
};
