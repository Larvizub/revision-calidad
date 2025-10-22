import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DatabaseService } from '@/services/database';
import { useToast } from '@/hooks/useToast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Area } from '@/types';
import { Plus, Search, Edit, Trash2, Upload, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const Areas: React.FC = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    areaId: '',
    areaName: ''
  });
  const [formData, setFormData] = useState({
    nombre: '',
  });

  const dbService = useMemo(() => new DatabaseService(), []);
  const { showSuccess, showError } = useToast();

  const loadAreas = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dbService.getAreas();
      setAreas(data);
    } catch (error) {
      console.error('Error loading areas:', error);
      showError('Error al cargar las áreas: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [dbService, showError]);

  useEffect(() => {
    loadAreas();
  }, [loadAreas]);

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      const results = await dbService.searchAreas(searchTerm);
      setAreas(results);
    } else {
      await loadAreas();
    }
  };

  const handleCreate = async () => {
    // Validación
    if (!formData.nombre.trim()) {
      showError('Por favor ingrese un nombre para el área');
      return;
    }

    setIsCreating(true);
    try {
      const areaData = {
        nombre: formData.nombre.trim(),
        estado: 'activo' as const,
      };
      
      const newAreaId = await dbService.createArea(areaData);
      
      // Agregar el nuevo área al estado local sin recargar
      const newArea: Area = {
        id: newAreaId,
        ...areaData
      };
      setAreas(prev => [...prev, newArea]);
      
      setIsDialogOpen(false);
      resetForm();
      showSuccess('Área creada correctamente');
    } catch (error) {
      console.error('Error creating area:', error);
      showError('Error al crear el área: ' + (error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingArea) return;
    
    // Validación
    if (!formData.nombre.trim()) {
      showError('Por favor ingrese un nombre para el área');
      return;
    }

    try {
      await dbService.updateArea(editingArea.id, {
        nombre: formData.nombre.trim(),
      });
      
      // Actualizar el área en el estado local sin recargar
      setAreas(prev => prev.map(area => 
        area.id === editingArea.id 
          ? { ...area, nombre: formData.nombre.trim() }
          : area
      ));
      
      setIsDialogOpen(false);
      setEditingArea(null);
      resetForm();
      showSuccess('Área actualizada correctamente');
    } catch (error) {
      console.error('Error updating area:', error);
      showError('Error al actualizar el área: ' + (error as Error).message);
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    setConfirmDialog({
      isOpen: true,
      areaId: id,
      areaName: nombre
    });
  };

  const confirmDelete = async () => {
    try {
      await dbService.deleteArea(confirmDialog.areaId);
      
      // Remover el área del estado local sin recargar
      setAreas(prev => prev.filter(area => area.id !== confirmDialog.areaId));
      
      showSuccess('Área eliminada correctamente');
    } catch (error) {
      console.error('Error deleting area:', error);
      showError('Error al eliminar el área: ' + (error as Error).message);
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const areasToImport = jsonData.map((row: unknown) => {
        const r = row as Record<string, unknown>;
        return {
          nombre: String(r['Nombre']),
          estado: 'activo' as const,
        };
      });

      await dbService.importAreasFromExcel(areasToImport);
      // Para importación masiva, es mejor recargar todo para mantener consistencia
      await loadAreas();
      showSuccess('Áreas importadas correctamente');
    } catch (error) {
      console.error('Error importing Excel:', error);
      showError('Error al importar el archivo Excel');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
    });
  };

  const openEditDialog = (area: Area) => {
    setEditingArea(area);
    setFormData({
      nombre: area.nombre,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingArea(null);
    resetForm();
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="h-full w-full bg-background overflow-auto">
        <div className="p-4 lg:p-6 space-y-6 min-h-full">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Cargando áreas...</p>
            </div>
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
                Gestión de Áreas
              </h1>
              <p className="text-muted-foreground mt-2 text-sm lg:text-base">
                Administra las áreas disponibles para revisiones de calidad
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
                    Nueva Área
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md mx-auto">
                  <DialogHeader>
                    <DialogTitle className="font-semibold">
                      {editingArea ? 'Editar Área' : 'Crear Nueva Área'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="nombre" className="text-right font-medium">
                        Nombre
                      </Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        className="col-span-3"
                        placeholder="Ingrese el nombre del área"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={editingArea ? handleUpdate : handleCreate}
                      disabled={!formData.nombre.trim() || isCreating}
                    >
                      {isCreating ? 'Guardando...' : (editingArea ? 'Actualizar' : 'Crear')}
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
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Input
            placeholder="Buscar por nombre..."
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
                  <TableHead className="font-semibold">Nombre</TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell">Estado</TableHead>
                  <TableHead className="font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areas.map((area) => (
                  <TableRow key={area.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{area.nombre}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        area.estado === 'activo'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {area.estado}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(area)}
                          className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(area.id, area.nombre)}
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
      </div>

      {/* Dialog de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, areaId: '', areaName: '' })}
        onConfirm={confirmDelete}
        title="Confirmar eliminación"
        description={`¿Está seguro de que desea eliminar el área "${confirmDialog.areaName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  );
};

export default Areas;
