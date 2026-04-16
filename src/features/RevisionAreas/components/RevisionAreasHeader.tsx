import React from 'react';

const RevisionAreasHeader: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 lg:p-6 border border-border/50">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Revisión de Áreas
          </h1>
          <p className="text-muted-foreground mt-2 text-sm lg:text-base">
            Evalúa el cumplimiento de parámetros de calidad por área en eventos específicos
          </p>
        </div>
      </div>
    </div>
  );
};

export default RevisionAreasHeader;
