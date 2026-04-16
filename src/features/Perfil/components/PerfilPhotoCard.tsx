import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { Usuario } from '@/types';
import { Camera, CheckCircle, Save } from 'lucide-react';
import { getUserInitials } from '../lib/perfil-utils';

interface PerfilUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface PerfilPhotoCardProps {
  usuario: Usuario | null;
  userProfile: PerfilUserProfile;
  isEditing: boolean;
  isSaving: boolean;
  fotoPerfil: string;
  onFotoPerfilChange: (value: string) => void;
  onStartEditing: () => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
}

const PerfilPhotoCard: React.FC<PerfilPhotoCardProps> = ({
  usuario,
  userProfile,
  isEditing,
  isSaving,
  fotoPerfil,
  onFotoPerfilChange,
  onStartEditing,
  onSave,
  onCancel
}) => {
  return (
    <Card className="border border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Camera className="h-5 w-5" />
          Foto de Perfil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center overflow-hidden border-4 border-border shadow-lg">
              {(usuario?.fotoPerfil || userProfile.photoURL) ? (
                <img
                  src={usuario?.fotoPerfil || userProfile.photoURL || ''}
                  alt="Foto de perfil"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-primary">
                  {getUserInitials(userProfile.displayName)}
                </span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 border-2 border-background rounded-full flex items-center justify-center">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
          </div>

          {isEditing ? (
            <div className="w-full space-y-3">
              <Input
                value={fotoPerfil}
                onChange={(event) => onFotoPerfilChange(event.target.value)}
                placeholder="URL de la foto de perfil"
                className="font-medium"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    void onSave();
                  }}
                  disabled={isSaving}
                  size="sm"
                  className="flex-1 font-semibold"
                >
                  {isSaving ? <Skeleton className="h-4 w-4 mr-2 rounded-full" /> : <Save className="h-4 w-4 mr-2" />}
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button variant="outline" onClick={onCancel} size="sm" className="flex-1 font-semibold">
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={onStartEditing} variant="outline" className="font-semibold">
              <Camera className="h-4 w-4 mr-2" />
              Cambiar Foto
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PerfilPhotoCard;
