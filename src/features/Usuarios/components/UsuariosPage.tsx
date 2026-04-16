import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AppPageSkeleton } from '@/components/AppSkeletons';
import { Skeleton } from '@/components/ui/skeleton';
import type { Usuario } from '@/types';
import {
  Edit,
  Trash2,
  Search,
  UserPlus,
  Shield,
  User,
  UserCheck,
  UserX
} from 'lucide-react';
import { useUsuariosData } from '../hooks/useUsuariosData';

const getRolDisplay = (rol: Usuario['rol']) => {
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

const getEstadoDisplay = (estado: Usuario['estado']) => {
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

export const UsuariosPage: React.FC = () => {
  const {
    isLoading,
    showForm,
    editingUsuario,
    isSaving,
    showDeleteConfirm,
    setShowDeleteConfirm,
    usuarioToDelete,
    searchTerm,
    setSearchTerm,
    filterRol,
    setFilterRol,
    filterEstado,
    setFilterEstado,
    formData,
    setFormData,
    filteredUsuarios,
    resetForm,
    handleCreate,
    handleEdit,
    handleDelete,
    confirmDelete,
    handleSubmit
  } = useUsuariosData();

  if (isLoading) {
    return <AppPageSkeleton actionCount={1} rows={8} columns={6} />;
  }

  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="p-4 lg:p-6 space-y-6 min-h-full">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Usuarios</h1>
            <p className="text-muted-foreground">Gestiona los usuarios del sistema</p>
          </div>
          <Button
            onClick={handleCreate}
            className="w-full lg:w-auto"
            disabled={true}
            title="Los usuarios se registran automáticamente al iniciar sesión"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Registro Automático
          </Button>
        </div>

        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">
                  Registro Automático de Usuarios
                </h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-200">
                  <p>
                    <strong>Los usuarios se registran automáticamente</strong> cuando inician sesión con Microsoft por
                    primera vez. No es necesario crear usuarios manualmente.
                  </p>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>Los usuarios nuevos se registran automáticamente como "Estándar"</li>
                    <li>Puedes editar el rol y estado de usuarios existentes</li>
                    <li>La información se sincroniza con Microsoft Active Directory</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <Input
                  id="search"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filterRol">Filtrar por Rol</Label>
                <Select value={filterRol} onValueChange={setFilterRol}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los roles</SelectItem>
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="calidad">Calidad</SelectItem>
                    <SelectItem value="estandar">Estándar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filterEstado">Filtrar por Estado</Label>
                <Select value={filterEstado} onValueChange={setFilterEstado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                {editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
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
                        setFormData((prev) => ({
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
                        setFormData((prev) => ({
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
                        setFormData((prev) => ({
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
                        setFormData((prev) => ({
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
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Usuarios ({filteredUsuarios.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredUsuarios.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No se encontraron usuarios</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Creación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsuarios.map((usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {usuario.fotoPerfil ? (
                              <img
                                src={usuario.fotoPerfil}
                                alt={usuario.nombre}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-500" />
                              </div>
                            )}
                            <span className="font-medium">{usuario.nombre || 'Sin nombre'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{usuario.email || 'Sin email'}</TableCell>
                        <TableCell>{getRolDisplay(usuario.rol)}</TableCell>
                        <TableCell>{getEstadoDisplay(usuario.estado)}</TableCell>
                        <TableCell>
                          {usuario.fechaCreacion
                            ? new Date(usuario.fechaCreacion).toLocaleDateString('es-ES')
                            : 'Sin fecha'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(usuario)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(usuario)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
          title="Eliminar Usuario"
          description={`¿Estás seguro de que deseas eliminar al usuario "${usuarioToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        />
      </div>
    </div>
  );
};
