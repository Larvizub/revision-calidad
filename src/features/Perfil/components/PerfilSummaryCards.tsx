import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Usuario } from '@/types';
import {
  CheckCircle,
  Settings,
  Shield,
  User,
  UserCheck,
  UserCog
} from 'lucide-react';

interface PerfilUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface PerfilSummaryCardsProps {
  userProfile: PerfilUserProfile;
  usuario: Usuario | null;
}

const PerfilSummaryCards: React.FC<PerfilSummaryCardsProps> = ({ userProfile, usuario }) => {
  const getRolDisplay = (rol: Usuario['rol']) => {
    const roles: Record<Usuario['rol'], {
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      color: string;
      bgColor: string;
    }> = {
      administrador: {
        label: 'Administrador',
        icon: Shield,
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-950'
      },
      calidad: {
        label: 'Calidad',
        icon: UserCheck,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-950'
      },
      estandar: {
        label: 'Estándar',
        icon: User,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950'
      }
    };

    const roleInfo = roles[rol] || roles.estandar;
    const Icon = roleInfo.icon;

    return (
      <div className={`flex items-center justify-between p-3 ${roleInfo.bgColor} rounded-lg`}>
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${roleInfo.color}`} />
          <span className="font-medium">{roleInfo.label}</span>
        </div>
        <CheckCircle className={`h-4 w-4 ${roleInfo.color}`} />
      </div>
    );
  };

  const getEstadoDisplay = (estado: Usuario['estado']) => {
    return estado === 'activo' ? (
      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="font-medium">Activo</span>
        </div>
        <div className="h-2 w-2 bg-green-500 rounded-full" />
      </div>
    ) : (
      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-red-600" />
          <span className="font-medium">Inactivo</span>
        </div>
        <div className="h-2 w-2 bg-red-500 rounded-full" />
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="border border-border/50 hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Información Personal</CardTitle>
          <User className="h-5 w-5 text-blue-600" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Nombre Completo</p>
            <p className="text-lg font-semibold">{userProfile.displayName || 'No disponible'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Email Corporativo</p>
            <p className="text-sm font-medium">{userProfile.email || 'No disponible'}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/50 hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Rol del Sistema</CardTitle>
          <UserCog className="h-5 w-5 text-purple-600" />
        </CardHeader>
        <CardContent>
          {usuario ? getRolDisplay(usuario.rol) : (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-border/50 hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Estado de la Cuenta</CardTitle>
          <Settings className="h-5 w-5 text-green-600" />
        </CardHeader>
        <CardContent>
          {usuario ? getEstadoDisplay(usuario.estado) : (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerfilSummaryCards;
