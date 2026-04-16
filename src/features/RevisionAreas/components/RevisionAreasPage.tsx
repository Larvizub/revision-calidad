import React from 'react';
import { RevisionLoadingSkeleton } from '@/components/AppSkeletons';
import RevisionAreasHeader from './RevisionAreasHeader';
import RevisionAreasSearchCard from './RevisionAreasSearchCard';
import RevisionAreasSelectorsCard from './RevisionAreasSelectorsCard';
import RevisionAreasEvaluationSection from './RevisionAreasEvaluationSection';
import { useRevisionAreasData } from '../hooks/useRevisionAreasData';

const RevisionAreasPage: React.FC = () => {
  const {
    areas,
    eventos,
    parametros,
    selectedArea,
    selectedEvento,
    eventoIdSearch,
    isLoading,
    isLoadingParametros,
    isSaving,
    revisionResults,
    isSearchingSkill,
    comentario,
    completedParams,
    totalParams,
    progressPercentage,
    setEventoIdSearch,
    setComentario,
    handleAreaChange,
    handleEventoChange,
    handleEventoIdSearch,
    handleResultChange,
    handleSaveRevision
  } = useRevisionAreasData();

  if (isLoading) {
    return <RevisionLoadingSkeleton />;
  }

  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="p-4 lg:p-6 space-y-6 min-h-full">
        <RevisionAreasHeader />

        <RevisionAreasSearchCard
          eventoIdSearch={eventoIdSearch}
          setEventoIdSearch={setEventoIdSearch}
          isSearchingSkill={isSearchingSkill}
          onSearch={handleEventoIdSearch}
        />

        <RevisionAreasSelectorsCard
          areas={areas}
          eventos={eventos}
          selectedArea={selectedArea}
          selectedEvento={selectedEvento}
          totalParams={totalParams}
          completedParams={completedParams}
          progressPercentage={progressPercentage}
          onAreaChange={handleAreaChange}
          onEventoChange={handleEventoChange}
        />

        <RevisionAreasEvaluationSection
          selectedArea={selectedArea}
          selectedEvento={selectedEvento}
          parametros={parametros}
          revisionResults={revisionResults}
          comentario={comentario}
          isLoadingParametros={isLoadingParametros}
          isSaving={isSaving}
          completedParams={completedParams}
          totalParams={totalParams}
          onComentarioChange={setComentario}
          onResultChange={handleResultChange}
          onSaveRevision={handleSaveRevision}
        />
      </div>
    </div>
  );
};

export default RevisionAreasPage;
