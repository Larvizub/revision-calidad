import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ToastProvider';
import { ToastContainer } from './components/ToastContainer';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './features/Dashboard/Dashboard';
import Eventos from './features/Eventos/Eventos';
import Areas from './features/Areas/Areas';
import Parametros from './features/Parametros/Parametros';
import RevisionAreas from './features/RevisionAreas/RevisionAreas';
import RevisionCalidad from './features/RevisionCalidad/RevisionCalidad';
import Reportes from './features/Reportes/Reportes';
import Usuarios from './features/Usuarios/Usuarios';
import Perfil from './features/Perfil/Perfil';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="eventos" element={<Eventos />} />
              <Route path="areas" element={<Areas />} />
              <Route path="parametros" element={<Parametros />} />
              <Route path="revision-areas" element={<RevisionAreas />} />
              <Route path="revision-calidad" element={<RevisionCalidad />} />
              <Route path="reportes" element={<Reportes />} />
              <Route path="usuarios" element={<Usuarios />} />
              <Route path="perfil" element={<Perfil />} />
            </Route>
          </Routes>
          <ToastContainer />
          <PWAInstallPrompt />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
