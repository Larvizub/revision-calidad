import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DatabaseService } from '@/services/database';
import { useToast } from '@/hooks/useToast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Parametro, Area } from '@/types';
import { Plus, Search, Edit, Trash2, Upload, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const Parametros: React.FC = () => {
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingParametro, setEditingParametro] = useState<Parametro | null>(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    parametroId: '',
    parametroName: ''
  });
  const [formData, setFormData] = useState({
    idArea: '',
    nombre: '',
  });

  const dbService = useMemo(() => new DatabaseService(), []);
  const { showSuccess, showError } = useToast();

  const loadParametros = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dbService.getParametros();
      setParametros(data);
    } catch (error) {
      console.error('Error loading parametros:', error);
      showError('Error al cargar los parámetros: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [dbService, showError]);

  const loadAreas = useCallback(async () => {
    try {
      const data = await dbService.getAreas();
      setAreas(data);
    } catch (error) {
      console.error('Error loading areas:', error);
      showError('Error al cargar las áreas: ' + (error as Error).message);
    }
  }, [dbService, showError]);

  useEffect(() => {
    loadParametros();
    loadAreas();
  }, [loadParametros, loadAreas]);

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      const results = await dbService.searchParametros(searchTerm);
      setParametros(results);
    } else {
      await loadParametros();
    }
  };

  const handleCreate = async () => {
    // Validación
    if (!formData.idArea || !formData.nombre.trim()) {
      showError('Por favor complete los campos obligatorios (Área y Nombre)');
      return;
    }

    setIsCreating(true);
    try {
      const parametroData = {
        idArea: formData.idArea,
        nombre: formData.nombre.trim(),
        estado: 'activo' as const,
      };
      
      const newParametroId = await dbService.createParametro(parametroData);
      
      // Agregar el nuevo parámetro al estado local
      const newParametro: Parametro = {
        id: newParametroId,
        ...parametroData
      };
      setParametros(prev => [...prev, newParametro]);
      
      setIsDialogOpen(false);
      resetForm();
      showSuccess('Parámetro creado correctamente');
    } catch (error) {
      console.error('Error creating parametro:', error);
      showError('Error al crear el parámetro: ' + (error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingParametro) return;
    
    // Validación
    if (!formData.idArea || !formData.nombre.trim()) {
      showError('Por favor complete los campos obligatorios (Área y Nombre)');
      return;
    }

    try {
      const updatedData = {
        idArea: formData.idArea,
        nombre: formData.nombre.trim(),
      };
      
      await dbService.updateParametro(editingParametro.id, updatedData);
      
      // Actualizar el parámetro en el estado local
      setParametros(prev => prev.map(parametro => 
        parametro.id === editingParametro.id 
          ? { ...parametro, ...updatedData }
          : parametro
      ));
      
      setIsDialogOpen(false);
      setEditingParametro(null);
      resetForm();
      showSuccess('Parámetro actualizado correctamente');
    } catch (error) {
      console.error('Error updating parametro:', error);
      showError('Error al actualizar el parámetro: ' + (error as Error).message);
    }
  };

  const handleDelete = (id: string, nombre: string) => {
    setConfirmDialog({
      isOpen: true,
      parametroId: id,
      parametroName: nombre
    });
  };

  const confirmDelete = async () => {
    try {
      await dbService.deleteParametro(confirmDialog.parametroId);
      
      // Remover el parámetro del estado local
      setParametros(prev => prev.filter(parametro => parametro.id !== confirmDialog.parametroId));
      
      showSuccess('Parámetro eliminado correctamente');
    } catch (error) {
      console.error('Error deleting parametro:', error);
      showError('Error al eliminar el parámetro: ' + (error as Error).message);
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

      const parametrosToImport = jsonData.map((row: unknown) => {
        const r = row as Record<string, unknown>;
        return {
          idArea: String(r['ID Area']),
          nombre: String(r['Nombre']),
          estado: 'activo' as const,
        };
      });

      await dbService.importParametrosFromExcel(parametrosToImport);
      await loadParametros();
      showSuccess('Parámetros importados correctamente');
    } catch (error) {
      console.error('Error importing Excel:', error);
      showError('Error al importar el archivo Excel');
    }
  };

  const resetForm = () => {
    setFormData({
      idArea: '',
      nombre: '',
    });
  };

  const openEditDialog = (parametro: Parametro) => {
    setEditingParametro(parametro);
    setFormData({
      idArea: parametro.idArea,
      nombre: parametro.nombre,
    });
    setIsDialogOpen(true);
  };

  const getAreaName = useCallback((idArea: string) => {
    const area = areas.find(a => a.id === idArea);
    return area ? area.nombre : 'Área no encontrada';
  }, [areas]);

  const filteredParametros = useMemo(() => {
    if (!searchTerm) return parametros;
    return parametros.filter(parametro =>
      parametro.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getAreaName(parametro.idArea).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [parametros, searchTerm, getAreaName]);

  if (isLoading) {
    return (
      <div className="h-full w-full bg-background overflow-auto">
        <div className="p-4 lg:p-6 space-y-6 min-h-full">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Cargando parámetros...</p>
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
                Gestión de Parámetros
              </h1>
              <p className="text-muted-foreground mt-2 text-sm lg:text-base">
                Administra los parámetros por área para formularios de revisión de calidad
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                className="hidden"
                id="excel-upload-parametros"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('excel-upload-parametros')?.click()}
                className="border-primary/20 hover:border-primary/40 hover:bg-primary/5"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar Excel
              </Button>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => { setEditingParametro(null); resetForm(); }}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg font-semibold"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Parámetro
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md mx-auto">
                  <DialogHeader>
                    <DialogTitle className="font-semibold">
                      {editingParametro ? 'Editar Parámetro' : 'Crear Nuevo Parámetro'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="idArea" className="text-right font-medium">Área</Label>
                      <div className="col-span-3">
                        <Select value={formData.idArea} onValueChange={(value) => setFormData({ ...formData, idArea: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un área" />
                          </SelectTrigger>
                          <SelectContent>
                            {areas.map((area) => (
                              <SelectItem key={area.id} value={area.id}>
                                {area.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="nombre" className="text-right font-medium">Nombre</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        className="col-span-3"
                        placeholder="Ingrese el nombre del parámetro"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={editingParametro ? handleUpdate : handleCreate}
                      disabled={!formData.idArea || !formData.nombre.trim() || isCreating}
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                      {isCreating ? 'Creando...' : (editingParametro ? 'Actualizar' : 'Crear')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar parámetros por nombre o área..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-border/50 focus:border-primary/50"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              variant="outline"
              className="border-primary/20 hover:border-primary/40 hover:bg-primary/5"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border border-border/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="font-semibold text-foreground">Área</TableHead>
                  <TableHead className="font-semibold text-foreground">Nombre</TableHead>
                  <TableHead className="w-[120px] font-semibold text-foreground">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParametros.map((parametro) => (
                  <TableRow key={parametro.id} className="border-border/30 hover:bg-muted/30">
                    <TableCell className="font-medium">{getAreaName(parametro.idArea)}</TableCell>
                    <TableCell className="font-medium">{parametro.nombre}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(parametro)}
                          className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(parametro.id, parametro.nombre)}
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
          onClose={() => setConfirmDialog({ isOpen: false, parametroId: '', parametroName: '' })}
          onConfirm={confirmDelete}
          title="Confirmar eliminación"
          description={`¿Está seguro de que desea eliminar el parámetro "${confirmDialog.parametroName}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="destructive"
        />
      </div>
    </div>
  );
};

export default Parametros;
