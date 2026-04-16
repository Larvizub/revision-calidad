import React from 'react';
import type { Usuario } from '@/types';
import { UserCheck, UserX } from 'lucide-react';

interface UsuarioEstadoBadgeProps {
  estado: Usuario['estado'];
}

const UsuarioEstadoBadge: React.FC<UsuarioEstadoBadgeProps> = ({ estado }) => {
  if (!estado) {
    return (
      <span className="text-gray-400 font-medium flex items-center gap-1">
        <UserX className="h-4 w-4" />
        Sin estado
      </span>
    );
  }

  return estado === 'activo' ? (
    <span className="text-green-600 font-medium flex items-center gap-1">
      <UserCheck className="h-4 w-4" />
      Activo
    </span>
  ) : (
    <span className="text-red-600 font-medium flex items-center gap-1">
      <UserX className="h-4 w-4" />
      Inactivo
    </span>
  );
};

export default UsuarioEstadoBadge;
