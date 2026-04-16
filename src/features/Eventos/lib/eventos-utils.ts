import type {
  EventoConfirmDialogState,
  EventoExcelRow,
  EventoFormData,
  ParsedExcelEventosResult,
  SkillDateState
} from './eventos.types';

export const INITIAL_EVENTO_FORM_DATA: EventoFormData = {
  idEvento: '',
  nombre: ''
};

export const INITIAL_EVENTO_CONFIRM_DIALOG: EventoConfirmDialogState = {
  isOpen: false,
  eventoId: '',
  eventoName: ''
};

export const buildInitialSkillDate = (): SkillDateState => ({
  month: (new Date().getMonth() + 1).toString(),
  year: new Date().getFullYear().toString()
});

const normalizeValue = (value: unknown): string => {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
};

const findHeaderKey = (
  headers: Array<{ raw: string; norm: string }>,
  variants: string[]
): string | undefined => {
  for (const variant of variants) {
    const normVariant = normalizeValue(variant);
    const found = headers.find((header) => header.norm === normVariant);
    if (found) {
      return found.raw;
    }
  }

  for (const header of headers) {
    if (variants.some((variant) => header.norm.includes(variant.replace(/\s+/g, '').toLowerCase()))) {
      return header.raw;
    }
  }

  return undefined;
};

export const parseEventosExcelRows = (
  rows: Array<Record<string, unknown>>
): ParsedExcelEventosResult => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { rows: [], availableHeaders: [] };
  }

  const headers = Object.keys(rows[0] || {}).map((header) => ({
    raw: header,
    norm: normalizeValue(header)
  }));

  const idKey = findHeaderKey(headers, ['IDEvento', 'idEvento', 'idevento', 'ideventoid', 'id']);
  const nameKey = findHeaderKey(headers, ['Nombre', 'NombreEvento', 'nombre', 'evento', 'name']);

  if (!idKey || !nameKey) {
    return {
      rows: [],
      availableHeaders: headers.map((header) => header.raw),
      idKey,
      nameKey
    };
  }

  const parsedRows: EventoExcelRow[] = [];

  for (const row of rows) {
    const raw = row as Record<string, unknown>;
    const rawId = raw[idKey];
    const nombreRaw = raw[nameKey];
    const idNum = Number(rawId);
    const idInt = Number.isFinite(idNum) ? Math.trunc(idNum) : NaN;
    const nombre = nombreRaw != null ? String(nombreRaw).trim() : '';

    if (!Number.isInteger(idInt) || !nombre) {
      continue;
    }

    parsedRows.push({ idEvento: idInt, nombre });
  }

  return {
    rows: parsedRows,
    availableHeaders: headers.map((header) => header.raw),
    idKey,
    nameKey
  };
};

export const dedupeEventosById = (rows: EventoExcelRow[]): EventoExcelRow[] => {
  const seen = new Set<number>();
  const unique: EventoExcelRow[] = [];

  for (const row of rows) {
    if (!seen.has(row.idEvento)) {
      seen.add(row.idEvento);
      unique.push(row);
    }
  }

  return unique;
};

export const normalizeSkillName = (value: string): string => {
  return String(value || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
};
