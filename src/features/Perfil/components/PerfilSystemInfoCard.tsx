import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Usuario } from '@/types';
import { Building, Calendar, Globe } from 'lucide-react';

interface PerfilUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface PerfilSystemInfoCardProps {
  userProfile: PerfilUserProfile;
  usuario: Usuario | null;
}

const PerfilSystemInfoCard: React.FC<PerfilSystemInfoCardProps> = ({ userProfile, usuario }) => {
  return (
    <Card className="border border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Building className="h-5 w-5" />
          Información del Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <div>
              <p className="font-medium">Registrado</p>
              {usuario ? (
                <p className="text-xs text-muted-foreground">
                  {new Date(usuario.fechaCreacion).toLocaleDateString('es-ES')}
                </p>
              ) : (
                <Skeleton className="h-3 w-20 mt-1" />
              )}
            </div>
          </div>
        </div>

        {usuario?.ultimoAcceso && (
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-green-600" />
              <div>
                <p className="font-medium">Último Acceso</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(usuario.ultimoAcceso).toLocaleString('es-ES')}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-purple-600" />
            <div>
              <p className="font-medium">ID de Usuario</p>
              <p className="text-xs text-muted-foreground font-mono">
                {userProfile.uid.substring(0, 8)}...
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerfilSystemInfoCard;
