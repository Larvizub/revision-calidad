import React from 'react';
import { AlertTriangle } from 'lucide-react';

const DashboardErrorState: React.FC = () => {
  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="p-4 lg:p-6 space-y-6 min-h-full">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Error al cargar los datos</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardErrorState;
