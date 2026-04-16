import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';
import type { Evento } from '@/types';
import type { EventoFormData, SkillDateState } from '../lib/eventos.types';
import EventoFormDialog from './EventoFormDialog';
import SkillSyncDialog from './SkillSyncDialog';

interface EventosHeaderProps {
  eventosCount: number;
  isDialogOpen: boolean;
  setIsDialogOpen: (isOpen: boolean) => void;
  editingEvento: Evento | null;
  formData: EventoFormData;
  setFormData: (value: EventoFormData) => void;
  isCreating: boolean;
  openCreateDialog: () => void;
  onSubmitForm: () => Promise<void>;
  onImportExcel: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  isSkillDialogOpen: boolean;
  setIsSkillDialogOpen: (isOpen: boolean) => void;
  isSkillLoading: boolean;
  skillDate: SkillDateState;
  setSkillDate: (value: SkillDateState) => void;
  onSyncSkill: () => Promise<void>;
}

const EventosHeader: React.FC<EventosHeaderProps> = ({
  eventosCount,
  isDialogOpen,
  setIsDialogOpen,
  editingEvento,
  formData,
  setFormData,
  isCreating,
  openCreateDialog,
  onSubmitForm,
  onImportExcel,
  isSkillDialogOpen,
  setIsSkillDialogOpen,
  isSkillLoading,
  skillDate,
  setSkillDate,
  onSyncSkill
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 lg:p-6 border border-border/50">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Gestión de Eventos
          </h1>
          <div className="mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              {eventosCount} evento{eventosCount !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-muted-foreground mt-2 text-sm lg:text-base">
            Administra los eventos del sistema de revisión de calidad
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <EventoFormDialog
            isOpen={isDialogOpen}
            setIsOpen={setIsDialogOpen}
            editingEvento={editingEvento}
            formData={formData}
            setFormData={setFormData}
            isCreating={isCreating}
            openCreateDialog={openCreateDialog}
            onSubmit={onSubmitForm}
          />

          <div>
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={(event) => {
                void onImportExcel(event);
              }}
              className="hidden"
              ref={fileInputRef}
            />
            <Button
              variant="outline"
              onClick={() => {
                fileInputRef.current?.click();
              }}
            >
              <Upload className="mr-2 h-4 w-4" />
              Importar Excel
            </Button>
          </div>

          <SkillSyncDialog
            isOpen={isSkillDialogOpen}
            setIsOpen={setIsSkillDialogOpen}
            isLoading={isSkillLoading}
            skillDate={skillDate}
            setSkillDate={setSkillDate}
            onSync={onSyncSkill}
          />
        </div>
      </div>
    </div>
  );
};

export default EventosHeader;
