import React from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { SkillDateState } from '../lib/eventos.types';

interface SkillSyncDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isLoading: boolean;
  skillDate: SkillDateState;
  setSkillDate: (value: SkillDateState) => void;
  onSync: () => Promise<void>;
}

const SkillSyncDialog: React.FC<SkillSyncDialogProps> = ({
  isOpen,
  setIsOpen,
  isLoading,
  skillDate,
  setSkillDate,
  onSync
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
              onValueChange={(value) => setSkillDate({ ...skillDate, month: value })}
            >
              <SelectTrigger id="month">
                <SelectValue placeholder="Seleccionar mes" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, index) => (
                  <SelectItem key={index + 1} value={(index + 1).toString()}>
                    {new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(2024, index, 1))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="year" className="text-sm font-medium">Año</Label>
            <Select
              value={skillDate.year}
              onValueChange={(value) => setSkillDate({ ...skillDate, year: value })}
            >
              <SelectTrigger id="year">
                <SelectValue placeholder="Seleccionar año" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, index) => {
                  const year = (new Date().getFullYear() - 2 + index).toString();
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
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              void onSync();
            }}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Skeleton className="mr-2 h-4 w-4 rounded-full" />
                Sincronizando...
              </>
            ) : (
              'Sincronizar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SkillSyncDialog;
