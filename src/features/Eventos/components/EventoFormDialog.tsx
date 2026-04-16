import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Evento } from '@/types';
import type { EventoFormData } from '../lib/eventos.types';

interface EventoFormDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  editingEvento: Evento | null;
  formData: EventoFormData;
  setFormData: (value: EventoFormData) => void;
  isCreating: boolean;
  openCreateDialog: () => void;
  onSubmit: () => Promise<void>;
}

const EventoFormDialog: React.FC<EventoFormDialogProps> = ({
  isOpen,
  setIsOpen,
  editingEvento,
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
              onChange={(event) => setFormData({ ...formData, idEvento: event.target.value })}
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
              onChange={(event) => setFormData({ ...formData, nombre: event.target.value })}
              className="col-span-3"
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
            disabled={isCreating}
          >
            {isCreating ? 'Guardando...' : (editingEvento ? 'Actualizar' : 'Crear')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventoFormDialog;
