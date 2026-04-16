import { useCallback, useEffect, useMemo, useState } from 'react';
import { DatabaseService } from '@/services/database';
import { useToast } from '@/hooks/useToast';
import { readExcelFirstSheetRows } from '@/lib/excel';
import type { Area } from '@/types';
import {
  buildAreasImportPayload,
  INITIAL_AREA_CONFIRM_DIALOG,
  INITIAL_AREA_FORM_DATA
} from '../lib/areas-utils';
import type { AreaFormData, UseAreasDataResult } from '../lib/areas.types';

export const useAreasData = (): UseAreasDataResult => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [confirmDialog, setConfirmDialog] = useState(INITIAL_AREA_CONFIRM_DIALOG);
  const [formData, setFormData] = useState<AreaFormData>(INITIAL_AREA_FORM_DATA);

  const dbService = useMemo(() => new DatabaseService(), []);
  const { showSuccess, showError } = useToast();

  const resetForm = useCallback(() => {
    setFormData(INITIAL_AREA_FORM_DATA);
  }, []);

  const loadAreas = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dbService.getAreas();
      setAreas(data);
    } catch (error) {
      console.error('Error loading areas:', error);
      showError('Error al cargar las áreas: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [dbService, showError]);

  useEffect(() => {
    void loadAreas();
  }, [loadAreas]);

  const handleSearch = useCallback(async () => {
    try {
      if (searchTerm.trim()) {
        const results = await dbService.searchAreas(searchTerm);
        setAreas(results);
      } else {
        await loadAreas();
      }
    } catch (error) {
      console.error('Error searching areas:', error);
      showError('Error al buscar áreas: ' + (error as Error).message);
    }
  }, [dbService, loadAreas, searchTerm, showError]);

  const handleCreate = useCallback(async () => {
    if (!formData.nombre.trim()) {
      showError('Por favor ingrese un nombre para el área');
      return;
    }

    setIsCreating(true);
    try {
      const areaData = {
        nombre: formData.nombre.trim(),
        estado: 'activo' as const
      };

      const newAreaId = await dbService.createArea(areaData);

      const newArea: Area = {
        id: newAreaId,
        ...areaData
      };

      setAreas((prev) => [...prev, newArea]);
      setIsDialogOpen(false);
      resetForm();
      showSuccess('Área creada correctamente');
    } catch (error) {
      console.error('Error creating area:', error);
      showError('Error al crear el área: ' + (error as Error).message);
    } finally {
      setIsCreating(false);
    }
  }, [dbService, formData.nombre, resetForm, showError, showSuccess]);

  const handleUpdate = useCallback(async () => {
    if (!editingArea) {
      return;
    }

    if (!formData.nombre.trim()) {
      showError('Por favor ingrese un nombre para el área');
      return;
    }

    try {
      await dbService.updateArea(editingArea.id, {
        nombre: formData.nombre.trim()
      });

      setAreas((prev) => prev.map((area) => (
        area.id === editingArea.id
          ? { ...area, nombre: formData.nombre.trim() }
          : area
      )));

      setIsDialogOpen(false);
      setEditingArea(null);
      resetForm();
      showSuccess('Área actualizada correctamente');
    } catch (error) {
      console.error('Error updating area:', error);
      showError('Error al actualizar el área: ' + (error as Error).message);
    }
  }, [dbService, editingArea, formData.nombre, resetForm, showError, showSuccess]);

  const handleDelete = useCallback((id: string, nombre: string) => {
    setConfirmDialog({
      isOpen: true,
      areaId: id,
      areaName: nombre
    });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setConfirmDialog(INITIAL_AREA_CONFIRM_DIALOG);
  }, []);

  const confirmDelete = useCallback(async () => {
    try {
      await dbService.deleteArea(confirmDialog.areaId);
      setAreas((prev) => prev.filter((area) => area.id !== confirmDialog.areaId));
      showSuccess('Área eliminada correctamente');
      closeDeleteDialog();
    } catch (error) {
      console.error('Error deleting area:', error);
      showError('Error al eliminar el área: ' + (error as Error).message);
    }
  }, [closeDeleteDialog, confirmDialog.areaId, dbService, showError, showSuccess]);

  const handleImportExcel = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const rows = await readExcelFirstSheetRows(file);
      const areasToImport = buildAreasImportPayload(rows);

      if (areasToImport.length === 0) {
        showError('No se encontraron filas válidas en el archivo.');
        return;
      }

      await dbService.importAreasFromExcel(areasToImport);
      await loadAreas();
      showSuccess('Áreas importadas correctamente');
    } catch (error) {
      console.error('Error importing Excel:', error);
      showError('Error al importar el archivo Excel');
    } finally {
      event.target.value = '';
    }
  }, [dbService, loadAreas, showError, showSuccess]);

  const openEditDialog = useCallback((area: Area) => {
    setEditingArea(area);
    setFormData({ nombre: area.nombre });
    setIsDialogOpen(true);
  }, []);

  const openCreateDialog = useCallback(() => {
    setEditingArea(null);
    resetForm();
    setIsDialogOpen(true);
  }, [resetForm]);

  return {
    areas,
    searchTerm,
    isLoading,
    isCreating,
    isDialogOpen,
    editingArea,
    confirmDialog,
    formData,
    setSearchTerm,
    setIsDialogOpen,
    setFormData,
    handleSearch,
    handleCreate,
    handleUpdate,
    handleDelete,
    confirmDelete,
    closeDeleteDialog,
    handleImportExcel,
    openEditDialog,
    openCreateDialog
  };
};
