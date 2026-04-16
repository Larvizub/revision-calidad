import type { ChangeEvent } from 'react';
import type { Area, Parametro } from '@/types';

export interface ParametroFormData {
  idArea: string;
  nombre: string;
}

export interface ParametroConfirmDialogState {
  isOpen: boolean;
  parametroId: string;
  parametroName: string;
}

export interface ParametroImportPayload {
  idArea: string;
  nombre: string;
  estado: 'activo';
}

export interface UseParametrosDataResult {
  parametros: Parametro[];
  areas: Area[];
  filteredParametros: Parametro[];
  searchTerm: string;
  isLoading: boolean;
  isCreating: boolean;
  isDialogOpen: boolean;
  editingParametro: Parametro | null;
  confirmDialog: ParametroConfirmDialogState;
  formData: ParametroFormData;
  setSearchTerm: (value: string) => void;
  setIsDialogOpen: (isOpen: boolean) => void;
  setFormData: (value: ParametroFormData) => void;
  handleSearch: () => Promise<void>;
  handleCreate: () => Promise<void>;
  handleUpdate: () => Promise<void>;
  handleDelete: (id: string, nombre: string) => void;
  confirmDelete: () => Promise<void>;
  closeDeleteDialog: () => void;
  handleImportExcel: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  openEditDialog: (parametro: Parametro) => void;
  openCreateDialog: () => void;
  getAreaName: (idArea: string) => string;
}
