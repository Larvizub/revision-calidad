import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatabaseService } from '@/services/database';
import { useToast } from '@/hooks/useToast';
import type { Usuario } from '@/types';
import { 
  Loader2, 
  Edit, 
  Trash2, 
  Search,
  UserPlus,
  Shield,
  User,
  UserCheck,
  UserX
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';

// Crear instancia de DatabaseService dentro del componente para respetar el recinto seleccionado

const Usuarios: React.FC = () => {
  const dbService = useMemo(() => new DatabaseService(), []);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');

  // Estados del formulario
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    rol: 'estandar' as Usuario['rol'],
    estado: 'activo' as Usuario['estado'],
    fotoPerfil: ''
  });

  const { showSuccess, showError } = useToast();

  const loadUsuarios = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Usuarios: Cargando usuarios...');
      const usuariosData = await dbService.getUsuarios();
      console.log('Usuarios: Datos recibidos del servicio:', usuariosData);
      console.log('Usuarios: Cantidad de usuarios:', usuariosData.length);
      setUsuarios(usuariosData);
    } catch (error) {
      console.error('Error loading usuarios:', error);
      showError('Error al cargar usuarios: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [showError, dbService]);

  useEffect(() => {
    loadUsuarios();
  }, [loadUsuarios]);

  const filteredUsuarios = useMemo(() => {
    return usuarios.filter(usuario => {
      const matchesSearch = (usuario.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (usuario.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRol = filterRol === 'todos' || usuario.rol === filterRol;
      const matchesEstado = filterEstado === 'todos' || usuario.estado === filterEstado;
      
      return matchesSearch && matchesRol && matchesEstado;
    });
  }, [usuarios, searchTerm, filterRol, filterEstado]);

  const resetForm = () => {
    setFormData({
      email: '',
      nombre: '',
      rol: 'estandar',
      estado: 'activo',
      fotoPerfil: ''
    });
    setEditingUsuario(null);
    setShowForm(false);
  };

  const handleCreate = () => {
    // Los usuarios se registran automáticamente al iniciar sesión
    // No permitir creación manual
    showError('Los usuarios se registran automáticamente al iniciar sesión con Microsoft');
  };

  const handleEdit = (usuario: Usuario) => {
    setFormData({
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      estado: usuario.estado,
      fotoPerfil: usuario.fotoPerfil || ''
    });
    setEditingUsuario(usuario);
    setShowForm(true);
  };

  const handleDelete = (usuario: Usuario) => {
    setUsuarioToDelete(usuario);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!usuarioToDelete) return;

    try {
      setIsSaving(true);
      await dbService.deleteUsuario(usuarioToDelete.id);
      
      // Actualizar estado local
      setUsuarios(prev => prev.filter(u => u.id !== usuarioToDelete.id));
      
      showSuccess('Usuario eliminado exitosamente');
      setShowDeleteConfirm(false);
      setUsuarioToDelete(null);
    } catch (error) {
      console.error('Error deleting usuario:', error);
      showError('Error al eliminar usuario: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Solo permitir edición, no creación
    if (!editingUsuario) {
      showError('Solo se permite editar usuarios existentes. Los usuarios se registran automáticamente.');
      return;
    }
    
    if (!formData.email.trim() || !formData.nombre.trim()) {
      showError('Email y nombre son obligatorios');
      return;
    }

    // Validar email único (solo para edición)
    const emailExists = usuarios.some(u => 
      u.email.toLowerCase() === formData.email.toLowerCase() && 
      u.id !== editingUsuario.id
    );
    
    if (emailExists) {
      showError('Ya existe un usuario con este email');
      return;
    }

    try {
      setIsSaving(true);
      
      // Solo campos que se pueden editar (no el UID ni fechas de registro)
      const usuarioData: Partial<Usuario> = {
        rol: formData.rol,
        estado: formData.estado,
        // Guardar foto de perfil si el admin la proporcionó (cadena vacía -> eliminar)
        fotoPerfil: formData.fotoPerfil ? formData.fotoPerfil : undefined,
        // No permitir cambio de email ni nombre si vienen de Microsoft
        // Mantener la información original de Microsoft
        ultimoAcceso: new Date().toISOString()
      };

      await dbService.updateUsuario(editingUsuario.id, usuarioData);

      // Actualizar estado local
      setUsuarios(prev => prev.map(u => 
        u.id === editingUsuario.id 
          ? { ...u, ...usuarioData }
          : u
      ));
      
      showSuccess('Usuario actualizado exitosamente');
      resetForm();
    } catch (error) {
      console.error('Error saving usuario:', error);
      showError('Error al guardar usuario: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const getRolDisplay = (rol: Usuario['rol']) => {
    if (!rol) {
      return <span className="text-gray-400 font-medium flex items-center gap-1">
        <User className="h-4 w-4" />
        Sin rol
      </span>;
    }
    
    switch (rol) {
      case 'administrador':
        return <span className="text-red-600 font-medium flex items-center gap-1">
          <Shield className="h-4 w-4" />
          Administrador
        </span>;
      case 'calidad':
        return <span className="text-blue-600 font-medium flex items-center gap-1">
          <UserCheck className="h-4 w-4" />
          Calidad
        </span>;
      default:
        return <span className="text-gray-600 font-medium flex items-center gap-1">
          <User className="h-4 w-4" />
          Estándar
        </span>;
    }
  };

  const getEstadoDisplay = (estado: Usuario['estado']) => {
    if (!estado) {
      return <span className="text-gray-400 font-medium flex items-center gap-1">
        <UserX className="h-4 w-4" />
        Sin estado
      </span>;
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

  if (isLoading) {
    return (
      <div className="h-full w-full bg-background overflow-auto">
        <div className="p-4 lg:p-6 space-y-6 min-h-full">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-lg">Cargando usuarios...</span>
            </div>
          </div>
        </div>
      </div>
    );
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

        {/* Información importante sobre el registro automático */}
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
                    <strong>Los usuarios se registran automáticamente</strong> cuando inician sesión con Microsoft por primera vez.
                    No es necesario crear usuarios manualmente.
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

        {/* Filtros */}
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

        {/* Formulario */}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="usuario@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Nombre completo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rol">Rol</Label>
                    <Select value={formData.rol} onValueChange={(value: Usuario['rol']) => setFormData(prev => ({ ...prev, rol: value }))}>
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
                    <Select value={formData.estado} onValueChange={(value: Usuario['estado']) => setFormData(prev => ({ ...prev, estado: value }))}>
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
                      onChange={(e) => setFormData(prev => ({ ...prev, fotoPerfil: e.target.value }))}
                      placeholder="https://ejemplo.com/foto.jpg"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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

        {/* Tabla de usuarios */}
        <Card>
          <CardHeader>
            <CardTitle>Usuarios ({filteredUsuarios.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredUsuarios.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron usuarios
              </div>
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
                          {usuario.fechaCreacion ? new Date(usuario.fechaCreacion).toLocaleDateString('es-ES') : 'Sin fecha'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(usuario)}
                            >
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

        {/* Confirm Delete Dialog */}
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

export default Usuarios;
