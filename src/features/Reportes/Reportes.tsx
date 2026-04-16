import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DatabaseService } from '@/services/database';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import type { Evento, Reporte } from '@/types';
import { 
  Loader2, 
  FileText, 
  Download, 
  Filter,
  FileSpreadsheet,
  Search,
  X,
  Trash2
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Workbook, type Worksheet } from 'exceljs';

// Tipo para la función autoTable exportada
type AutoTableFunction = (doc: jsPDF, options: AutoTableOptions) => void;
const ensureAutoTable = (fn: unknown): fn is AutoTableFunction => typeof fn === 'function';
import { saveAs } from 'file-saver';

// Tipo para autoTable
interface AutoTableOptions {
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

// Extender el tipo jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => void;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

interface FiltrosReporte {
  tipoReporte: 'revisiones_evento' | 'verificaciones_calidad' | 'general' | 'aprobaciones_pendientes';
  idEvento?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: 'todos' | 'pendiente' | 'aprobado' | 'rechazado';
}

const Reportes: React.FC = () => {
  const PREVIEW_ROWS_PER_PAGE = 20;

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [filtros, setFiltros] = useState<FiltrosReporte>({
    tipoReporte: 'revisiones_evento',
    estado: 'todos'
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const { showSuccess, showError } = useToast();
  const { userProfile } = useAuth();

  const dbService = useMemo(() => new DatabaseService(), []);

  // Preview de los datos que se exportarán (revisiones / verificaciones) según filtros
  const [previewData, setPreviewData] = useState<Array<Record<string, unknown>> | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);

  const totalPreviewRows = previewData?.length ?? 0;
  const totalPreviewPages = Math.max(1, Math.ceil(totalPreviewRows / PREVIEW_ROWS_PER_PAGE));

  const paginatedPreviewData = useMemo(() => {
    if (!previewData || previewData.length === 0) return [];
    const startIndex = (previewPage - 1) * PREVIEW_ROWS_PER_PAGE;
    return previewData.slice(startIndex, startIndex + PREVIEW_ROWS_PER_PAGE);
  }, [previewData, previewPage]);

  const previewRangeStart = totalPreviewRows === 0 ? 0 : (previewPage - 1) * PREVIEW_ROWS_PER_PAGE + 1;
  const previewRangeEnd = Math.min(previewPage * PREVIEW_ROWS_PER_PAGE, totalPreviewRows);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
  const eventosData = await dbService.getEventos();
  setEventos(eventosData);
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Error al cargar los datos: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [showError, dbService]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPreviewPage(1);
  }, [
    filtros.tipoReporte,
    filtros.idEvento,
    filtros.fechaDesde,
    filtros.fechaHasta,
    filtros.estado,
    previewData?.length
  ]);

  useEffect(() => {
    if (previewPage > totalPreviewPages) {
      setPreviewPage(totalPreviewPages);
    }
  }, [previewPage, totalPreviewPages]);

  // Cargar datos de preview cuando cambian los filtros
  useEffect(() => {
    let mounted = true;
    const loadPreview = async () => {
      setIsPreviewLoading(true);
      try {
        if (filtros.tipoReporte === 'revisiones_evento' && filtros.idEvento) {
          const data = await dbService.getReporteRevisionesPorEvento(filtros.idEvento);
          if (!mounted) return;
          setPreviewData(((data.revisiones as unknown) as Array<Record<string, unknown>>) || []);
        } else if (filtros.tipoReporte === 'verificaciones_calidad') {
          const res = await dbService.getReporteVerificacionesCalidad({
            fechaDesde: filtros.fechaDesde,
            fechaHasta: filtros.fechaHasta,
            estado: filtros.estado === 'todos' ? undefined : filtros.estado
          });
          if (!mounted) return;
          setPreviewData(((res.revisiones as unknown) as Array<Record<string, unknown>>) || []);
        } else if (filtros.tipoReporte === 'aprobaciones_pendientes') {
          const pendientes = await dbService.getRevisionesPendientes();
          // Enriquecer con información de área para mostrar nombre en la vista previa
          const areas = await dbService.getAreas();
          if (!mounted) return;
          const enriched = (pendientes || []).map(p => ({
            ...p,
            area: areas.find(a => a.id === p.idArea) || { id: p.idArea, nombre: 'N/A' }
          }));
          setPreviewData(enriched as Array<Record<string, unknown>>);
        } else if (filtros.tipoReporte === 'general') {
          const res = await dbService.getReporteResumenGeneral({
            fechaDesde: filtros.fechaDesde,
            fechaHasta: filtros.fechaHasta,
            estado: filtros.estado === 'todos' ? undefined : filtros.estado
          });
          if (!mounted) return;
          setPreviewData(((res.revisiones as unknown) as Array<Record<string, unknown>>) || []);
        } else {
          setPreviewData(null);
        }
      } catch (error) {
        console.error('Error loading preview data:', error);
        if (mounted) showError('Error al cargar vista previa de datos');
      } finally {
        if (mounted) setIsPreviewLoading(false);
      }
    };

    loadPreview();
    return () => { mounted = false; };
  }, [filtros, dbService, showError]);

  // Filtrar eventos por término de búsqueda
  const filteredEventos = useMemo(() => 
    searchTerm ? 
      eventos.filter(evento => 
        evento.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evento.idEvento.toString().includes(searchTerm)
      ) : eventos,
    [eventos, searchTerm]
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventoNombre = (rev: Record<string, unknown>) => {
    // Preferir objeto evento si viene poblado
    const eventoObj = rev.evento as { nombre?: string } | undefined;
    if (eventoObj && eventoObj.nombre) return eventoObj.nombre;
    // Si no, intentar usar idEvento y buscar en la lista de eventos cargada
    const idEvento = rev['idEvento'] as string | undefined;
    if (idEvento) {
      const ev = eventos.find(e => String(e.id) === String(idEvento) || String(e.idEvento) === String(idEvento));
      if (ev) return ev.nombre;
    }
    return 'N/A';
  };

  const isAdmin = userProfile?.role === 'administrador';

  const generatePDFReport = async (data: Record<string, unknown>, tipo: string) => {
    try {
      const doc = new jsPDF();
      
      // Verificar que autoTable esté disponible
      if (!ensureAutoTable(autoTable)) {
        throw new Error('jspdf-autotable no está disponible. Verifique la instalación.');
      }

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const MARGIN = 15;
      const CONTENT_WIDTH = pageWidth - MARGIN * 2;
      let currentY = MARGIN + 5;

      // Colores aproximados basados en la paleta de la aplicación (convertidos a RGB)
      const COLORS: {
        primary: [number, number, number];
        primaryForeground: [number, number, number];
        secondary: [number, number, number];
        secondaryForeground: [number, number, number];
        surface: [number, number, number];
        border: [number, number, number];
        neutralText: [number, number, number];
        success: [number, number, number];
        warning: [number, number, number];
        danger: [number, number, number];
      } = {
        primary: [39, 60, 42], // aproximado de --primary (#273c2a)
        primaryForeground: [250, 250, 250],
        secondary: [215, 192, 122], // aproximado de --secondary (#d7c07a)
        secondaryForeground: [23, 23, 23],
        surface: [248, 250, 252], // gray-50
        border: [226, 232, 240],
        neutralText: [0, 0, 0],
        success: [34, 197, 94],
        warning: [251, 191, 36],
        danger: [239, 68, 68]
      };

    // Función para verificar si necesitamos nueva página
    const checkPageBreak = (requiredSpace: number): void => {
      if (currentY + requiredSpace > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }
    };

  // Header del documento con paleta de la aplicación
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 52, 'F');

  doc.setTextColor(...COLORS.primaryForeground);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('SISTEMA DE REVISIÓN DE CALIDAD', pageWidth / 2, 24, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Reporte Detallado de Calidad', pageWidth / 2, 36, { align: 'center' });

  // Reset color y posición
  doc.setTextColor(...COLORS.neutralText);
  currentY = 62;

    // Información general
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de generación: ${formatDate(new Date().toISOString())}`, 20, currentY);
    currentY += 10;
    doc.text(`Hora de generación: ${new Date().toLocaleTimeString('es-ES')}`, 20, currentY);
    currentY += 15;

    if (tipo === 'revisiones_evento' && (data as { evento?: unknown }).evento) {
      const evento = (data as { evento: { nombre: string; idEvento: string; descripcion?: string; fechaInicio?: string; fechaFin?: string } }).evento;
      
      // Información del evento (card usando márgenes)
      doc.setFillColor(...COLORS.surface);
      doc.rect(MARGIN, currentY - 5, CONTENT_WIDTH, 40, 'F');
      doc.setDrawColor(...COLORS.border);
      doc.rect(MARGIN, currentY - 5, CONTENT_WIDTH, 40, 'S');

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DEL EVENTO', MARGIN + 4, currentY + 4);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre: ${evento.nombre}`, MARGIN + 4, currentY + 14);
      doc.text(`ID Evento: ${evento.idEvento}`, MARGIN + 4, currentY + 24);

      if (evento.descripcion) {
        const desc = evento.descripcion.length > 120 ? evento.descripcion.substring(0, 117) + '...' : evento.descripcion;
        doc.text(`Descripción: ${desc}`, MARGIN + 4, currentY + 34);
      }

      currentY += 54;

      const revisiones = (data as { revisiones?: Array<Record<string, unknown>> }).revisiones;
      if (revisiones && revisiones.length > 0) {
        checkPageBreak(30);
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('REVISIONES DETALLADAS', 20, currentY);
        currentY += 15;

        // Estadísticas generales
        const estadisticas = {
          total: revisiones.length,
          aprobadas: revisiones.filter(r => r.estado === 'aprobado').length,
          pendientes: revisiones.filter(r => r.estado === 'pendiente').length,
          rechazadas: revisiones.filter(r => r.estado === 'rechazado').length
        };

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  // Distribuir indicadores en columnas para evitar overflow
  const cols = 4;
  const colWidth = CONTENT_WIDTH / cols;
  doc.text(`Total de revisiones: ${estadisticas.total}`, MARGIN + 4, currentY);
  doc.setTextColor(...COLORS.success);
  doc.text(`Aprobadas: ${estadisticas.aprobadas}`, MARGIN + colWidth * 1 + 4, currentY);
  doc.setTextColor(...COLORS.warning);
  doc.text(`Pendientes: ${estadisticas.pendientes}`, MARGIN + colWidth * 2 + 4, currentY);
  doc.setTextColor(...COLORS.danger);
  doc.text(`Rechazadas: ${estadisticas.rechazadas}`, MARGIN + colWidth * 3 + 4, currentY);
  doc.setTextColor(...COLORS.neutralText); // Reset
        currentY += 20;

        // Tabla resumen de revisiones
        const tableData = revisiones.map((revision: Record<string, unknown>) => [
          (revision.area as { nombre?: string })?.nombre || 'N/A',
          formatDate(revision.fechaRevision as string),
          ((revision.estado as string) || '').toUpperCase(),
          (revision.aprobadoPor as string) || 'N/A',
          Object.keys((revision.resultados as Record<string, unknown>) || {}).length.toString()
        ]);

        (autoTable as AutoTableFunction)(doc, {
          startY: currentY,
          margin: { left: MARGIN, right: MARGIN },
          tableWidth: CONTENT_WIDTH,
          head: [['Área', 'Fecha Revisión', 'Estado', 'Aprobado Por', 'Total Parámetros']],
          body: tableData,
          theme: 'grid',
          styles: { 
            fontSize: 9,
            cellPadding: 3,
            textColor: COLORS.neutralText
          },
          headStyles: {
            fillColor: COLORS.primary,
            textColor: COLORS.primaryForeground,
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: COLORS.surface
          },
          columnStyles: {
            0: { cellPadding: 3 },
            1: { cellPadding: 3 },
            2: { cellPadding: 2 },
            3: { cellPadding: 2 },
            4: { cellPadding: 2 }
          }
        });

        currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY + 12 || currentY + 40;

        // Detalles de parámetros por revisión
        revisiones.forEach((revision: Record<string, unknown>, index: number) => {
          checkPageBreak(80);
          
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(`REVISIÓN ${index + 1}: ${(revision.area as { nombre?: string })?.nombre || 'N/A'}`, 20, currentY);
          currentY += 10;

          // Incluir comentario original del revisor (si existe)
          const comentarioRevisor = (revision.comentarios as string) || '';
          if (comentarioRevisor) {
            const wrappedRev = doc.splitTextToSize(comentarioRevisor, CONTENT_WIDTH - 10);
            checkPageBreak(wrappedRev.length * 6 + 12);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Comentario del Revisor:', MARGIN, currentY);
            currentY += 8;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(wrappedRev, MARGIN, currentY);
            currentY += wrappedRev.length * 6 + 8;
          }

          type RawResultado = string | { valor?: string; cumple?: boolean | string; comentarios?: string } | boolean | null | undefined;
          const resultados = (revision.resultados as Record<string, unknown>) || {};
          const resultadosTyped = resultados as Record<string, RawResultado>;
          const parametros = (revision.parametros as Array<{ id?: string; nombre?: string; descripcion?: string }> ) || [];

          const resultadoKeys = Object.keys(resultados);
          if (resultadoKeys.length > 0) {
            // Map parámetros por id para buscar metadata rápidamente
            const paramMap: Record<string, { id?: string; nombre?: string; descripcion?: string }> = {};
            parametros.forEach(p => { if (p && p.id) paramMap[String(p.id)] = p; });

            const parametrosData = resultadoKeys.map((paramId) => {
              const raw = resultadosTyped[paramId];
              const paramDef = paramMap[paramId];
              const nombre = paramDef?.nombre || String(paramId);

              // Normalizar distintos formatos posibles de 'raw':
              // - string: 'cumple' | 'no_cumple' | 'no_aplica'
              // - object: { valor?, cumple?, comentarios? } donde 'cumple' puede ser boolean o string
              // - null/undefined
              let valorStr = 'No evaluado';
              let cumpleText = 'No Aplica';
              let comentarios = '';

              if (raw === null || raw === undefined) {
                // mantener valores por defecto
              } else if (typeof raw === 'string') {
                comentarios = '';
                if (raw === 'cumple') {
                  cumpleText = 'cumple';
                  valorStr = 'cumple';
                } else if (raw === 'no_cumple') {
                  cumpleText = 'No cumple';
                  valorStr = 'No cumple';
                } else if (raw === 'no_aplica') {
                  cumpleText = 'No Aplica';
                  valorStr = 'No Aplica';
                } else {
                  // valor libre
                  valorStr = String(raw);
                  cumpleText = 'No Aplica';
                }
              } else if (typeof raw === 'object') {
                comentarios = raw.comentarios ?? '';
                if (raw.valor !== undefined && raw.valor !== null) {
                  valorStr = String(raw.valor);
                }

                const c = raw.cumple;
                if (typeof c === 'boolean') {
                  cumpleText = c ? 'cumple' : 'No cumple';
                  if (valorStr === 'No evaluado') valorStr = cumpleText;
                } else if (typeof c === 'string') {
                  if (c === 'cumple') { cumpleText = 'cumple'; if (valorStr === 'No evaluado') valorStr = 'cumple'; }
                  else if (c === 'no_cumple') { cumpleText = 'No cumple'; if (valorStr === 'No evaluado') valorStr = 'No cumple'; }
                  else if (c === 'no_aplica') { cumpleText = 'No Aplica'; if (valorStr === 'No evaluado') valorStr = 'No Aplica'; }
                }
              }

              return [
                nombre,
                String(cumpleText),
                comentarios
              ];
            });

            (autoTable as AutoTableFunction)(doc, {
              startY: currentY,
              margin: { left: MARGIN, right: MARGIN },
              tableWidth: CONTENT_WIDTH,
              head: [['Parámetro', 'Cumple:', 'Comentarios']],
              body: parametrosData,
              theme: 'grid',
              styles: { 
                fontSize: 8,
                cellPadding: 2,
                overflow: 'linebreak'
              },
              headStyles: {
                fillColor: COLORS.secondary,
                textColor: COLORS.secondaryForeground,
                fontStyle: 'bold'
              },
              columnStyles: {
                0: { cellPadding: 2 },
                1: { cellPadding: 2 },
                2: { cellPadding: 2 }
              }
            });

            currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY + 10 || currentY + 30;

            // Incluir comentarios de calidad generales para la revisión si existen
            const comentariosCalidad = (revision.comentariosCalidad as string) || '';
            if (comentariosCalidad) {
              const wrapped = doc.splitTextToSize(comentariosCalidad, CONTENT_WIDTH - 10);
              checkPageBreak(wrapped.length * 6 + 12);
              doc.setFontSize(11);
              doc.setFont('helvetica', 'bold');
              doc.text('Comentarios de Calidad:', MARGIN, currentY);
              currentY += 8;
              doc.setFontSize(10);
              doc.setFont('helvetica', 'normal');
              doc.text(wrapped, MARGIN, currentY);
              currentY += wrapped.length * 6 + 8;
            }
          } else {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.text('No hay resultados de parámetros registrados', 25, currentY);
            currentY += 15;
          }
        });
      }
    } else if (tipo === 'verificaciones_calidad' || tipo === 'general') {
      const isGeneral = tipo === 'general';
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(isGeneral ? 'RESUMEN GENERAL DE REVISIONES' : 'VERIFICACIONES DE CALIDAD', 20, currentY);
      currentY += 15;

      const revisiones = (data as { revisiones?: Array<Record<string, unknown>> }).revisiones;
      if (revisiones && revisiones.length > 0) {
        const toPercent = (value: number, total: number) => total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '0.0%';

        // Estadísticas de verificaciones
        const stats = {
          total: revisiones.length,
          aprobadas: revisiones.filter(r => r.estado === 'aprobado').length,
          pendientes: revisiones.filter(r => r.estado === 'pendiente').length,
          rechazadas: revisiones.filter(r => r.estado === 'rechazado').length
        };

        doc.setFontSize(12);
        doc.text(`Total de ${isGeneral ? 'revisiones' : 'verificaciones'}: ${stats.total}`, 20, currentY);
        doc.setTextColor(34, 197, 94);
  doc.text(`Aprobadas: ${stats.aprobadas} (${toPercent(stats.aprobadas, stats.total)})`, 20, currentY + 10);
        doc.setTextColor(251, 191, 36);
  doc.text(`Pendientes: ${stats.pendientes} (${toPercent(stats.pendientes, stats.total)})`, 20, currentY + 20);
        doc.setTextColor(239, 68, 68);
  doc.text(`Rechazadas: ${stats.rechazadas} (${toPercent(stats.rechazadas, stats.total)})`, 20, currentY + 30);
        doc.setTextColor(0, 0, 0);
        currentY += 45;

        const tableData = revisiones.map((revision: Record<string, unknown>) => [
          (revision.evento as { nombre?: string })?.nombre || 'N/A',
          (revision.area as { nombre?: string })?.nombre || 'N/A',
          formatDate(revision.fechaRevision as string),
          ((revision.estado as string) || '').toUpperCase(),
          (revision.aprobadoPor as string) || 'N/A',
          revision.fechaAprobacion ? formatDate(revision.fechaAprobacion as string) : 'N/A'
        ]);

        (autoTable as AutoTableFunction)(doc, {
          startY: currentY,
          margin: { left: MARGIN, right: MARGIN },
          tableWidth: CONTENT_WIDTH,
          head: [['Evento', 'Área', 'Fecha Revisión', 'Estado', isGeneral ? 'Responsable Calidad' : 'Verificado Por', 'Fecha Verificación']],
          body: tableData,
          theme: 'grid',
          styles: { 
            fontSize: 9,
            cellPadding: 3,
            textColor: COLORS.neutralText
          },
          headStyles: {
            fillColor: COLORS.primary,
            textColor: COLORS.primaryForeground,
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: COLORS.surface
          },
          columnStyles: {
            0: { cellPadding: 2 },
            1: { cellPadding: 2 },
            2: { cellPadding: 2 },
            3: { cellPadding: 2 },
            4: { cellPadding: 2 },
            5: { cellPadding: 2 }
          }
        });

        currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY + 12 || currentY + 30;

        const comentariosConContexto = revisiones
          .map((revision: Record<string, unknown>) => {
            const comentario = ((revision.comentariosCalidad as string) || '').trim();
            if (!comentario) return null;

            return {
              evento: (revision.evento as { nombre?: string })?.nombre || 'Evento no identificado',
              area: (revision.area as { nombre?: string })?.nombre || 'Área no identificada',
              estado: ((revision.estado as string) || 'N/A').toUpperCase(),
              fechaRevision: revision.fechaRevision ? formatDate(revision.fechaRevision as string) : 'N/A',
              verificadoPor: (revision.aprobadoPor as string) || 'N/A',
              comentario
            };
          })
          .filter((item): item is {
            evento: string;
            area: string;
            estado: string;
            fechaRevision: string;
            verificadoPor: string;
            comentario: string;
          } => Boolean(item));

        if (comentariosConContexto.length > 0) {
          checkPageBreak(24);
          doc.setFillColor(...COLORS.secondary);
          doc.roundedRect(MARGIN, currentY - 6, CONTENT_WIDTH, 10, 2, 2, 'F');
          doc.setFontSize(11);
          doc.setTextColor(...COLORS.secondaryForeground);
          doc.setFont('helvetica', 'bold');
          doc.text('COMENTARIOS DE CALIDAD (CON CONTEXTO DE EVENTO)', MARGIN + 4, currentY);
          doc.setTextColor(...COLORS.neutralText);
          currentY += 12;

          comentariosConContexto.forEach((item, index) => {
            const meta = `Estado: ${item.estado} | Fecha: ${item.fechaRevision} | Responsable: ${item.verificadoPor}`;
            const wrappedComentario = doc.splitTextToSize(item.comentario, CONTENT_WIDTH - 10);
            const boxHeight = 20 + wrappedComentario.length * 5;

            checkPageBreak(boxHeight + 8);

            doc.setFillColor(...COLORS.surface);
            doc.roundedRect(MARGIN, currentY - 4, CONTENT_WIDTH, boxHeight, 2, 2, 'F');
            doc.setDrawColor(...COLORS.border);
            doc.roundedRect(MARGIN, currentY - 4, CONTENT_WIDTH, boxHeight, 2, 2, 'S');

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`${index + 1}. ${item.evento} - ${item.area}`, MARGIN + 3, currentY + 2);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            doc.text(meta, MARGIN + 3, currentY + 8);

            doc.setTextColor(...COLORS.neutralText);
            doc.setFontSize(9);
            doc.text(wrappedComentario, MARGIN + 3, currentY + 14);

            currentY += boxHeight + 4;
          });
        }
      }
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - 30, pageHeight - 10);
      doc.text('Sistema de Revisión de Calidad - Confidencial', 20, pageHeight - 10);
    }

    return doc;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error(`Error al generar el PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const EXCEL_THEME = {
    primary: 'FF273C2A',
    secondary: 'FFD7C07A',
    border: 'FFE2E8F0',
    text: 'FF111827',
    mutedRow: 'FFF8FAFC',
    white: 'FFFFFFFF',
    success: 'FF15803D',
    warning: 'FFD97706',
    danger: 'FFB91C1C'
  };

  const normalizeCumpleValue = (resultado: unknown): boolean | null => {
    if (typeof resultado === 'boolean') return resultado;

    if (typeof resultado === 'string') {
      const normalized = resultado.trim().toLowerCase();
      if (normalized === 'cumple' || normalized === 'si' || normalized === 'sí') return true;
      if (normalized === 'no_cumple' || normalized === 'no') return false;
      return null;
    }

    if (resultado && typeof resultado === 'object') {
      const value = resultado as { cumple?: unknown; valor?: unknown };
      if (typeof value.cumple === 'boolean') return value.cumple;
      if (typeof value.cumple === 'string') {
        const normalized = value.cumple.trim().toLowerCase();
        if (normalized === 'cumple' || normalized === 'si' || normalized === 'sí') return true;
        if (normalized === 'no_cumple' || normalized === 'no') return false;
      }
      if (typeof value.valor === 'string') {
        const normalized = value.valor.trim().toLowerCase();
        if (normalized === 'cumple' || normalized === 'si' || normalized === 'sí') return true;
        if (normalized === 'no_cumple' || normalized === 'no') return false;
      }
    }

    return null;
  };

  const getDetalleResultado = (resultado: unknown): { valor: string; cumple: string; comentarios: string } => {
    const cumpleBool = normalizeCumpleValue(resultado);

    if (resultado && typeof resultado === 'object') {
      const value = resultado as { valor?: unknown; comentarios?: unknown };
      return {
        valor: value.valor != null ? String(value.valor) : 'No evaluado',
        cumple: cumpleBool === null ? 'NO APLICA' : cumpleBool ? 'SÍ' : 'NO',
        comentarios: value.comentarios != null ? String(value.comentarios) : 'Sin comentarios'
      };
    }

    if (typeof resultado === 'string') {
      return {
        valor: resultado,
        cumple: cumpleBool === null ? 'NO APLICA' : cumpleBool ? 'SÍ' : 'NO',
        comentarios: 'Sin comentarios'
      };
    }

    return {
      valor: 'No evaluado',
      cumple: cumpleBool === null ? 'NO APLICA' : cumpleBool ? 'SÍ' : 'NO',
      comentarios: 'Sin comentarios'
    };
  };

  const getRevisionMetrics = (revision: Record<string, unknown>) => {
    const verificacionCalidad = (revision.verificacionCalidad as Record<string, unknown>) || {};
    const resultados = (revision.resultados as Record<string, unknown>) || {};
    const hasVerificacionCalidad = Object.keys(verificacionCalidad).length > 0;

    const source = hasVerificacionCalidad ? verificacionCalidad : resultados;
    const totalParametros = Object.keys(source).length;

    const parametrosCumplidos = hasVerificacionCalidad
      ? Object.values(verificacionCalidad).filter((status) => {
          const normalized = String(status ?? '').trim().toLowerCase();
          return normalized === 'verificado' || normalized === 'cumple' || normalized === 'aprobado' || normalized === 'si' || normalized === 'sí' || normalized === 'true';
        }).length
      : Object.values(resultados).filter((result) => normalizeCumpleValue(result) === true).length;

    return {
      totalParametros,
      parametrosCumplidos,
      resumenParametros: `${parametrosCumplidos}/${totalParametros}`,
      porcentajeCumplimiento: totalParametros > 0 ? `${((parametrosCumplidos / totalParametros) * 100).toFixed(1)}%` : '0.0%'
    };
  };

  const getHeaderStyle = (fillColor: string, textColor: string) => ({
    fill: {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: fillColor }
    },
    font: {
      name: 'Arial',
      size: 11,
      bold: true,
      color: { argb: textColor }
    }
  });

  const autoFitColumns = (worksheet: Worksheet, min = 14, max = 48) => {
    worksheet.columns.forEach((column) => {
      let maxLength = min;

      if (!column.eachCell) return;

      column.eachCell({ includeEmpty: true }, (cell) => {
        const raw = cell.value;
        const text = raw == null
          ? ''
          : typeof raw === 'object' && 'richText' in raw
            ? raw.richText.map((part) => part.text ?? '').join('')
            : String(raw);
        maxLength = Math.max(maxLength, text.length + 2);
      });

      column.width = Math.min(max, maxLength);
    });
  };

  const applySheetHeader = (worksheet: Worksheet, title: string, totalColumns: number) => {
    const cols = Math.max(totalColumns, 2);

    worksheet.mergeCells(1, 1, 1, cols);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = title;
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: EXCEL_THEME.primary }
    };
    titleCell.font = {
      name: 'Arial',
      size: 14,
      bold: true,
      color: { argb: EXCEL_THEME.white }
    };

    worksheet.mergeCells(2, 1, 2, cols);
    const subtitleCell = worksheet.getCell(2, 1);
    subtitleCell.value = `Generado el ${formatDate(new Date().toISOString())}`;
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    subtitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: EXCEL_THEME.secondary }
    };
    subtitleCell.font = {
      name: 'Arial',
      size: 10,
      bold: true,
      color: { argb: EXCEL_THEME.text }
    };

    worksheet.getRow(1).height = 24;
    worksheet.getRow(2).height = 18;
  };

  const applyTableFormat = (worksheet: Worksheet, headerRowNumber: number, headers: string[]) => {
    const headerRow = worksheet.getRow(headerRowNumber);
    const headerStyle = getHeaderStyle(EXCEL_THEME.primary, EXCEL_THEME.white);

    headerRow.eachCell((cell) => {
      cell.fill = headerStyle.fill;
      cell.font = headerStyle.font;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: EXCEL_THEME.border } },
        left: { style: 'thin', color: { argb: EXCEL_THEME.border } },
        bottom: { style: 'thin', color: { argb: EXCEL_THEME.border } },
        right: { style: 'thin', color: { argb: EXCEL_THEME.border } }
      };
    });

    const statusColumnIndexes = headers
      .map((header, index) => (/estado/i.test(header) ? index + 1 : -1))
      .filter((index) => index > 0);

    for (let rowNumber = headerRowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      const useMuted = rowNumber % 2 === 0;

      row.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 10, color: { argb: EXCEL_THEME.text } };
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: EXCEL_THEME.border } },
          left: { style: 'thin', color: { argb: EXCEL_THEME.border } },
          bottom: { style: 'thin', color: { argb: EXCEL_THEME.border } },
          right: { style: 'thin', color: { argb: EXCEL_THEME.border } }
        };

        if (useMuted) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: EXCEL_THEME.mutedRow }
          };
        }
      });

      statusColumnIndexes.forEach((columnIndex) => {
        const statusCell = row.getCell(columnIndex);
        const status = String(statusCell.value ?? '').toUpperCase();

        if (status.includes('APROB')) {
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_THEME.success } };
          statusCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: EXCEL_THEME.white } };
        } else if (status.includes('PEND')) {
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_THEME.warning } };
          statusCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: EXCEL_THEME.white } };
        } else if (status.includes('RECHAZ')) {
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_THEME.danger } };
          statusCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: EXCEL_THEME.white } };
        }
      });
    }

    worksheet.views = [{ state: 'frozen', ySplit: headerRowNumber }];
    worksheet.autoFilter = {
      from: { row: headerRowNumber, column: 1 },
      to: { row: headerRowNumber, column: Math.max(headers.length, 1) }
    };
    autoFitColumns(worksheet);
  };

  const addStyledTableSheet = (
    workbook: Workbook,
    sheetName: string,
    title: string,
    rows: Array<Record<string, unknown>>
  ) => {
    const worksheet = workbook.addWorksheet(sheetName);
    const headers = rows.length > 0 ? Object.keys(rows[0]) : ['Detalle'];
    const totalColumns = headers.length;

    applySheetHeader(worksheet, title, totalColumns);

    const headerRowNumber = 3;
    worksheet.addRow(headers);

    if (rows.length === 0) {
      worksheet.addRow(['Sin datos para los filtros seleccionados']);
      worksheet.mergeCells(4, 1, 4, Math.max(totalColumns, 1));
      const emptyCell = worksheet.getCell(4, 1);
      emptyCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: EXCEL_THEME.text } };
      emptyCell.alignment = { horizontal: 'center', vertical: 'middle' };
    } else {
      rows.forEach((rowData) => {
        const rowValues = headers.map((header) => rowData[header] ?? '');
        worksheet.addRow(rowValues);
      });
    }

    applyTableFormat(worksheet, headerRowNumber, headers);
  };

  const generateExcelReport = (data: Record<string, unknown>, tipo: string): Workbook => {
    const workbook = new Workbook();
    workbook.creator = 'Sistema de Revisión de Calidad';
    workbook.created = new Date();
    workbook.modified = new Date();

    if (tipo === 'revisiones_evento' && (data as { evento?: unknown }).evento) {
      const evento = (data as {
        evento: { nombre: string; idEvento: string; descripcion?: string; fechaEvento?: string; estado: string };
      }).evento;

      const eventoSheet = workbook.addWorksheet('Información Evento');
      applySheetHeader(eventoSheet, 'INFORMACIÓN DEL EVENTO', 2);
      eventoSheet.addRow(['Campo', 'Valor']);
      eventoSheet.addRow(['Evento', evento.nombre]);
      eventoSheet.addRow(['ID Evento', evento.idEvento]);
      eventoSheet.addRow(['Descripción', evento.descripcion || 'N/A']);
      eventoSheet.addRow(['Fecha Evento', evento.fechaEvento || 'N/A']);
      eventoSheet.addRow(['Estado', evento.estado]);
      eventoSheet.addRow(['Fecha Generación', formatDate(new Date().toISOString())]);
      eventoSheet.addRow(['Hora Generación', new Date().toLocaleTimeString('es-ES')]);
      applyTableFormat(eventoSheet, 3, ['Campo', 'Valor']);

      const revisiones = (data as { revisiones?: Array<Record<string, unknown>> }).revisiones;
      if (revisiones && revisiones.length > 0) {
        const revisionesData = revisiones.map((revision: Record<string, unknown>) => {
          const resultados = (revision.resultados as Record<string, unknown>) || {};
          const totalParametros = Object.keys(resultados).length;
          const parametrosCumplidos = Object.values(resultados).filter((result) => normalizeCumpleValue(result) === true).length;

          return {
            'Área': (revision.area as { nombre?: string })?.nombre || 'N/A',
            'Fecha Revisión': formatDate(revision.fechaRevision as string),
            'Estado': ((revision.estado as string) || '').toUpperCase(),
            'Aprobado Por': (revision.aprobadoPor as string) || 'N/A',
            'Fecha Aprobación': revision.fechaAprobacion ? formatDate(revision.fechaAprobacion as string) : 'N/A',
            'Comentarios Generales': (revision.comentarios as string) || 'N/A',
            'Total Parámetros': totalParametros,
            'Parámetros Cumplidos': parametrosCumplidos,
            'Parámetros No Cumplidos': Math.max(totalParametros - parametrosCumplidos, 0),
            '% Cumplimiento': totalParametros > 0 ? `${((parametrosCumplidos / totalParametros) * 100).toFixed(1)}%` : '0.0%'
          };
        });

        addStyledTableSheet(workbook, 'Resumen Revisiones', 'RESUMEN DE REVISIONES', revisionesData);

        const parametrosDetallados: Array<Record<string, unknown>> = [];
        revisiones.forEach((revision: Record<string, unknown>) => {
          const area = revision.area as { nombre?: string };
          const resultados = (revision.resultados as Record<string, unknown>) || {};
          const parametros = (revision.parametros as Array<{
            id: string;
            nombre: string;
            descripcion?: string;
            valorEsperado?: string;
            unidadMedida?: string;
          }>) || [];

          parametros.forEach((param) => {
            const detalle = getDetalleResultado(resultados[param.id]);
            parametrosDetallados.push({
              'Área': area?.nombre || 'N/A',
              'Fecha Revisión': formatDate(revision.fechaRevision as string),
              'Estado Revisión': ((revision.estado as string) || '').toUpperCase(),
              'Parámetro': param.nombre,
              'Descripción Parámetro': param.descripcion || 'N/A',
              'Valor Esperado': param.valorEsperado || 'N/A',
              'Unidad de Medida': param.unidadMedida || 'N/A',
              'Valor Obtenido': detalle.valor,
              'Cumple Estándar': detalle.cumple,
              'Comentarios Parámetro': detalle.comentarios,
              'Evaluado Por': (revision.aprobadoPor as string) || 'N/A',
              'Evidencias': Array.isArray(revision.evidencias) && (revision.evidencias as string[]).length > 0
                ? (revision.evidencias as string[]).join(' | ')
                : ''
            });
          });
        });

        if (parametrosDetallados.length > 0) {
          addStyledTableSheet(workbook, 'Parámetros Detallados', 'PARÁMETROS DETALLADOS', parametrosDetallados);
        }

        const estadisticas = {
          totalRevisiones: revisiones.length,
          aprobadas: revisiones.filter((r) => r.estado === 'aprobado').length,
          pendientes: revisiones.filter((r) => r.estado === 'pendiente').length,
          rechazadas: revisiones.filter((r) => r.estado === 'rechazado').length,
          totalParametros: parametrosDetallados.length,
          parametrosCumplen: parametrosDetallados.filter((p) => p['Cumple Estándar'] === 'SÍ').length,
          parametrosNoCumplen: parametrosDetallados.filter((p) => p['Cumple Estándar'] === 'NO').length
        };

        const estadisticasRows = [
          {
            'Métrica': 'Total de Revisiones',
            'Valor': estadisticas.totalRevisiones,
            'Porcentaje': '100.0%'
          },
          {
            'Métrica': 'Revisiones Aprobadas',
            'Valor': estadisticas.aprobadas,
            'Porcentaje': `${((estadisticas.aprobadas / estadisticas.totalRevisiones) * 100).toFixed(1)}%`
          },
          {
            'Métrica': 'Revisiones Pendientes',
            'Valor': estadisticas.pendientes,
            'Porcentaje': `${((estadisticas.pendientes / estadisticas.totalRevisiones) * 100).toFixed(1)}%`
          },
          {
            'Métrica': 'Revisiones Rechazadas',
            'Valor': estadisticas.rechazadas,
            'Porcentaje': `${((estadisticas.rechazadas / estadisticas.totalRevisiones) * 100).toFixed(1)}%`
          },
          {
            'Métrica': 'Total de Parámetros Evaluados',
            'Valor': estadisticas.totalParametros,
            'Porcentaje': estadisticas.totalParametros > 0 ? '100.0%' : '0.0%'
          },
          {
            'Métrica': 'Parámetros que Cumplen',
            'Valor': estadisticas.parametrosCumplen,
            'Porcentaje': estadisticas.totalParametros > 0
              ? `${((estadisticas.parametrosCumplen / estadisticas.totalParametros) * 100).toFixed(1)}%`
              : '0.0%'
          },
          {
            'Métrica': 'Parámetros que No Cumplen',
            'Valor': estadisticas.parametrosNoCumplen,
            'Porcentaje': estadisticas.totalParametros > 0
              ? `${((estadisticas.parametrosNoCumplen / estadisticas.totalParametros) * 100).toFixed(1)}%`
              : '0.0%'
          }
        ];

        addStyledTableSheet(workbook, 'Estadísticas', 'ESTADÍSTICAS DEL EVENTO', estadisticasRows);
      }
    } else if (tipo === 'verificaciones_calidad' || tipo === 'general') {
      const isGeneral = tipo === 'general';
      const revisiones = (data as { revisiones?: Array<Record<string, unknown>> }).revisiones;
      if (revisiones) {
        const verificacionesData = revisiones.map((revision: Record<string, unknown>) => {
          const metrics = getRevisionMetrics(revision);

          return {
            'Evento': (revision.evento as { nombre?: string })?.nombre || 'N/A',
            'ID Evento': (revision.evento as { idEvento?: string })?.idEvento || 'N/A',
            'Área': (revision.area as { nombre?: string })?.nombre || 'N/A',
            'Fecha Revisión': formatDate(revision.fechaRevision as string),
            'Estado': ((revision.estado as string) || '').toUpperCase(),
            [isGeneral ? 'Responsable Calidad' : 'Verificado Por']: (revision.aprobadoPor as string) || 'N/A',
            'Fecha Verificación': revision.fechaAprobacion ? formatDate(revision.fechaAprobacion as string) : 'N/A',
            'Comentarios Revisión': (revision.comentarios as string) || 'N/A',
            'Comentarios Calidad': (revision.comentariosCalidad as string) || 'Sin comentario de calidad',
            'Parámetros': metrics.resumenParametros,
            '% Cumplimiento': metrics.porcentajeCumplimiento
          };
        });

        addStyledTableSheet(
          workbook,
          isGeneral ? 'Resumen General' : 'Verificaciones de Calidad',
          isGeneral ? 'RESUMEN GENERAL DE REVISIONES' : 'VERIFICACIONES DE CALIDAD',
          verificacionesData
        );

        const parametrosDetallados: Array<Record<string, unknown>> = [];
        revisiones.forEach((revision: Record<string, unknown>) => {
          const evento = revision.evento as { nombre?: string };
          const area = revision.area as { nombre?: string };
          const resultados = (revision.resultados as Record<string, unknown>) || {};
          const parametros = (revision.parametros as Array<{
            id?: string;
            nombre?: string;
            descripcion?: string;
            valorEsperado?: string;
            unidadMedida?: string;
          }>) || [];

          parametros.forEach((param) => {
            const detalle = getDetalleResultado(resultados[param.id as string]);
            parametrosDetallados.push({
              'Evento': evento?.nombre || 'N/A',
              'Área': area?.nombre || 'N/A',
              'Fecha Revisión': formatDate(revision.fechaRevision as string),
              'Estado Revisión': ((revision.estado as string) || '').toUpperCase(),
              'Parámetro': param.nombre,
              'Descripción Parámetro': param.descripcion || 'N/A',
              'Valor Esperado': param.valorEsperado || 'N/A',
              'Unidad de Medida': param.unidadMedida || 'N/A',
              'Valor Obtenido': detalle.valor,
              'Cumple Estándar': detalle.cumple,
              'Comentarios Parámetro': detalle.comentarios,
              'Evaluado Por': (revision.aprobadoPor as string) || 'N/A',
              'Evidencias': Array.isArray(revision.evidencias) && (revision.evidencias as string[]).length > 0
                ? (revision.evidencias as string[]).join(' | ')
                : ''
            });
          });
        });

        if (parametrosDetallados.length > 0) {
          addStyledTableSheet(workbook, 'Parámetros Detallados', 'PARÁMETROS DETALLADOS', parametrosDetallados);
        }

        const stats = {
          total: revisiones.length,
          aprobadas: revisiones.filter((r) => r.estado === 'aprobado').length,
          pendientes: revisiones.filter((r) => r.estado === 'pendiente').length,
          rechazadas: revisiones.filter((r) => r.estado === 'rechazado').length
        };

        const statsRows = [
          { 'Métrica': isGeneral ? 'Total de Revisiones' : 'Total de Verificaciones', 'Valor': stats.total, 'Porcentaje': '100.0%' },
          {
            'Métrica': isGeneral ? 'Revisiones Aprobadas' : 'Verificaciones Aprobadas',
            'Valor': stats.aprobadas,
            'Porcentaje': stats.total > 0 ? `${((stats.aprobadas / stats.total) * 100).toFixed(1)}%` : '0.0%'
          },
          {
            'Métrica': isGeneral ? 'Revisiones Pendientes' : 'Verificaciones Pendientes',
            'Valor': stats.pendientes,
            'Porcentaje': stats.total > 0 ? `${((stats.pendientes / stats.total) * 100).toFixed(1)}%` : '0.0%'
          },
          {
            'Métrica': isGeneral ? 'Revisiones Rechazadas' : 'Verificaciones Rechazadas',
            'Valor': stats.rechazadas,
            'Porcentaje': stats.total > 0 ? `${((stats.rechazadas / stats.total) * 100).toFixed(1)}%` : '0.0%'
          }
        ];

        addStyledTableSheet(
          workbook,
          'Estadísticas',
          isGeneral ? 'ESTADÍSTICAS DEL RESUMEN GENERAL' : 'ESTADÍSTICAS DE VERIFICACIONES',
          statsRows
        );
      }
    }

    return workbook;
  };

  const handleGenerateReport = async (formato: 'pdf' | 'excel') => {
    if (filtros.tipoReporte === 'revisiones_evento' && !filtros.idEvento) {
      showError('Por favor seleccione un evento para generar el reporte');
      return;
    }

    setIsGenerating(true);
    try {
      let data: Record<string, unknown> = {};
      let nombreArchivo = '';

      if (filtros.tipoReporte === 'revisiones_evento') {
        data = await dbService.getReporteRevisionesPorEvento(filtros.idEvento!);
        const evento = eventos.find(e => e.id === filtros.idEvento);
        nombreArchivo = `reporte_evento_${evento?.idEvento || 'unknown'}_${new Date().toISOString().split('T')[0]}`;
      } else if (filtros.tipoReporte === 'verificaciones_calidad') {
        data = await dbService.getReporteVerificacionesCalidad({
          fechaDesde: filtros.fechaDesde,
          fechaHasta: filtros.fechaHasta,
          estado: filtros.estado === 'todos' ? undefined : filtros.estado
        });
        nombreArchivo = `reporte_verificaciones_${new Date().toISOString().split('T')[0]}`;
      } else if (filtros.tipoReporte === 'aprobaciones_pendientes') {
        // Obtener revisiones pendientes y enriquecer con área
        const pendientes = await dbService.getRevisionesPendientes();
        const areas = await dbService.getAreas();
        const enriched = (pendientes || []).map(p => ({
          ...p,
          area: areas.find(a => a.id === p.idArea) || { id: p.idArea, nombre: 'N/A' }
        }));
        data = { revisiones: enriched } as Record<string, unknown>;
        // Usaremos el layout de verificaciones de calidad para este tipo
        nombreArchivo = `aprobaciones_pendientes_${new Date().toISOString().split('T')[0]}`;
      } else if (filtros.tipoReporte === 'general') {
        data = await dbService.getReporteResumenGeneral({
          fechaDesde: filtros.fechaDesde,
          fechaHasta: filtros.fechaHasta,
          estado: filtros.estado === 'todos' ? undefined : filtros.estado
        });
        nombreArchivo = `reporte_general_${new Date().toISOString().split('T')[0]}`;
      }

      if (formato === 'pdf') {
        // Para aprobaciones pendientes reutilizamos el layout de verificaciones
        const tipoParaGenerar = filtros.tipoReporte === 'aprobaciones_pendientes' ? 'verificaciones_calidad' : filtros.tipoReporte;
        const doc = await generatePDFReport(data, tipoParaGenerar);
        (doc as jsPDF).save(`${nombreArchivo}.pdf`);
      } else {
        const tipoParaGenerarExcel = filtros.tipoReporte === 'aprobaciones_pendientes' ? 'verificaciones_calidad' : filtros.tipoReporte;
        const wb = generateExcelReport(data, tipoParaGenerarExcel);
        const excelBuffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `${nombreArchivo}.xlsx`);
      }

      // Guardar registro del reporte generado
      const reporteData: Omit<Reporte, 'id'> = {
        tipo: filtros.tipoReporte,
        nombre: nombreArchivo,
        fechaGeneracion: new Date().toISOString(),
        filtros: {
          ...filtros,
          nombreEvento: filtros.idEvento ? eventos.find(e => e.id === filtros.idEvento)?.nombre : undefined
        },
        generadoPor: 'current-user', // TODO: Obtener del contexto de autenticación
        datosReporte: data
      };

      await dbService.createReporte(reporteData);
      await loadData(); // Recargar lista de reportes

      showSuccess(`Reporte ${formato.toUpperCase()} generado correctamente`);
    } catch (error) {
      console.error('Error generating report:', error);
      showError('Error al generar el reporte: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full w-full bg-background overflow-auto">
        <div className="p-4 lg:p-6 space-y-6 min-h-full">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="p-4 lg:p-6 space-y-6 min-h-full">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-background border border-border/50 rounded-lg p-4 lg:p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Reportes
              </h1>
              <p className="text-muted-foreground mt-2 text-sm lg:text-base">
                Generación y exportación de reportes en PDF y Excel
              </p>
            </div>
          </div>
        </div>

        {/* Configuración de Filtros */}
        <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Configuración del Reporte</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Tipo de Reporte */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Tipo de Reporte</Label>
              <Select 
                value={filtros.tipoReporte} 
                onValueChange={(value: string) => setFiltros(prev => ({ 
                  ...prev, 
                  tipoReporte: value as FiltrosReporte['tipoReporte'],
                  idEvento: undefined // Limpiar evento al cambiar tipo
                }))}
              >
                <SelectTrigger className="border-border/50 focus:border-primary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revisiones_evento">Revisiones por Evento</SelectItem>
                  <SelectItem value="verificaciones_calidad">Verificaciones de Calidad</SelectItem>
                  <SelectItem value="aprobaciones_pendientes">Aprobaciones Pendientes</SelectItem>
                  <SelectItem value="general">Resumen General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Selección de Evento (solo para tipo revisiones_evento) */}
            {filtros.tipoReporte === 'revisiones_evento' && (
              <div className="md:col-span-2">
                <Label className="text-sm font-medium mb-2 block">Buscar y Seleccionar Evento</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar eventos por nombre o ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-border/50 focus:border-primary/50"
                      />
                    </div>
                    {searchTerm && (
                      <Button 
                        onClick={() => setSearchTerm('')}
                        variant="outline"
                        size="sm"
                        className="border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Select 
                    value={filtros.idEvento || ''} 
                    onValueChange={(value) => setFiltros(prev => ({ ...prev, idEvento: value }))}
                  >
                    <SelectTrigger className="border-border/50 focus:border-primary/50">
                      <SelectValue placeholder="Seleccione un evento..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredEventos.length === 0 ? (
                        <SelectItem value="no-eventos" disabled>
                          {searchTerm ? 'No se encontraron eventos' : 'No hay eventos disponibles'}
                        </SelectItem>
                      ) : (
                        filteredEventos.map((evento) => (
                          <SelectItem key={evento.id} value={evento.id}>
                            {evento.nombre}
                            <span className="text-xs text-muted-foreground ml-2">
                              (ID: {evento.idEvento})
                            </span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Filtros de Fecha */}
            {(filtros.tipoReporte === 'verificaciones_calidad' || filtros.tipoReporte === 'general') && (
              <>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Fecha Desde</Label>
                  <Input
                    type="date"
                    value={filtros.fechaDesde || ''}
                    onChange={(e) => setFiltros(prev => ({ ...prev, fechaDesde: e.target.value }))}
                    className="border-border/50 focus:border-primary/50"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Fecha Hasta</Label>
                  <Input
                    type="date"
                    value={filtros.fechaHasta || ''}
                    onChange={(e) => setFiltros(prev => ({ ...prev, fechaHasta: e.target.value }))}
                    className="border-border/50 focus:border-primary/50"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Estado</Label>
                  <Select 
                    value={filtros.estado || 'todos'} 
                    onValueChange={(value: 'todos' | 'pendiente' | 'aprobado' | 'rechazado') => setFiltros(prev => ({ ...prev, estado: value }))}
                  >
                    <SelectTrigger className="border-border/50 focus:border-primary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los Estados</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="aprobado">Aprobado</SelectItem>
                      <SelectItem value="rechazado">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Botones de Generación */}
        <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
            <div>
              <h3 className="text-lg font-semibold mb-1">Generar Reporte</h3>
              <p className="text-sm text-muted-foreground">
                Exporte los datos en formato PDF o Excel
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => handleGenerateReport('pdf')}
                disabled={isGenerating || (filtros.tipoReporte === 'revisiones_evento' && !filtros.idEvento)}
                className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg font-semibold"
              >
                <FileText className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generando...' : 'Exportar PDF'}
              </Button>
              <Button
                onClick={() => handleGenerateReport('excel')}
                disabled={isGenerating || (filtros.tipoReporte === 'revisiones_evento' && !filtros.idEvento)}
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg font-semibold"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generando...' : 'Exportar Excel'}
              </Button>
            </div>
          </div>
        </div>

        {/* Vista previa de datos que se exportarán */}
        <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Download className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Vista previa de datos para el reporte</h2>
          </div>

          {isPreviewLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : previewData && previewData.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Evento</TableHead>
                    <TableHead className="font-semibold">Área</TableHead>
                    <TableHead className="font-semibold">Fecha Revisión</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold">Verificado Por</TableHead>
                    <TableHead className="font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPreviewData.length > 0 ? (
                    paginatedPreviewData.map((rev, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{getEventoNombre(rev)}</TableCell>
                        <TableCell>{(rev.area as { nombre?: string })?.nombre || 'N/A'}</TableCell>
                        <TableCell>{rev.fechaRevision ? formatDate(rev.fechaRevision as string) : 'N/A'}</TableCell>
                        <TableCell>{(rev.estado as string) || 'N/A'}</TableCell>
                        <TableCell>{(rev.aprobadoPor as string) || 'N/A'}</TableCell>
                        <TableCell>
                          {isAdmin ? (
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={async () => {
                                const confirm = window.confirm('¿Eliminar esta revisión? Esta acción no se puede deshacer.');
                                if (!confirm) return;
                                try {
                                  const revId = rev.id as string | undefined;
                                  if (!revId) throw new Error('ID de revisión no disponible');
                                  await dbService.deleteRevision(revId);
                                  showSuccess('Revisión eliminada');
                                  // Refrescar preview recargando los filtros
                                  setIsPreviewLoading(true);
                                  try {
                                    if (filtros.tipoReporte === 'revisiones_evento' && filtros.idEvento) {
                                      const data = await dbService.getReporteRevisionesPorEvento(filtros.idEvento);
                                      setPreviewData(((data.revisiones as unknown) as Array<Record<string, unknown>>) || []);
                                    } else if (filtros.tipoReporte === 'verificaciones_calidad') {
                                      const res = await dbService.getReporteVerificacionesCalidad({
                                        fechaDesde: filtros.fechaDesde,
                                        fechaHasta: filtros.fechaHasta,
                                        estado: filtros.estado === 'todos' ? undefined : filtros.estado
                                      });
                                      setPreviewData(((res.revisiones as unknown) as Array<Record<string, unknown>>) || []);
                                    } else if (filtros.tipoReporte === 'general') {
                                      const res = await dbService.getReporteResumenGeneral({
                                        fechaDesde: filtros.fechaDesde,
                                        fechaHasta: filtros.fechaHasta,
                                        estado: filtros.estado === 'todos' ? undefined : filtros.estado
                                      });
                                      setPreviewData(((res.revisiones as unknown) as Array<Record<string, unknown>>) || []);
                                    }
                                  } catch (err) {
                                    console.error('Error refrescando preview:', err);
                                  } finally {
                                    setIsPreviewLoading(false);
                                  }
                                } catch (error) {
                                  console.error('Error eliminando revisión:', error);
                                  showError('Error al eliminar la revisión');
                                }
                              }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6}>No hay datos para mostrar</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando {previewRangeStart}-{previewRangeEnd} de {totalPreviewRows} resultados
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewPage(prev => Math.max(prev - 1, 1))}
                    disabled={previewPage <= 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    Página {previewPage} de {totalPreviewPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewPage(prev => Math.min(prev + 1, totalPreviewPages))}
                    disabled={previewPage >= totalPreviewPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 space-y-2">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No hay datos para la vista previa con los filtros seleccionados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reportes;
