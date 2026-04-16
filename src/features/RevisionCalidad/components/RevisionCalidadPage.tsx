import React from 'react';
import { RevisionLoadingSkeleton } from '@/components/AppSkeletons';
import { useRevisionCalidadData } from '../hooks/useRevisionCalidadData';
import RevisionCalidadHeader from './RevisionCalidadHeader';
import RevisionCalidadSearchCard from './RevisionCalidadSearchCard';
import RevisionCalidadEventoSelectorCard from './RevisionCalidadEventoSelectorCard';
import RevisionCalidadRevisionSelectorCard from './RevisionCalidadRevisionSelectorCard';
import RevisionCalidadParametrosCard from './RevisionCalidadParametrosCard';
import RevisionCalidadCommentsCard from './RevisionCalidadCommentsCard';
import RevisionCalidadEvidenciasCard from './RevisionCalidadEvidenciasCard';
import RevisionCalidadVerificadorCard from './RevisionCalidadVerificadorCard';
import RevisionCalidadSaveCard from './RevisionCalidadSaveCard';
import RevisionCalidadEmptyState from './RevisionCalidadEmptyState';

const RevisionCalidadPage: React.FC = () => {
  const {
    areas,
    eventos,
    selectedEvento,
    setSelectedEvento,
    selectedRevision,
    setSelectedRevision,
    searchTerm,
    setSearchTerm,
    verificacionResults,
    isLoading,
    isSaving,
    comentariosCalidad,
    setComentariosCalidad,
    files,
    setFiles,
    uploading,
    deletingEvidence,
    isAdmin,
    filteredEventos,
    revisionesDelEvento,
    selectedRevisionData,
    selectedArea,
    parametrosRevision,
    completedVerificaciones,
    totalVerificaciones,
    handleDeleteEvidencia,
    handleVerificacionChange,
    handleSaveVerificacion,
    formatDate,
    getEstadoLabel
  } = useRevisionCalidadData();

  if (isLoading) {
    return <RevisionLoadingSkeleton />;
  }

  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="p-4 lg:p-6 space-y-6 min-h-full">
        <RevisionCalidadHeader />

        <RevisionCalidadSearchCard
          searchTerm={searchTerm}
          filteredCount={filteredEventos.length}
          totalCount={eventos.length}
          onSearchChange={setSearchTerm}
          onClearSearch={() => setSearchTerm('')}
        />

        <RevisionCalidadEventoSelectorCard
          selectedEvento={selectedEvento}
          searchTerm={searchTerm}
          filteredEventos={filteredEventos}
          onEventoChange={(value) => {
            setSelectedEvento(value);
            setSelectedRevision('');
          }}
        />

        {selectedEvento && (
          <RevisionCalidadRevisionSelectorCard
            selectedRevision={selectedRevision}
            revisionesDelEvento={revisionesDelEvento}
            areas={areas}
            eventos={eventos}
            selectedEvento={selectedEvento}
            selectedArea={selectedArea}
            selectedRevisionData={selectedRevisionData}
            onRevisionChange={setSelectedRevision}
            getEstadoLabel={getEstadoLabel}
            formatDate={formatDate}
          />
        )}

        {selectedRevisionData && (
          <RevisionCalidadParametrosCard
            selectedRevisionData={selectedRevisionData}
            parametrosRevision={parametrosRevision}
            verificacionResults={verificacionResults}
            onVerificacionChange={handleVerificacionChange}
          />
        )}

        {selectedRevisionData?.comentarios && (
          <RevisionCalidadCommentsCard
            label="Comentario del revisor"
            content={selectedRevisionData.comentarios}
          />
        )}

        {selectedRevisionData?.comentariosCalidad && (
          <RevisionCalidadCommentsCard
            label="Comentario del verificador"
            content={selectedRevisionData.comentariosCalidad}
          />
        )}

        {Array.isArray(selectedRevisionData?.evidencias) && selectedRevisionData.evidencias.length > 0 && (
          <RevisionCalidadEvidenciasCard
            evidencias={selectedRevisionData.evidencias}
            isAdmin={isAdmin}
            deletingEvidence={deletingEvidence}
            onDeleteEvidence={handleDeleteEvidencia}
          />
        )}

        {selectedRevisionData && (
          <RevisionCalidadVerificadorCard
            comentariosCalidad={comentariosCalidad}
            onComentariosCalidadChange={setComentariosCalidad}
            files={files}
            setFiles={setFiles}
            uploading={uploading}
          />
        )}

        {selectedRevisionData && parametrosRevision.length > 0 && (
          <RevisionCalidadSaveCard
            selectedRevisionData={selectedRevisionData}
            completedVerificaciones={completedVerificaciones}
            totalVerificaciones={totalVerificaciones}
            isSaving={isSaving}
            onSave={handleSaveVerificacion}
          />
        )}

        {!selectedEvento && (
          <RevisionCalidadEmptyState
            title="Seleccione un Evento"
            description="Para comenzar la verificación de calidad, seleccione un evento de la lista anterior"
          />
        )}

        {selectedEvento && !selectedRevision && revisionesDelEvento.length === 0 && (
          <RevisionCalidadEmptyState
            title="Sin Revisiones"
            description="No hay revisiones disponibles para este evento"
          />
        )}

        {selectedEvento && !selectedRevision && revisionesDelEvento.length > 0 && (
          <RevisionCalidadEmptyState
            title="Seleccione una Revisión"
            description={`Hay ${revisionesDelEvento.length} revisiones disponibles para este evento. Seleccione una para verificar.`}
          />
        )}
      </div>
    </div>
  );
};

export default RevisionCalidadPage;
