import jsPDF from 'jspdf';
import type { Evento } from '@/types';

export type AutoTableFunction = (doc: jsPDF, options: unknown) => void;

export const ensureAutoTable = (fn: unknown): fn is AutoTableFunction => typeof fn === 'function';

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getEventoNombreFromRow = (row: Record<string, unknown>, eventos: Evento[]): string => {
  const eventoObj = row.evento as { nombre?: string } | undefined;
  if (eventoObj && eventoObj.nombre) {
    return eventoObj.nombre;
  }

  const idEvento = row.idEvento as string | undefined;
  if (idEvento) {
    const evento = eventos.find((item) => String(item.id) === String(idEvento) || String(item.idEvento) === String(idEvento));
    if (evento) {
      return evento.nombre;
    }
  }

  return 'N/A';
};
