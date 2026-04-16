import type { ChangeEvent } from 'react';
import type { Evento } from '@/types';

export interface EventoFormData {
  idEvento: string;
  nombre: string;
}

export interface EventoConfirmDialogState {
  isOpen: boolean;
  eventoId: string;
  eventoName: string;
}

export interface SkillDateState {
  month: string;
  year: string;
}

export interface EventoExcelRow {
  idEvento: number;
  nombre: string;
}

export interface EventoImportPayload {
  idEvento: number;
  nombre: string;
  fechaCreacion: string;
  estado: 'activo';
}

export interface ParsedExcelEventosResult {
  rows: EventoExcelRow[];
  availableHeaders: string[];
  idKey?: string;
  nameKey?: string;
}

export interface UseEventosDataResult {
  eventos: Evento[];
  searchTerm: string;
  isLoading: boolean;
  isCreating: boolean;
  isDialogOpen: boolean;
  isSkillDialogOpen: boolean;
  isSkillLoading: boolean;
  skillDate: SkillDateState;
  editingEvento: Evento | null;
  confirmDialog: EventoConfirmDialogState;
  formData: EventoFormData;
  setSearchTerm: (value: string) => void;
  setIsDialogOpen: (isOpen: boolean) => void;
  setIsSkillDialogOpen: (isOpen: boolean) => void;
  setSkillDate: (value: SkillDateState) => void;
  setFormData: (value: EventoFormData) => void;
  handleSearch: () => Promise<void>;
  handleCreate: () => Promise<void>;
  handleUpdate: () => Promise<void>;
  handleDelete: (id: string, nombre: string) => void;
  confirmDelete: () => Promise<void>;
  closeDeleteDialog: () => void;
  handleImportExcel: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleImportSkill: () => Promise<void>;
  openEditDialog: (evento: Evento) => void;
  openCreateDialog: () => void;
}
