import React from 'react';
import { Clock } from 'lucide-react';

const PerfilHeader: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 lg:p-6 border border-border/50">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Mi Perfil
          </h1>
          <p className="text-muted-foreground mt-2 text-sm lg:text-base">
            Gestiona tu información personal y configuración de cuenta
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Actualizado: {new Date().toLocaleString('es-ES')}</span>
        </div>
      </div>
    </div>
  );
};

export default PerfilHeader;
