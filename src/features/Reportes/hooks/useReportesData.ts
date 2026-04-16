import { useState, useEffect, useCallback, useMemo } from 'react';
import { DatabaseService } from '@/services/database';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import type { Evento, Reporte } from '@/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Workbook, type Worksheet } from 'exceljs';
import { saveAs } from 'file-saver';
import type { AutoTableOptions, FiltrosReporte } from '../lib/reportes.types';
import { ensureAutoTable, type AutoTableFunction } from '../lib/reportes-utils';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => void;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

export const useReportesData = () => {
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

  const formatMonthShort = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', { month: 'short', year: '2-digit' }).format(date);
  };

  const getGeneralDashboardData = (revisiones: Array<Record<string, unknown>>) => {
    const statusCounts = {
      aprobadas: revisiones.filter((r) => r.estado === 'aprobado').length,
      pendientes: revisiones.filter((r) => r.estado === 'pendiente').length,
      rechazadas: revisiones.filter((r) => r.estado === 'rechazado').length
    };

    let totalParametros = 0;
    let parametrosCumplidos = 0;

    revisiones.forEach((revision) => {
      const metrics = getRevisionMetrics(revision);
      totalParametros += metrics.totalParametros;
      parametrosCumplidos += metrics.parametrosCumplidos;
    });

    const cumplimientoGlobal = totalParametros > 0
      ? Number(((parametrosCumplidos / totalParametros) * 100).toFixed(1))
      : 0;

    const areaMap = new Map<string, number>();
    revisiones.forEach((revision) => {
      const areaName = (revision.area as { nombre?: string })?.nombre || 'Sin área';
      areaMap.set(areaName, (areaMap.get(areaName) || 0) + 1);
    });

    const topAreas = Array.from(areaMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const monthMap = new Map<string, { date: Date; count: number }>();
    revisiones.forEach((revision) => {
      if (!revision.fechaRevision) return;
      const date = new Date(revision.fechaRevision as string);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = monthMap.get(key);
      if (current) {
        current.count += 1;
      } else {
        monthMap.set(key, { date: new Date(date.getFullYear(), date.getMonth(), 1), count: 1 });
      }
    });

    const monthlyTrend = Array.from(monthMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-6)
      .map((item) => ({ label: formatMonthShort(item.date), value: item.count }));

    const comentariosCalidad = revisiones.filter((r) => String(r.comentariosCalidad || '').trim().length > 0).length;

    return {
      totalRevisiones: revisiones.length,
      statusCounts,
      cumplimientoGlobal,
      totalParametros,
      parametrosCumplidos,
      comentariosCalidad,
      topAreas,
      monthlyTrend
    };
  };

  const createCanvas = (width: number, height: number) => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return { canvas, ctx };
  };

  const createDoughnutChartDataUrl = (
    title: string,
    items: Array<{ label: string; value: number; color: string }>,
    width = 760,
    height = 420
  ): string | null => {
    const setup = createCanvas(width, height);
    if (!setup) return null;
    const { canvas, ctx } = setup;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(title, 28, 44);

    const total = items.reduce((sum, item) => sum + item.value, 0);
    const centerX = 230;
    const centerY = 230;
    const outerRadius = 130;
    const innerRadius = 72;

    let startAngle = -Math.PI / 2;
    items.forEach((item) => {
      const ratio = total > 0 ? item.value / total : 0;
      const slice = ratio * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + slice);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();
      startAngle += slice;
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 34px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(String(total), centerX, centerY + 12);
    ctx.font = '14px Arial';
    ctx.fillText('Revisiones', centerX, centerY + 36);
    ctx.textAlign = 'left';

    let legendY = 115;
    items.forEach((item) => {
      const percentage = total > 0 ? `${((item.value / total) * 100).toFixed(1)}%` : '0.0%';
      ctx.fillStyle = item.color;
      ctx.fillRect(430, legendY - 12, 18, 18);
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 18px Arial';
      ctx.fillText(item.label, 458, legendY + 2);
      ctx.font = '16px Arial';
      ctx.fillStyle = '#475569';
      ctx.fillText(`${item.value} (${percentage})`, 610, legendY + 2);
      legendY += 56;
    });

    return canvas.toDataURL('image/png');
  };

  const createBarChartDataUrl = (
    title: string,
    items: Array<{ label: string; value: number }>,
    color: string,
    width = 760,
    height = 420
  ): string | null => {
    const setup = createCanvas(width, height);
    if (!setup) return null;
    const { canvas, ctx } = setup;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(title, 28, 44);

    if (items.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '20px Arial';
      ctx.fillText('Sin datos disponibles', 28, 110);
      return canvas.toDataURL('image/png');
    }

    const maxValue = Math.max(...items.map((item) => item.value), 1);
    const chartLeft = 210;
    const chartTop = 88;
    const chartWidth = 520;
    const barHeight = 34;
    const barGap = 18;

    items.forEach((item, index) => {
      const y = chartTop + index * (barHeight + barGap);
      const barWidth = (item.value / maxValue) * chartWidth;

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(chartLeft, y, chartWidth, barHeight);
      ctx.fillStyle = color;
      ctx.fillRect(chartLeft, y, barWidth, barHeight);

      ctx.fillStyle = '#0f172a';
      ctx.font = '15px Arial';
      ctx.fillText(item.label.length > 28 ? `${item.label.slice(0, 28)}...` : item.label, 22, y + 22);

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 15px Arial';
      ctx.fillText(String(item.value), chartLeft + barWidth + 8, y + 22);
    });

    return canvas.toDataURL('image/png');
  };

  const createLineChartDataUrl = (
    title: string,
    items: Array<{ label: string; value: number }>,
    lineColor: string,
    width = 940,
    height = 440
  ): string | null => {
    const setup = createCanvas(width, height);
    if (!setup) return null;
    const { canvas, ctx } = setup;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(title, 28, 44);

    if (items.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '20px Arial';
      ctx.fillText('Sin tendencia disponible', 28, 110);
      return canvas.toDataURL('image/png');
    }

    const chartLeft = 80;
    const chartTop = 90;
    const chartWidth = width - 130;
    const chartHeight = 280;
    const maxValue = Math.max(...items.map((item) => item.value), 1);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i += 1) {
      const y = chartTop + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartLeft + chartWidth, y);
      ctx.stroke();
    }

    const getX = (index: number) => chartLeft + (index * chartWidth) / Math.max(items.length - 1, 1);
    const getY = (value: number) => chartTop + chartHeight - (value / maxValue) * chartHeight;

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    items.forEach((item, index) => {
      const x = getX(index);
      const y = getY(item.value);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    items.forEach((item, index) => {
      const x = getX(index);
      const y = getY(item.value);

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, x, chartTop + chartHeight + 24);
      ctx.fillText(String(item.value), x, y - 12);
    });

    ctx.textAlign = 'left';
    return canvas.toDataURL('image/png');
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

        if (isGeneral) {
          const dashboard = getGeneralDashboardData(revisiones);

          checkPageBreak(145);
          doc.setFillColor(...COLORS.secondary);
          doc.roundedRect(MARGIN, currentY - 6, CONTENT_WIDTH, 10, 2, 2, 'F');
          doc.setTextColor(...COLORS.secondaryForeground);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text('ANÁLISIS VISUAL DEL DESEMPEÑO', MARGIN + 4, currentY);
          doc.setTextColor(...COLORS.neutralText);
          currentY += 14;

          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(
            `Cumplimiento global de parámetros: ${dashboard.cumplimientoGlobal.toFixed(1)}% (${dashboard.parametrosCumplidos}/${dashboard.totalParametros})`,
            MARGIN,
            currentY
          );
          currentY += 8;
          doc.text(
            `Revisiones con comentario de calidad: ${dashboard.comentariosCalidad}/${dashboard.totalRevisiones}`,
            MARGIN,
            currentY
          );
          currentY += 8;

          const statusChart = createDoughnutChartDataUrl('Distribución por estado', [
            { label: 'Aprobadas', value: dashboard.statusCounts.aprobadas, color: '#16a34a' },
            { label: 'Pendientes', value: dashboard.statusCounts.pendientes, color: '#f59e0b' },
            { label: 'Rechazadas', value: dashboard.statusCounts.rechazadas, color: '#ef4444' }
          ]);

          const topAreasChart = createBarChartDataUrl(
            'Top áreas con mayor volumen',
            dashboard.topAreas,
            '#273c2a'
          );

          const trendChart = createLineChartDataUrl(
            'Tendencia mensual de revisiones (últimos periodos)',
            dashboard.monthlyTrend,
            '#273c2a'
          );

          if (statusChart && topAreasChart) {
            checkPageBreak(70);
            doc.addImage(statusChart, 'PNG', MARGIN, currentY, (CONTENT_WIDTH - 6) / 2, 64);
            doc.addImage(topAreasChart, 'PNG', MARGIN + (CONTENT_WIDTH - 6) / 2 + 6, currentY, (CONTENT_WIDTH - 6) / 2, 64);
            currentY += 72;
          }

          if (trendChart) {
            checkPageBreak(60);
            doc.addImage(trendChart, 'PNG', MARGIN, currentY, CONTENT_WIDTH, 56);
            currentY += 64;
          }
        }

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

  const addGeneralDashboardSheet = (
    workbook: Workbook,
    revisiones: Array<Record<string, unknown>>
  ) => {
    const worksheet = workbook.addWorksheet('Dashboard General');
    applySheetHeader(worksheet, 'DASHBOARD - RESUMEN GENERAL', 16);

    for (let column = 1; column <= 16; column += 1) {
      worksheet.getColumn(column).width = 13;
    }

    const dashboard = getGeneralDashboardData(revisiones);
    const cumplimiento = dashboard.totalParametros > 0
      ? `${dashboard.cumplimientoGlobal.toFixed(1)}%`
      : '0.0%';
    const porcentajeComentarios = dashboard.totalRevisiones > 0
      ? `${((dashboard.comentariosCalidad / dashboard.totalRevisiones) * 100).toFixed(1)}%`
      : '0.0%';

    worksheet.getCell('A4').value = 'KPI';
    worksheet.getCell('B4').value = 'VALOR';
    worksheet.getCell('C4').value = 'DETALLE';
    worksheet.getCell('D4').value = 'IMPACTO';

    ['A4', 'B4', 'C4', 'D4'].forEach((cellRef) => {
      const cell = worksheet.getCell(cellRef);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: EXCEL_THEME.primary }
      };
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: EXCEL_THEME.white } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: EXCEL_THEME.border } },
        left: { style: 'thin', color: { argb: EXCEL_THEME.border } },
        bottom: { style: 'thin', color: { argb: EXCEL_THEME.border } },
        right: { style: 'thin', color: { argb: EXCEL_THEME.border } }
      };
    });

    const kpiRows = [
      ['Total de revisiones', dashboard.totalRevisiones, 'Cobertura del periodo filtrado', 'Control de volumen'],
      ['Cumplimiento global', cumplimiento, `${dashboard.parametrosCumplidos}/${dashboard.totalParametros} parámetros conformes`, 'Calidad operativa'],
      ['Comentarios de calidad', dashboard.comentariosCalidad, `${porcentajeComentarios} de revisiones con feedback`, 'Trazabilidad y mejora']
    ];

    kpiRows.forEach((row, index) => {
      const rowNumber = 5 + index;
      worksheet.getCell(`A${rowNumber}`).value = row[0];
      worksheet.getCell(`B${rowNumber}`).value = row[1];
      worksheet.getCell(`C${rowNumber}`).value = row[2];
      worksheet.getCell(`D${rowNumber}`).value = row[3];

      ['A', 'B', 'C', 'D'].forEach((column) => {
        const cell = worksheet.getCell(`${column}${rowNumber}`);
        cell.font = { name: 'Arial', size: 10, color: { argb: EXCEL_THEME.text } };
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: rowNumber % 2 === 0 ? EXCEL_THEME.mutedRow : EXCEL_THEME.white }
        };
        cell.border = {
          top: { style: 'thin', color: { argb: EXCEL_THEME.border } },
          left: { style: 'thin', color: { argb: EXCEL_THEME.border } },
          bottom: { style: 'thin', color: { argb: EXCEL_THEME.border } },
          right: { style: 'thin', color: { argb: EXCEL_THEME.border } }
        };
      });
    });

    worksheet.getCell('A10').value = 'Visuales automáticos';
    worksheet.getCell('A10').font = { name: 'Arial', size: 11, bold: true, color: { argb: EXCEL_THEME.primary } };

    const statusChart = createDoughnutChartDataUrl('Distribución por estado', [
      { label: 'Aprobadas', value: dashboard.statusCounts.aprobadas, color: '#16a34a' },
      { label: 'Pendientes', value: dashboard.statusCounts.pendientes, color: '#f59e0b' },
      { label: 'Rechazadas', value: dashboard.statusCounts.rechazadas, color: '#ef4444' }
    ]);

    const areasChart = createBarChartDataUrl(
      'Top áreas con mayor volumen',
      dashboard.topAreas,
      '#273c2a'
    );

    const trendChart = createLineChartDataUrl(
      'Tendencia mensual de revisiones (últimos periodos)',
      dashboard.monthlyTrend,
      '#273c2a',
      1100,
      420
    );

    if (statusChart) {
      const statusImageId = workbook.addImage({ base64: statusChart, extension: 'png' });
      worksheet.addImage(statusImageId, {
        tl: { col: 0, row: 10 },
        ext: { width: 460, height: 250 }
      });
    }

    if (areasChart) {
      const areasImageId = workbook.addImage({ base64: areasChart, extension: 'png' });
      worksheet.addImage(areasImageId, {
        tl: { col: 8, row: 10 },
        ext: { width: 460, height: 250 }
      });
    }

    if (trendChart) {
      const trendImageId = workbook.addImage({ base64: trendChart, extension: 'png' });
      worksheet.addImage(trendImageId, {
        tl: { col: 0, row: 24 },
        ext: { width: 920, height: 250 }
      });
    }

    const summaryStartRow = 39;
    worksheet.getCell(`A${summaryStartRow}`).value = 'ÁREA';
    worksheet.getCell(`B${summaryStartRow}`).value = 'REVISIONES';
    ['A', 'B'].forEach((column) => {
      const cell = worksheet.getCell(`${column}${summaryStartRow}`);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_THEME.secondary } };
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: EXCEL_THEME.text } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: EXCEL_THEME.border } },
        left: { style: 'thin', color: { argb: EXCEL_THEME.border } },
        bottom: { style: 'thin', color: { argb: EXCEL_THEME.border } },
        right: { style: 'thin', color: { argb: EXCEL_THEME.border } }
      };
    });

    const areasForTable = dashboard.topAreas.length > 0 ? dashboard.topAreas : [{ label: 'Sin datos', value: 0 }];
    areasForTable.forEach((item, index) => {
      const rowNumber = summaryStartRow + 1 + index;
      worksheet.getCell(`A${rowNumber}`).value = item.label;
      worksheet.getCell(`B${rowNumber}`).value = item.value;

      ['A', 'B'].forEach((column) => {
        const cell = worksheet.getCell(`${column}${rowNumber}`);
        cell.font = { name: 'Arial', size: 10, color: { argb: EXCEL_THEME.text } };
        cell.alignment = { vertical: 'middle' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: rowNumber % 2 === 0 ? EXCEL_THEME.mutedRow : EXCEL_THEME.white }
        };
        cell.border = {
          top: { style: 'thin', color: { argb: EXCEL_THEME.border } },
          left: { style: 'thin', color: { argb: EXCEL_THEME.border } },
          bottom: { style: 'thin', color: { argb: EXCEL_THEME.border } },
          right: { style: 'thin', color: { argb: EXCEL_THEME.border } }
        };
      });
    });
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
        if (isGeneral) {
          addGeneralDashboardSheet(workbook, revisiones);
        }

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


  const handleDeletePreviewRevision = async (rev: Record<string, unknown>) => {
    try {
      const revId = rev.id as string | undefined;
      if (!revId) {
        throw new Error('ID de revisión no disponible');
      }

      await dbService.deleteRevision(revId);
      showSuccess('Revisión eliminada');

      setFiltros((prev) => ({ ...prev }));
      await loadData();
    } catch (error) {
      console.error('Error eliminando revisión:', error);
      showError('Error al eliminar la revisión');
    }
  };

  return {
    filtros,
    setFiltros,
    searchTerm,
    setSearchTerm,
    isLoading,
    isGenerating,
    handleGenerateReport,
    isPreviewLoading,
    previewData,
    paginatedPreviewData,
    previewRangeStart,
    previewRangeEnd,
    totalPreviewRows,
    previewPage,
    setPreviewPage,
    totalPreviewPages,
    filteredEventos,
    formatDate,
    getEventoNombre,
    isAdmin,
    handleDeletePreviewRevision
  };
};
