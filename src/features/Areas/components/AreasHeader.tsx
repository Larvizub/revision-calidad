import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';
import type { Area } from '@/types';
import type { AreaFormData } from '../lib/areas.types';
import AreaFormDialog from './AreaFormDialog';

interface AreasHeaderProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (isOpen: boolean) => void;
  editingArea: Area | null;
  formData: AreaFormData;
  setFormData: (formData: AreaFormData) => void;
  isCreating: boolean;
  openCreateDialog: () => void;
  onSubmitForm: () => Promise<void>;
  onImportExcel: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

const AreasHeader: React.FC<AreasHeaderProps> = ({
  isDialogOpen,
  setIsDialogOpen,
  editingArea,
  formData,
  setFormData,
  isCreating,
  openCreateDialog,
  onSubmitForm,
  onImportExcel
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
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
          <AreaFormDialog
            isOpen={isDialogOpen}
            setIsOpen={setIsDialogOpen}
            editingArea={editingArea}
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
        </div>
      </div>
    </div>
  );
};

export default AreasHeader;
