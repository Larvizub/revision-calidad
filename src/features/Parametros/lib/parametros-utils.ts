import type {
  ParametroConfirmDialogState,
  ParametroFormData,
  ParametroImportPayload
} from './parametros.types';

export const INITIAL_PARAMETRO_FORM_DATA: ParametroFormData = {
  idArea: '',
  nombre: ''
};

export const INITIAL_PARAMETRO_CONFIRM_DIALOG: ParametroConfirmDialogState = {
  isOpen: false,
  parametroId: '',
  parametroName: ''
};

export const buildParametrosImportPayload = (
  rows: Array<Record<string, unknown>>
): ParametroImportPayload[] => {
  return rows
    .map((row) => {
      const idArea = String(row['ID Area'] ?? row['IDArea'] ?? row['idArea'] ?? '').trim();
      const nombre = String(row['Nombre'] ?? row['nombre'] ?? '').trim();
      return {
        idArea,
        nombre,
        estado: 'activo' as const
      };
    })
    .filter((parametro) => parametro.idArea.length > 0 && parametro.nombre.length > 0);
};
