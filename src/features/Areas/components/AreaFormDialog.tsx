import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import type { Area } from '@/types';
import type { AreaFormData } from '../lib/areas.types';

interface AreaFormDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  editingArea: Area | null;
  formData: AreaFormData;
  setFormData: (formData: AreaFormData) => void;
  isCreating: boolean;
  openCreateDialog: () => void;
  onSubmit: () => Promise<void>;
}

const AreaFormDialog: React.FC<AreaFormDialogProps> = ({
  isOpen,
  setIsOpen,
  editingArea,
  formData,
  setFormData,
  isCreating,
  openCreateDialog,
  onSubmit
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
              onChange={(event) => setFormData({ ...formData, nombre: event.target.value })}
              className="col-span-3"
              placeholder="Ingrese el nombre del área"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              void onSubmit();
            }}
            disabled={!formData.nombre.trim() || isCreating}
          >
            {isCreating ? 'Guardando...' : (editingArea ? 'Actualizar' : 'Crear')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AreaFormDialog;
