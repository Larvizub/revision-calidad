import React from 'react';
import { User } from 'lucide-react';

const PerfilNoAuthState: React.FC = () => {
  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="p-4 lg:p-6 space-y-6 min-h-full">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No hay usuario autenticado</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerfilNoAuthState;
