import React from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AppPageSkeleton } from '@/components/AppSkeletons';
import ParametrosHeader from './components/ParametrosHeader';
import ParametrosSearchBar from './components/ParametrosSearchBar';
import ParametrosTable from './components/ParametrosTable';
import { useParametrosData } from './hooks/useParametrosData';

const Parametros: React.FC = () => {
  const {
    areas,
    filteredParametros,
    searchTerm,
    isLoading,
    isCreating,
    isDialogOpen,
    editingParametro,
    confirmDialog,
    formData,
    setSearchTerm,
    setIsDialogOpen,
    setFormData,
    handleSearch,
    handleCreate,
    handleUpdate,
    handleDelete,
    confirmDelete,
    closeDeleteDialog,
    handleImportExcel,
    openEditDialog,
    openCreateDialog,
    getAreaName
  } = useParametrosData();

  if (isLoading) {
    return <AppPageSkeleton actionCount={2} rows={8} columns={3} />;
  }

  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="p-4 lg:p-6 space-y-6 min-h-full">
        <ParametrosHeader
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          editingParametro={editingParametro}
          formData={formData}
          setFormData={setFormData}
          areas={areas}
          isCreating={isCreating}
          onOpenCreate={openCreateDialog}
          onSubmitForm={editingParametro ? handleUpdate : handleCreate}
          onImportExcel={handleImportExcel}
        />

        <ParametrosSearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSearch={handleSearch}
        />

        <ParametrosTable
          parametros={filteredParametros}
          getAreaName={getAreaName}
          onEdit={openEditDialog}
          onDelete={handleDelete}
        />

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={closeDeleteDialog}
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
