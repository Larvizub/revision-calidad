import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { setDatabaseForRecinto } from './services/database';

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Verificar actualizaciones
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nueva versión disponible
                console.log('Nueva versión de la app disponible');
                // Aquí podrías mostrar una notificación al usuario
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Manejar evento de instalación de PWA
let deferredPrompt: Event | null = null;
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA install prompt available');
  // Prevenir que se muestre automáticamente
  e.preventDefault();
  // Guardar el evento para usarlo después
  deferredPrompt = e;
  
  // Opcional: mostrar un botón de instalación personalizado
  // showInstallButton();
});

// Detectar cuando la PWA se instala
window.addEventListener('appinstalled', () => {
  console.log('PWA installed successfully');
  if (deferredPrompt) {
    deferredPrompt = null;
  }
});

// Inicializar selección de recinto antes de que los componentes creen DatabaseService
try {
  const storedRecinto = localStorage.getItem('recinto');
  if (storedRecinto) {
    console.log('Boot: seteando recinto desde localStorage ->', storedRecinto);
    setDatabaseForRecinto(storedRecinto);
  }
} catch {
  // localStorage puede no estar disponible en algunos entornos (tests/ssr)
  // no hacemos nada si falla
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
