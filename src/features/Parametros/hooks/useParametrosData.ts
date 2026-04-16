import { useCallback, useEffect, useMemo, useState } from 'react';
import { DatabaseService } from '@/services/database';
import { useToast } from '@/hooks/useToast';
import { readExcelFirstSheetRows } from '@/lib/excel';
import type { Area, Parametro } from '@/types';
import {
  buildParametrosImportPayload,
  INITIAL_PARAMETRO_CONFIRM_DIALOG,
  INITIAL_PARAMETRO_FORM_DATA
} from '../lib/parametros-utils';
import type { ParametroFormData, UseParametrosDataResult } from '../lib/parametros.types';

export const useParametrosData = (): UseParametrosDataResult => {
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingParametro, setEditingParametro] = useState<Parametro | null>(null);
  const [confirmDialog, setConfirmDialog] = useState(INITIAL_PARAMETRO_CONFIRM_DIALOG);
  const [formData, setFormData] = useState<ParametroFormData>(INITIAL_PARAMETRO_FORM_DATA);

  const dbService = useMemo(() => new DatabaseService(), []);
  const { showSuccess, showError } = useToast();

  const resetForm = useCallback(() => {
    setFormData(INITIAL_PARAMETRO_FORM_DATA);
  }, []);

  const loadParametros = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dbService.getParametros();
      setParametros(data);
    } catch (error) {
      console.error('Error loading parametros:', error);
      showError('Error al cargar los parámetros: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [dbService, showError]);

  const loadAreas = useCallback(async () => {
    try {
      const data = await dbService.getAreas();
      setAreas(data);
    } catch (error) {
      console.error('Error loading areas:', error);
      showError('Error al cargar las áreas: ' + (error as Error).message);
    }
  }, [dbService, showError]);

  useEffect(() => {
    void loadParametros();
    void loadAreas();
  }, [loadAreas, loadParametros]);

  const handleSearch = useCallback(async () => {
    try {
      if (searchTerm.trim()) {
        const results = await dbService.searchParametros(searchTerm);
        setParametros(results);
      } else {
        await loadParametros();
      }
    } catch (error) {
      console.error('Error searching parametros:', error);
      showError('Error al buscar parámetros: ' + (error as Error).message);
    }
  }, [dbService, loadParametros, searchTerm, showError]);

  const handleCreate = useCallback(async () => {
    if (!formData.idArea || !formData.nombre.trim()) {
      showError('Por favor complete los campos obligatorios (Área y Nombre)');
      return;
    }

    setIsCreating(true);
    try {
      const parametroData = {
        idArea: formData.idArea,
        nombre: formData.nombre.trim(),
        estado: 'activo' as const
      };

      const newParametroId = await dbService.createParametro(parametroData);

      const newParametro: Parametro = {
        id: newParametroId,
        ...parametroData
      };

      setParametros((prev) => [...prev, newParametro]);
      setIsDialogOpen(false);
      resetForm();
      showSuccess('Parámetro creado correctamente');
    } catch (error) {
      console.error('Error creating parametro:', error);
      showError('Error al crear el parámetro: ' + (error as Error).message);
    } finally {
      setIsCreating(false);
    }
  }, [dbService, formData.idArea, formData.nombre, resetForm, showError, showSuccess]);

  const handleUpdate = useCallback(async () => {
    if (!editingParametro) {
      return;
    }

    if (!formData.idArea || !formData.nombre.trim()) {
      showError('Por favor complete los campos obligatorios (Área y Nombre)');
      return;
    }

    try {
      const updatedData = {
        idArea: formData.idArea,
        nombre: formData.nombre.trim()
      };

      await dbService.updateParametro(editingParametro.id, updatedData);

      setParametros((prev) => prev.map((parametro) => (
        parametro.id === editingParametro.id
          ? { ...parametro, ...updatedData }
          : parametro
      )));

      setIsDialogOpen(false);
      setEditingParametro(null);
      resetForm();
      showSuccess('Parámetro actualizado correctamente');
    } catch (error) {
      console.error('Error updating parametro:', error);
      showError('Error al actualizar el parámetro: ' + (error as Error).message);
    }
  }, [dbService, editingParametro, formData.idArea, formData.nombre, resetForm, showError, showSuccess]);

  const handleDelete = useCallback((id: string, nombre: string) => {
    setConfirmDialog({
      isOpen: true,
      parametroId: id,
      parametroName: nombre
    });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setConfirmDialog(INITIAL_PARAMETRO_CONFIRM_DIALOG);
  }, []);

  const confirmDelete = useCallback(async () => {
    try {
      await dbService.deleteParametro(confirmDialog.parametroId);
      setParametros((prev) => prev.filter((parametro) => parametro.id !== confirmDialog.parametroId));
      showSuccess('Parámetro eliminado correctamente');
      closeDeleteDialog();
    } catch (error) {
      console.error('Error deleting parametro:', error);
      showError('Error al eliminar el parámetro: ' + (error as Error).message);
    }
  }, [closeDeleteDialog, confirmDialog.parametroId, dbService, showError, showSuccess]);

  const handleImportExcel = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const jsonData = await readExcelFirstSheetRows(file);
      const parametrosToImport = buildParametrosImportPayload(jsonData);

      if (parametrosToImport.length === 0) {
        showError('No se encontraron filas válidas en el archivo.');
        return;
      }

      await dbService.importParametrosFromExcel(parametrosToImport);
      await loadParametros();
      showSuccess('Parámetros importados correctamente');
    } catch (error) {
      console.error('Error importing Excel:', error);
      showError('Error al importar el archivo Excel');
    } finally {
      event.target.value = '';
    }
  }, [dbService, loadParametros, showError, showSuccess]);

  const openEditDialog = useCallback((parametro: Parametro) => {
    setEditingParametro(parametro);
    setFormData({
      idArea: parametro.idArea,
      nombre: parametro.nombre
    });
    setIsDialogOpen(true);
  }, []);

  const openCreateDialog = useCallback(() => {
    setEditingParametro(null);
    resetForm();
    setIsDialogOpen(true);
  }, [resetForm]);

  const getAreaName = useCallback((idArea: string) => {
    const area = areas.find((item) => item.id === idArea);
    return area ? area.nombre : 'Área no encontrada';
  }, [areas]);

  const filteredParametros = useMemo(() => {
    if (!searchTerm) {
      return parametros;
    }

    return parametros.filter((parametro) => (
      parametro.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      || getAreaName(parametro.idArea).toLowerCase().includes(searchTerm.toLowerCase())
    ));
  }, [getAreaName, parametros, searchTerm]);

  return {
    parametros,
    areas,
    filteredParametros,
    searchTerm,
    isLoading,
    isCreating,
    isDialogOpen,
    editingParametro,
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
    openCreateDialog,
    getAreaName
  };
};
