export interface AutoTableOptions {
  startY?: number;
  head?: string[][];
  body?: (string | number)[][];
  theme?: 'grid' | 'striped' | 'plain';
  styles?: {
    fontSize?: number;
    cellPadding?: number;
    textColor?: number[];
    overflow?: 'linebreak' | 'ellipsize' | 'visible';
  };
  headStyles?: {
    fillColor?: number[];
    textColor?: number[];
    fontStyle?: string;
  };
  alternateRowStyles?: {
    fillColor?: number[];
  };
  columnStyles?: Record<number, {
    cellPadding?: number;
    halign?: 'left' | 'center' | 'right';
    fillColor?: (cellData: { raw: string }) => number[];
    cellWidth?: number | string;
  }>;
  margin?: { left?: number; right?: number; top?: number; bottom?: number };
  tableWidth?: number | 'auto';
}

export interface FiltrosReporte {
  tipoReporte: 'revisiones_evento' | 'verificaciones_calidad' | 'general' | 'aprobaciones_pendientes';
  idEvento?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: 'todos' | 'pendiente' | 'aprobado' | 'rechazado';
}

export type PreviewRow = Record<string, unknown>;

export const PREVIEW_ROWS_PER_PAGE = 20;
