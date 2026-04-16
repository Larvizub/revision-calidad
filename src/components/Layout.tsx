import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const { currentRecinto } = useAuth();

  const displayRecinto = currentRecinto || localStorage.getItem('recinto') || 'CCCI';

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      {/* Top Header */}
      <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="flex h-full items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden hover:bg-accent transition-colors duration-200"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <img
              src="https://costaricacc.com/cccr/Logoheroica.png"
              alt="Logo Heroica"
              className="h-8 w-auto object-contain"
            />
            <div>
              <h1 className="hidden sm:block text-base font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Revisión de Eventos
              </h1>
              <p className="hidden sm:block text-xs text-muted-foreground">Control de calidad operativo</p>
            </div>
          </div>
          <div className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 leading-none">
            <span className="text-xs font-medium text-muted-foreground leading-none">
              Recinto actual:
            </span>
            <span className="text-sm font-semibold text-muted-foreground leading-none">
              {displayRecinto}
            </span>
          </div>
        </div>
      </header>

      {/* Sidebar Desktop Floating */}
      <div className="hidden lg:block">
        <div
          className={`fixed left-4 top-20 bottom-4 z-30 transition-all duration-300 ease-out ${
            sidebarExpanded ? 'w-72' : 'w-20'
          }`}
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
        >
          <Sidebar collapsed={!sidebarExpanded} floating showHeader={false} />
        </div>
      </div>

      {/* Sidebar Mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
        sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="fixed inset-0 bg-black/50 transition-opacity duration-300" onClick={closeSidebar} />
        <div className={`fixed left-4 right-4 top-20 bottom-4 bg-card shadow-xl rounded-2xl border border-border/60 transform transition-transform duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`} style={{ paddingBottom: 'env(safe-area-inset-bottom, 1rem)' }}>
          <div className="flex items-center justify-between p-4 border-b border-border/50 flex-shrink-0">
            <span className="font-semibold text-foreground">Menú</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeSidebar}
              className="hover:bg-accent transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 min-h-0">
            <Sidebar onNavigate={closeSidebar} showHeader={false} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-full pt-16">
        <main className="h-full min-h-0 overflow-auto px-4 pb-4 lg:pl-28 lg:pr-6 lg:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
