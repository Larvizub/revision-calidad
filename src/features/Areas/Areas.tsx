import React from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AppPageSkeleton } from '@/components/AppSkeletons';
import AreasHeader from './components/AreasHeader';
import AreasSearchBar from './components/AreasSearchBar';
import AreasTable from './components/AreasTable';
import { useAreasData } from './hooks/useAreasData';

const Areas: React.FC = () => {
  const {
    areas,
    searchTerm,
    isLoading,
    isCreating,
    isDialogOpen,
    editingArea,
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
    openCreateDialog
  } = useAreasData();

  if (isLoading) {
    return <AppPageSkeleton actionCount={2} rows={8} columns={3} />;
  }

  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="p-4 lg:p-6 space-y-6 min-h-full">
        <AreasHeader
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          editingArea={editingArea}
          formData={formData}
          setFormData={setFormData}
          isCreating={isCreating}
          openCreateDialog={openCreateDialog}
          onSubmitForm={editingArea ? handleUpdate : handleCreate}
          onImportExcel={handleImportExcel}
        />

        <AreasSearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSearch={handleSearch}
        />

        <AreasTable
          areas={areas}
          onEdit={openEditDialog}
          onDelete={handleDelete}
        />
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeDeleteDialog}
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
