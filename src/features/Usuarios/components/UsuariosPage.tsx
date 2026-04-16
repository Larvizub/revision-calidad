import React from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AppPageSkeleton } from '@/components/AppSkeletons';
import { useUsuariosData } from '../hooks/useUsuariosData';
import UsuariosHeader from './UsuariosHeader';
import UsuariosAutoRegistroInfoCard from './UsuariosAutoRegistroInfoCard';
import UsuariosFiltersCard from './UsuariosFiltersCard';
import UsuarioFormCard from './UsuarioFormCard';
import UsuariosTableCard from './UsuariosTableCard';

export const UsuariosPage: React.FC = () => {
  const {
    isLoading,
    showForm,
    editingUsuario,
    isSaving,
    showDeleteConfirm,
    setShowDeleteConfirm,
    usuarioToDelete,
    searchTerm,
    setSearchTerm,
    filterRol,
    setFilterRol,
    filterEstado,
    setFilterEstado,
    formData,
    setFormData,
    filteredUsuarios,
    resetForm,
    handleCreate,
    handleEdit,
    handleDelete,
    confirmDelete,
    handleSubmit
  } = useUsuariosData();

  if (isLoading) {
    return <AppPageSkeleton actionCount={1} rows={8} columns={6} />;
  }

  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="p-4 lg:p-6 space-y-6 min-h-full">
        <UsuariosHeader onCreate={handleCreate} />

        <UsuariosAutoRegistroInfoCard />

        <UsuariosFiltersCard
          searchTerm={searchTerm}
          filterRol={filterRol}
          filterEstado={filterEstado}
          onSearchChange={setSearchTerm}
          onFilterRolChange={setFilterRol}
          onFilterEstadoChange={setFilterEstado}
        />

        <UsuarioFormCard
          showForm={showForm}
          editingUsuario={editingUsuario}
          formData={formData}
          isSaving={isSaving}
          onFormDataChange={setFormData}
          onSubmit={handleSubmit}
          onCancel={resetForm}
        />

        <UsuariosTableCard usuarios={filteredUsuarios} onEdit={handleEdit} onDelete={handleDelete} />

        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
          title="Eliminar Usuario"
          description={`¿Estás seguro de que deseas eliminar al usuario "${usuarioToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        />
      </div>
    </div>
  );
};
