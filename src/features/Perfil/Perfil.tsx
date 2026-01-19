import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatabaseService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import type { Usuario } from '@/types';
import { 
  Loader2, 
  User,
  Mail,
  Shield,
  UserCheck,
  Calendar,
  Camera,
  Save,
  UserCog,
  Building,
  Clock,
  Globe,
  Settings,
  CheckCircle
} from 'lucide-react';

const Perfil: React.FC = () => {
  const dbService = useMemo(() => new DatabaseService(), []);
  const { user, userProfile } = useAuth();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Estados del formulario - solo para campos editables
  const [formData, setFormData] = useState({
    fotoPerfil: ''
  });

  const { showSuccess, showError } = useToast();

  const loadUsuario = useCallback(async () => {
    if (!user || !userProfile) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log('Perfil: Cargando usuario por email:', userProfile.email);
      
      // Buscar el usuario en Firebase Database por email
      const currentUser = await dbService.getUserByEmail(userProfile.email!);
      
      if (currentUser) {
        console.log('Perfil: Usuario encontrado:', currentUser);
        setUsuario(currentUser);
        setFormData({
          fotoPerfil: currentUser.fotoPerfil || userProfile.photoURL || ''
        });
      } else {
        console.log('Perfil: Usuario no encontrado en base de datos');
        showError('Usuario no encontrado en la base de datos');
      }
    } catch (error) {
      console.error('Perfil: Error al cargar usuario:', error);
      showError('Error al cargar información del usuario');
    } finally {
      setIsLoading(false);
    }
  }, [user, userProfile, showError, dbService]);

  useEffect(() => {
    loadUsuario();
  }, [loadUsuario]);

  const handleSave = async () => {
    if (!usuario) return;

    setIsSaving(true);
    try {
      await dbService.updateUsuario(usuario.id, {
        fotoPerfil: formData.fotoPerfil
      });

      setUsuario(prev => prev ? { ...prev, fotoPerfil: formData.fotoPerfil } : null);
      setIsEditing(false);
      showSuccess('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error updating perfil:', error);
      showError('Error al actualizar perfil: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (usuario) {
      setFormData({
        fotoPerfil: usuario.fotoPerfil || userProfile?.photoURL || ''
      });
    }
    setIsEditing(false);
  };

  const getRolDisplay = (rol: Usuario['rol']) => {
    const roles = {
      administrador: { label: 'Administrador', icon: Shield, color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-950' },
      calidad: { label: 'Calidad', icon: UserCheck, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950' },
      estandar: { label: 'Estándar', icon: User, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950' }
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
        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
      </div>
    ) : (
      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-red-600" />
          <span className="font-medium">Inactivo</span>
        </div>
        <div className="h-2 w-2 bg-red-500 rounded-full"></div>
      </div>
    );
  };

  if (!user || !userProfile) {
    return (
      <div className="h-full w-full bg-background overflow-auto">
        <div className="p-4 lg:p-6 space-y-6 min-h-full">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">No hay usuario autenticado</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full w-full bg-background overflow-auto">
        <div className="p-4 lg:p-6 space-y-6 min-h-full">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="p-4 lg:p-6 space-y-6 min-h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 lg:p-6 border border-border/50">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Mi Perfil
              </h1>
              <p className="text-muted-foreground mt-2 text-sm lg:text-base">
                Gestiona tu información personal y configuración de cuenta
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Actualizado: {new Date().toLocaleString('es-ES')}</span>
            </div>
          </div>
        </div>

        {/* Cards de Información */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Información Básica */}
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

          {/* Rol del Sistema */}
          <Card className="border border-border/50 hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rol del Sistema</CardTitle>
              <UserCog className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              {usuario ? getRolDisplay(usuario.rol) : (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground">Cargando...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estado de la Cuenta */}
          <Card className="border border-border/50 hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Estado de la Cuenta</CardTitle>
              <Settings className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              {usuario ? getEstadoDisplay(usuario.estado) : (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground">Cargando...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Secciones Principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Foto de Perfil y Configuración */}
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
                        {userProfile.displayName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
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
                      value={formData.fotoPerfil}
                      onChange={(e) => setFormData(prev => ({ ...prev, fotoPerfil: e.target.value }))}
                      placeholder="URL de la foto de perfil"
                      className="font-medium"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={isSaving} size="sm" className="flex-1 font-semibold">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        {isSaving ? 'Guardando...' : 'Guardar'}
                      </Button>
                      <Button variant="outline" onClick={handleCancel} size="sm" className="flex-1 font-semibold">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="font-semibold">
                    <Camera className="h-4 w-4 mr-2" />
                    Cambiar Foto
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Información del Sistema */}
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Building className="h-5 w-5" />
                Información del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Fecha de Registro */}
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium">Registrado</p>
                    <p className="text-xs text-muted-foreground">
                      {usuario ? new Date(usuario.fechaCreacion).toLocaleDateString('es-ES') : 'Cargando...'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Último Acceso */}
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

              {/* ID de Usuario */}
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
        </div>

        {/* Nota Informativa */}
        <Card className="border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Mail className="h-4 w-4 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">
                  Información de Microsoft Active Directory
                </h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-200">
                  <p>
                    Los datos de <strong>nombre</strong> y <strong>email</strong> se sincronizan automáticamente con Microsoft Active Directory y no pueden ser modificados desde esta aplicación.
                  </p>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>Solo puedes cambiar tu foto de perfil</li>
                    <li>El rol y estado son gestionados por administradores</li>
                    <li>Los datos se actualizan automáticamente al iniciar sesión</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Perfil;
