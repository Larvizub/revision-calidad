import React from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AppPageSkeleton } from '@/components/AppSkeletons';
import EventosHeader from './components/EventosHeader';
import EventosSearchBar from './components/EventosSearchBar';
import EventosTable from './components/EventosTable';
import { useEventosData } from './hooks/useEventosData';

const Eventos: React.FC = () => {
  const {
    eventos,
    searchTerm,
    isLoading,
    isCreating,
    isDialogOpen,
    isSkillDialogOpen,
    isSkillLoading,
    skillDate,
    editingEvento,
    confirmDialog,
    formData,
    setSearchTerm,
    setIsDialogOpen,
    setIsSkillDialogOpen,
    setSkillDate,
    setFormData,
    handleSearch,
    handleCreate,
    handleUpdate,
    handleDelete,
    confirmDelete,
    closeDeleteDialog,
    handleImportExcel,
    handleImportSkill,
    openEditDialog,
    openCreateDialog
  } = useEventosData();

  if (isLoading) {
    return <AppPageSkeleton actionCount={3} rows={8} columns={4} />;
  }

  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="p-4 lg:p-6 space-y-6 min-h-full">
        <EventosHeader
          eventosCount={eventos.length}
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          editingEvento={editingEvento}
          formData={formData}
          setFormData={setFormData}
          isCreating={isCreating}
          openCreateDialog={openCreateDialog}
          onSubmitForm={editingEvento ? handleUpdate : handleCreate}
          onImportExcel={handleImportExcel}
          isSkillDialogOpen={isSkillDialogOpen}
          setIsSkillDialogOpen={setIsSkillDialogOpen}
          isSkillLoading={isSkillLoading}
          skillDate={skillDate}
          setSkillDate={setSkillDate}
          onSyncSkill={handleImportSkill}
        />

        <EventosSearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSearch={handleSearch}
        />

        <EventosTable
          eventos={eventos}
          onEdit={openEditDialog}
          onDelete={handleDelete}
        />

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={closeDeleteDialog}
          onConfirm={confirmDelete}
          title="Confirmar eliminación"
          description={`¿Está seguro de que desea eliminar el evento "${confirmDialog.eventoName}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="destructive"
        />
      </div>
    </div>
  );
};

export default Eventos;
