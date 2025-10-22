import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="fixed inset-0 flex bg-background overflow-hidden">
      {/* Sidebar Desktop */}
      <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Sidebar Mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
        sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="fixed inset-0 bg-black/50 transition-opacity duration-300" onClick={closeSidebar} />
        <div className={`fixed inset-y-0 left-0 w-64 bg-card shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col ${
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
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-card border-b border-border/50 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="hover:bg-accent transition-colors duration-200"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-3">
            <img
              src="https://costaricacc.com/cccr/Logoheroica.png"
              alt="Logo Heroica"
              className="h-6 w-auto object-contain"
            />
            <div>
              <h1 className="text-base font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Revisión de Eventos
              </h1>
            </div>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
