import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlus } from 'lucide-react';
import type { Usuario } from '@/types';
import type { UsuarioFormData } from '../lib/usuarios.types';

interface UsuarioFormCardProps {
  showForm: boolean;
  editingUsuario: Usuario | null;
  formData: UsuarioFormData;
  isSaving: boolean;
  onFormDataChange: React.Dispatch<React.SetStateAction<UsuarioFormData>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
}

const UsuarioFormCard: React.FC<UsuarioFormCardProps> = ({
  showForm,
  editingUsuario,
  formData,
  isSaving,
  onFormDataChange,
  onSubmit,
  onCancel
}) => {
  if (!showForm) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          {editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  onFormDataChange((prev) => ({
                    ...prev,
                    email: e.target.value
                  }))
                }
                placeholder="usuario@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) =>
                  onFormDataChange((prev) => ({
                    ...prev,
                    nombre: e.target.value
                  }))
                }
                placeholder="Nombre completo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rol">Rol</Label>
              <Select
                value={formData.rol}
                onValueChange={(value: Usuario['rol']) =>
                  onFormDataChange((prev) => ({
                    ...prev,
                    rol: value
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="estandar">Estándar</SelectItem>
                  <SelectItem value="calidad">Calidad</SelectItem>
                  <SelectItem value="administrador">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={formData.estado}
                onValueChange={(value: Usuario['estado']) =>
                  onFormDataChange((prev) => ({
                    ...prev,
                    estado: value
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="fotoPerfil">URL Foto de Perfil (opcional)</Label>
              <Input
                id="fotoPerfil"
                type="url"
                value={formData.fotoPerfil}
                onChange={(e) =>
                  onFormDataChange((prev) => ({
                    ...prev,
                    fotoPerfil: e.target.value
                  }))
                }
                placeholder="https://ejemplo.com/foto.jpg"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Skeleton className="w-4 h-4 mr-2 rounded-full" />}
              {editingUsuario ? 'Actualizar' : 'Crear'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default UsuarioFormCard;
