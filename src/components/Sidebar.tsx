import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  MapPin,
  Settings,
  FileText,
  CheckSquare,
  Users,
  User,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  onNavigate?: () => void;
  showHeader?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, showHeader = true }) => {
  const location = useLocation();
  const { logout, user, userProfile } = useAuth();

  // Función para obtener las iniciales del usuario
  const getUserInitials = (name: string | null, email: string | null): string => {
    if (name) {
      const names = name.trim().split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      // Si solo hay un nombre, intentar sacar 2 letras
      const first = names[0] || '';
      const a = first[0] || 'U';
      const b = first[1] || '';
      return (a + b).toUpperCase();
    }
    if (email) {
      const local = email.split('@')[0] || '';
      const parts = local.split(/[._-]+/).filter(Boolean);
      if (parts.length >= 2) {
        const a = parts[0][0] || 'U';
        const b = parts[parts.length - 1][0] || '';
        return (a + b).toUpperCase();
      }
      const a = local[0] || 'U';
      const b = local[1] || '';
      return (a + b).toUpperCase();
    }
    return 'U';
  };

  const allMenuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/areas', label: 'Áreas', icon: MapPin },
    { path: '/parametros', label: 'Parámetros', icon: Settings },
    { path: '/revision-areas', label: 'Revisión Áreas', icon: CheckSquare },
    { path: '/revision-calidad', label: 'Revisión Calidad', icon: CheckSquare },
    { path: '/reportes', label: 'Reportes', icon: FileText },
    { path: '/usuarios', label: 'Usuarios', icon: Users },
    { path: '/perfil', label: 'Perfil', icon: User },
  ];

  // Filtrar menú según rol
  const role = userProfile?.role || 'estandar';
  let menuItems = allMenuItems;

  if (role === 'estandar') {
    menuItems = allMenuItems.filter(item => ['/revision-areas', '/reportes', '/perfil'].includes(item.path));
  } else if (role === 'calidad') {
    menuItems = allMenuItems.filter(item => ['/', '/areas', '/parametros', '/revision-areas', '/revision-calidad', '/reportes', '/perfil'].includes(item.path));
  } else if (role === 'administrador') {
    menuItems = allMenuItems; // todos
  }

  const handleNavigation = () => {
    // Llamar onNavigate solo en modo móvil (cuando la prop existe)
    if (onNavigate) {
      onNavigate();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      if (onNavigate) {
        onNavigate();
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className={`h-full w-full bg-gradient-to-b from-card to-card/50 shadow-xl flex flex-col ${
      showHeader ? 'border-r border-border/50' : ''
    }`}>
      {/* Header con Logo */}
      {showHeader && (
        <div className="p-6 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <img
              src="https://costaricacc.com/cccr/Logoheroica.png"
              alt="Logo Heroica"
              className="h-8 w-auto object-contain"
            />
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Revisión
              </h1>
              <p className="text-xs text-muted-foreground">de Eventos</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 ${showHeader ? 'mt-6' : 'mt-2'} px-3 overflow-y-auto`}>
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={handleNavigation}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className={`w-full justify-start mb-1 transition-all duration-300 font-medium ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md border-l-4 border-secondary transform scale-105'
                      : 'hover:bg-accent hover:text-accent-foreground hover:translate-x-2 hover:scale-105 text-foreground'
                  }`}
                >
                  <Icon className="mr-3 h-4 w-4 transition-transform duration-200" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border/50 mt-auto flex-shrink-0 pb-6">
        {/* User Profile Section */}
        {user && userProfile && (
          <div className="mb-3 p-3 bg-accent/20 rounded-lg border border-border/30">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div
                  className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center border-2 border-primary/20"
                  aria-label="Avatar de usuario"
                  title={userProfile.displayName || userProfile.email || 'Usuario'}
                >
                  <span className="text-sm font-semibold text-primary-foreground">
                    {getUserInitials(userProfile.displayName, userProfile.email)}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-background rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {userProfile.displayName || `${userProfile.firstName} ${userProfile.lastName}`.trim() || 'Usuario'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {userProfile.email}
                </p>
                {userProfile.jobTitle && (
                  <p className="text-xs text-muted-foreground/80 truncate">
                    {userProfile.jobTitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          className="w-full justify-start hover:bg-destructive/10 hover:text-destructive hover:scale-105 transition-all duration-300 font-medium"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-4 w-4 transition-transform duration-200" />
          <span className="font-medium">Cerrar Sesión</span>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
