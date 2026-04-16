import { Workbook, type CellValue } from 'exceljs';

const isNonEmptyValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

const normalizeCellValue = (value: CellValue | null | undefined): unknown => {
  if (value === null || value === undefined) return null;

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value instanceof Date
  ) {
    return value;
  }

  if (typeof value === 'object') {
    if ('result' in value) {
      return normalizeCellValue((value as { result?: CellValue | null }).result ?? null);
    }

    if ('richText' in value) {
      const parts = (value as { richText?: Array<{ text?: string }> }).richText ?? [];
      return parts.map((part) => part.text ?? '').join('');
    }

    if ('text' in value) {
      return (value as { text?: string }).text ?? null;
    }

    if ('hyperlink' in value) {
      const link = value as { text?: string; hyperlink?: string };
      return link.text ?? link.hyperlink ?? null;
    }

    if ('error' in value) {
      return (value as { error?: string }).error ?? null;
    }
  }

  return String(value);
};

export const readExcelFirstSheetRows = async (
  file: File,
  defval: unknown = undefined
): Promise<Array<Record<string, unknown>>> => {
  const workbook = new Workbook();
  const data = await file.arrayBuffer();
  await workbook.xlsx.load(data);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const headerRow = worksheet.getRow(1);
  const headers: Array<{ col: number; key: string }> = [];

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const header = String(normalizeCellValue(cell.value) ?? '').trim();
    if (header) {
      headers.push({ col: colNumber, key: header });
    }
  });

  if (headers.length === 0) return [];

  const rows: Array<Record<string, unknown>> = [];

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const record: Record<string, unknown> = {};
    let hasAnyValue = false;

    for (const header of headers) {
      const rawValue = normalizeCellValue(row.getCell(header.col).value);
      if (isNonEmptyValue(rawValue)) {
        hasAnyValue = true;
      }
      record[header.key] = rawValue ?? defval;
    }

    if (hasAnyValue) {
      rows.push(record);
    }
  }

  return rows;
};
