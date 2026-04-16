import type { AreaFormData, AreaConfirmDialogState, AreaImportPayload } from './areas.types';

export const INITIAL_AREA_FORM_DATA: AreaFormData = {
  nombre: ''
};

export const INITIAL_AREA_CONFIRM_DIALOG: AreaConfirmDialogState = {
  isOpen: false,
  areaId: '',
  areaName: ''
};

export const buildAreasImportPayload = (
  rows: Array<Record<string, unknown>>
): AreaImportPayload[] => {
  return rows
    .map((row) => {
      const nombre = String(row['Nombre'] ?? row['nombre'] ?? '').trim();
      return {
        nombre,
        estado: 'activo' as const
      };
    })
    .filter((area) => area.nombre.length > 0);
};
