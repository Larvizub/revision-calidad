import React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

interface UsuariosHeaderProps {
  onCreate: () => void;
}

const UsuariosHeader: React.FC<UsuariosHeaderProps> = ({ onCreate }) => {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Usuarios</h1>
        <p className="text-muted-foreground">Gestiona los usuarios del sistema</p>
      </div>
      <Button
        onClick={onCreate}
        className="w-full lg:w-auto"
        disabled={true}
        title="Los usuarios se registran automáticamente al iniciar sesión"
      >
        <UserPlus className="w-4 h-4 mr-2" />
        Registro Automático
      </Button>
    </div>
  );
};

export default UsuariosHeader;
