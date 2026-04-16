import type { Area } from '@/types';

export interface AreaFormData {
  nombre: string;
}

export interface AreaConfirmDialogState {
  isOpen: boolean;
  areaId: string;
  areaName: string;
}

export interface AreaImportPayload {
  nombre: string;
  estado: 'activo';
}

export interface UseAreasDataResult {
  areas: Area[];
  searchTerm: string;
  isLoading: boolean;
  isCreating: boolean;
  isDialogOpen: boolean;
  editingArea: Area | null;
  confirmDialog: AreaConfirmDialogState;
  formData: AreaFormData;
  setSearchTerm: (value: string) => void;
  setIsDialogOpen: (isOpen: boolean) => void;
  setFormData: (formData: AreaFormData) => void;
  handleSearch: () => Promise<void>;
  handleCreate: () => Promise<void>;
  handleUpdate: () => Promise<void>;
  handleDelete: (id: string, nombre: string) => void;
  confirmDelete: () => Promise<void>;
  closeDeleteDialog: () => void;
  handleImportExcel: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  openEditDialog: (area: Area) => void;
  openCreateDialog: () => void;
}
