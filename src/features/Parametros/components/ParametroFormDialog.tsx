import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import type { Area, Parametro } from '@/types';
import type { ParametroFormData } from '../lib/parametros.types';

interface ParametroFormDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  editingParametro: Parametro | null;
  formData: ParametroFormData;
  setFormData: (value: ParametroFormData) => void;
  areas: Area[];
  isCreating: boolean;
  onOpenCreate: () => void;
  onSubmit: () => Promise<void>;
}

const ParametroFormDialog: React.FC<ParametroFormDialogProps> = ({
  isOpen,
  setIsOpen,
  editingParametro,
  formData,
  setFormData,
  areas,
  isCreating,
  onOpenCreate,
  onSubmit
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={onOpenCreate}
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
              <Select
                value={formData.idArea}
                onValueChange={(value) => setFormData({ ...formData, idArea: value })}
              >
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
              onChange={(event) => setFormData({ ...formData, nombre: event.target.value })}
              className="col-span-3"
              placeholder="Ingrese el nombre del parámetro"
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
            disabled={!formData.idArea || !formData.nombre.trim() || isCreating}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            {isCreating ? 'Creando...' : (editingParametro ? 'Actualizar' : 'Crear')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ParametroFormDialog;
