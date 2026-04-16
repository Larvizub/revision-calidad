import React from 'react';

const RevisionCalidadHeader: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-background border border-border/50 rounded-lg p-4 lg:p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Revisión de Calidad
          </h1>
          <p className="text-muted-foreground mt-2 text-sm lg:text-base">
            Verificación y aprobación de revisiones de parámetros de calidad
          </p>
        </div>
      </div>
    </div>
  );
};

export default RevisionCalidadHeader;
