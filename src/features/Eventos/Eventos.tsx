import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DatabaseService } from '@/services/database';
import { useToast } from '@/hooks/useToast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Evento } from '@/types';
import { Plus, Search, Edit, Trash2, Upload, Loader2, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as XLSX from 'xlsx';

const Eventos: React.FC = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);
  const [isSkillLoading, setIsSkillLoading] = useState(false);
  const [skillDate, setSkillDate] = useState({
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString()
  });
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    eventoId: '',
    eventoName: ''
  });
  const [formData, setFormData] = useState({
    idEvento: '',
    nombre: '',
  });

  const dbService = useMemo(() => new DatabaseService(), []);
  const { showSuccess, showError } = useToast();

  const loadEventos = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dbService.getEventos();
      setEventos(data);
    } catch (error) {
      console.error('Error loading eventos:', error);
      showError('Error al cargar los eventos: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [dbService, showError]);

  useEffect(() => {
    loadEventos();
  }, [loadEventos]);

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      const results = await dbService.searchEventos(searchTerm);
      setEventos(results);
    } else {
      await loadEventos();
    }
  };

  const handleCreate = async () => {
    // Validación
    if (!formData.idEvento || !formData.nombre.trim()) {
      showError('Por favor complete todos los campos');
      return;
    }

    setIsCreating(true);
    try {
      const eventoData = {
        idEvento: parseInt(formData.idEvento),
        nombre: formData.nombre.trim(),
        fechaCreacion: new Date().toISOString(),
        estado: 'activo' as const,
      };
      
      const newEventoId = await dbService.createEvento(eventoData);
      
      // Agregar el nuevo evento al estado local sin recargar
      const newEvento: Evento = {
        id: newEventoId,
        ...eventoData
      };
      setEventos(prev => [...prev, newEvento]);
      
      setIsDialogOpen(false);
      resetForm();
      showSuccess('Evento creado correctamente');
    } catch (error) {
      console.error('Error creating evento:', error);
      showError('Error al crear el evento: ' + (error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingEvento) return;
    
    // Validación
    if (!formData.idEvento || !formData.nombre.trim()) {
      showError('Por favor complete todos los campos');
      return;
    }

    try {
      const updatedData = {
        idEvento: parseInt(formData.idEvento),
        nombre: formData.nombre.trim(),
      };
      
      await dbService.updateEvento(editingEvento.id, updatedData);
      
      // Actualizar el estado local sin recargar
      setEventos(prev => prev.map(evento => 
        evento.id === editingEvento.id 
          ? { ...evento, ...updatedData }
          : evento
      ));
      
      setIsDialogOpen(false);
      setEditingEvento(null);
      resetForm();
      showSuccess('Evento actualizado correctamente');
    } catch (error) {
      console.error('Error updating evento:', error);
      showError('Error al actualizar el evento: ' + (error as Error).message);
    }
  };

  const handleDelete = (id: string, nombre: string) => {
    setConfirmDialog({
      isOpen: true,
      eventoId: id,
      eventoName: nombre
    });
  };

  const confirmDelete = async () => {
    try {
      await dbService.deleteEvento(confirmDialog.eventoId);
      
      // Remover el evento del estado local sin recargar
      setEventos(prev => prev.filter(evento => evento.id !== confirmDialog.eventoId));
      
      showSuccess('Evento eliminado correctamente');
    } catch (error) {
      console.error('Error deleting evento:', error);
      showError('Error al eliminar el evento: ' + (error as Error).message);
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      // defval:null para mantener claves aunque estén vacías
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null }) as Array<Record<string, unknown>>;

      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        showError('El archivo parece estar vacío o no tiene una hoja válida.');
        return;
      }

      // Normalizar cabeceras: mapear nombre original => normalizado (sin acentos, espacios ni caracteres especiales)
      const normalize = (s: unknown) => String(s ?? '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
      const headers = Object.keys(jsonData[0] || {}).map(h => ({ raw: h, norm: normalize(h) }));

      const findKey = (variants: string[]) => {
        for (const v of variants) {
          const normV = v.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
          const found = headers.find(h => h.norm === normV);
          if (found) return found.raw;
        }
        // fallback: buscar que contenga las palabras clave
        for (const h of headers) {
          if (variants.some(v => h.norm.includes(v.replace(/\s+/g, '').toLowerCase()))) return h.raw;
        }
        return undefined;
      };

      const idKey = findKey(['IDEvento', 'idEvento', 'idevento', 'ideventoid', 'id']);
      const nameKey = findKey(['Nombre', 'NombreEvento', 'nombre', 'evento', 'name']);

      if (!idKey || !nameKey) {
        const available = headers.map(h => h.raw).join(', ');
        showError(`No se encontraron columnas identificables. Columnas detectadas: ${available}. Asegúrese de incluir 'ID Evento' y 'Nombre'.`);
        return;
      }

      // Construir lista inicial y limpiar filas inválidas
      const parsedRows: Array<{ idEvento: number; nombre: string }> = [];
      for (const row of jsonData) {
        const raw = row as Record<string, unknown>;
        const rawId = raw[idKey];
        const nombreRaw = raw[nameKey];
        const idNum = Number(rawId);
        const idInt = Number.isFinite(idNum) ? Math.trunc(idNum) : NaN;
        const nombre = nombreRaw != null ? String(nombreRaw).trim() : '';
        if (!Number.isInteger(idInt) || !nombre) continue; // ignorar filas inválidas
        parsedRows.push({ idEvento: idInt, nombre });
      }

      if (parsedRows.length === 0) {
        showError('No se encontraron filas válidas en el archivo. Asegúrese de que exista la columna "ID Evento" y "Nombre" con valores válidos.');
        return;
      }

      // Eliminar duplicados dentro del archivo (mantener la primera aparición)
      const seenInFile = new Set<number>();
      const uniqueRows: Array<{ idEvento: number; nombre: string }> = [];
      for (const r of parsedRows) {
        if (!seenInFile.has(r.idEvento)) {
          seenInFile.add(r.idEvento);
          uniqueRows.push(r);
        }
      }

      // Obtener eventos existentes en la base de datos para evitar duplicados
      const existingEventos = await dbService.getEventos();
      const existingIds = new Set(existingEventos.map(e => Number(e.idEvento)));

      // Filtrar los que ya existen
      const toCreate = uniqueRows.filter(r => !existingIds.has(r.idEvento));
      const skippedExisting = uniqueRows.length - toCreate.length;

      if (toCreate.length === 0) {
        showError(`Ningún registro para importar; ${skippedExisting} fila(s) tenían ID ya existente.`);
        return;
      }

      // Preparar payload para import
      const eventosToImport = toCreate.map(r => ({
        idEvento: r.idEvento,
        nombre: r.nombre,
        fechaCreacion: new Date().toISOString(),
        estado: 'activo' as const,
      }));

      await dbService.importEventosFromExcel(eventosToImport);
      await loadEventos();
      showSuccess(`Importados ${eventosToImport.length} eventos. ${skippedExisting} fila(s) omitida(s) por duplicado.`);
    } catch (error) {
      console.error('Error importing Excel:', error);
      showError('Error al importar el archivo Excel');
    }
  };

  const handleImportSkill = async () => {
    setIsSkillLoading(true);
    try {
      const month = parseInt(skillDate.month);
      const year = parseInt(skillDate.year);
      
      const skillEvents = await dbService.getSkillEventsFromAPI(month, year);
      
      if (skillEvents.length === 0) {
        showError('No se encontraron eventos para el mes y año seleccionados');
        return;
      }

      // Obtener eventos existentes
      const existingEventos = await dbService.getEventos();
      const existingIds = new Set(existingEventos.map(e => Number(e.idEvento)));

      // Filtrar los que ya existen
      const toCreate = skillEvents.filter(r => !existingIds.has(r.idEvento));
      const skippedExisting = skillEvents.length - toCreate.length;

      if (toCreate.length === 0) {
        showError(`Ningún registro nuevo para importar; ${skippedExisting} evento(s) ya existían.`);
        setIsSkillDialogOpen(false);
        return;
      }

      // Preparar payload para import
      const eventosToImport = toCreate.map(r => ({
        idEvento: r.idEvento,
        nombre: r.nombre,
        fechaCreacion: new Date().toISOString(),
        estado: 'activo' as const,
      }));

      await dbService.importEventosFromExcel(eventosToImport);
      await loadEventos();
      showSuccess(`Importados ${eventosToImport.length} eventos de Skill. ${skippedExisting} omitido(s).`);
      setIsSkillDialogOpen(false);
    } catch (error) {
      console.error('Error importing from Skill API:', error);
      showError('Error al conectar con Skill API. Verifique su conexión o intente más tarde.');
    } finally {
      setIsSkillLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      idEvento: '',
      nombre: '',
    });
  };

  const openEditDialog = (evento: Evento) => {
    setEditingEvento(evento);
    setFormData({
      idEvento: evento.idEvento.toString(),
      nombre: evento.nombre,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingEvento(null);
    resetForm();
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="h-full w-full bg-background overflow-auto">
        <div className="p-4 lg:p-6 space-y-6 min-h-full">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="p-4 lg:p-6 space-y-6 min-h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 lg:p-6 border border-border/50">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Gestión de Eventos
            </h1>
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  {eventos.length} evento{eventos.length !== 1 ? 's' : ''}
                </span>
              </div>
            <p className="text-muted-foreground mt-2 text-sm lg:text-base">
              Administra los eventos del sistema de revisión de calidad
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={openCreateDialog}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg font-semibold"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Evento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md mx-auto">
                <DialogHeader>
                  <DialogTitle className="font-semibold">
                    {editingEvento ? 'Editar Evento' : 'Crear Nuevo Evento'}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="idEvento" className="text-right font-medium">
                      ID Evento
                    </Label>
                    <Input
                      id="idEvento"
                      type="number"
                      value={formData.idEvento}
                      onChange={(e) => setFormData({ ...formData, idEvento: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nombre" className="text-right font-medium">
                      Nombre
                    </Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={editingEvento ? handleUpdate : handleCreate}
                    disabled={isCreating}
                  >
                    {isCreating ? 'Guardando...' : (editingEvento ? 'Actualizar' : 'Crear')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <div>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                className="hidden"
                id="excel-upload"
              />
              <Button variant="outline" onClick={() => document.getElementById('excel-upload')?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Importar Excel
              </Button>
            </div>
            
            <Dialog open={isSkillDialogOpen} onOpenChange={setIsSkillDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="font-semibold shadow-sm">
                  <Globe className="mr-2 h-4 w-4" />
                  Cargar de Skill
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md mx-auto">
                <DialogHeader>
                  <DialogTitle className="font-semibold text-xl">
                    Sincronizar con Skill API
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-6">
                  <div className="space-y-2">
                    <Label htmlFor="month" className="text-sm font-medium">Mes</Label>
                    <Select 
                      value={skillDate.month} 
                      onValueChange={(val) => setSkillDate(prev => ({ ...prev, month: val }))}
                    >
                      <SelectTrigger id="month">
                        <SelectValue placeholder="Seleccionar mes" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(2024, i, 1))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year" className="text-sm font-medium">Año</Label>
                    <Select 
                      value={skillDate.year} 
                      onValueChange={(val) => setSkillDate(prev => ({ ...prev, year: val }))}
                    >
                      <SelectTrigger id="year">
                        <SelectValue placeholder="Seleccionar año" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 5 }, (_, i) => {
                          const year = (new Date().getFullYear() - 2 + i).toString();
                          return <SelectItem key={year} value={year}>{year}</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-md text-xs text-muted-foreground flex gap-2">
                    <Globe className="h-4 w-4 shrink-0" />
                    <span>Esto buscará eventos en Skill para el período seleccionado y los agregará al sistema.</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsSkillDialogOpen(false)} disabled={isSkillLoading}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleImportSkill}
                    disabled={isSkillLoading}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isSkillLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sincronizando...
                      </>
                    ) : (
                      'Sincronizar'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input
          placeholder="Buscar por ID o nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} className="font-semibold">
          <Search className="mr-2 h-4 w-4" />
          Buscar
        </Button>
      </div>

      {/* Tabla Responsive */}
      <div className="bg-card rounded-lg border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">ID Evento</TableHead>
                <TableHead className="font-semibold">Nombre</TableHead>
                <TableHead className="font-semibold hidden sm:table-cell">Estado</TableHead>
                <TableHead className="font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventos.map((evento) => (
                <TableRow key={evento.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{evento.idEvento}</TableCell>
                  <TableCell className="font-medium">{evento.nombre}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      evento.estado === 'activo'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {evento.estado}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(evento)}
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(evento.id, evento.nombre)}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Dialog de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, eventoId: '', eventoName: '' })}
        onConfirm={confirmDelete}
        title="Confirmar eliminación"
        description={`¿Está seguro de que desea eliminar el evento "${confirmDialog.eventoName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
      </div>
    </div>
  );
};

export default Eventos;
