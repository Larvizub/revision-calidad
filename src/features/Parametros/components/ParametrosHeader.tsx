import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Area, Parametro } from '@/types';
import type { ParametroFormData } from '../lib/parametros.types';
import ParametroFormDialog from './ParametroFormDialog';

interface ParametrosHeaderProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (isOpen: boolean) => void;
  editingParametro: Parametro | null;
  formData: ParametroFormData;
  setFormData: (value: ParametroFormData) => void;
  areas: Area[];
  isCreating: boolean;
  onOpenCreate: () => void;
  onSubmitForm: () => Promise<void>;
  onImportExcel: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

const ParametrosHeader: React.FC<ParametrosHeaderProps> = ({
  isDialogOpen,
  setIsDialogOpen,
  editingParametro,
  formData,
  setFormData,
  areas,
  isCreating,
  onOpenCreate,
  onSubmitForm,
  onImportExcel
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
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
            className="border-primary/20 hover:border-primary/40 hover:bg-primary/5"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar Excel
          </Button>

          <ParametroFormDialog
            isOpen={isDialogOpen}
            setIsOpen={setIsDialogOpen}
            editingParametro={editingParametro}
            formData={formData}
            setFormData={setFormData}
            areas={areas}
            isCreating={isCreating}
            onOpenCreate={onOpenCreate}
            onSubmit={onSubmitForm}
          />
        </div>
      </div>
    </div>
  );
};

export default ParametrosHeader;
