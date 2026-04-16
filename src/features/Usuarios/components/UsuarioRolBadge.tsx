import React from 'react';
import type { Usuario } from '@/types';
import { Shield, User, UserCheck } from 'lucide-react';

interface UsuarioRolBadgeProps {
  rol: Usuario['rol'];
}

const UsuarioRolBadge: React.FC<UsuarioRolBadgeProps> = ({ rol }) => {
  if (!rol) {
    return (
      <span className="text-gray-400 font-medium flex items-center gap-1">
        <User className="h-4 w-4" />
        Sin rol
      </span>
    );
  }

  switch (rol) {
    case 'administrador':
      return (
        <span className="text-red-600 font-medium flex items-center gap-1">
          <Shield className="h-4 w-4" />
          Administrador
        </span>
      );
    case 'calidad':
      return (
        <span className="text-blue-600 font-medium flex items-center gap-1">
          <UserCheck className="h-4 w-4" />
          Calidad
        </span>
      );
    default:
      return (
        <span className="text-gray-600 font-medium flex items-center gap-1">
          <User className="h-4 w-4" />
          Estándar
        </span>
      );
  }
};

export default UsuarioRolBadge;
