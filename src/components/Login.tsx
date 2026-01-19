import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Loader2, LogIn } from 'lucide-react';

const Login: React.FC = () => {
  const { signInWithMicrosoft, user, loading } = useAuth();
  const [recinto, setRecinto] = useState<string>(() => localStorage.getItem('recinto') || 'CCCI');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    setErrorMsg(null);

    // Validate selected recinto and email domain before triggering provider
    // We rely on the Microsoft popup to provide the email; here we only ensure a recinto is selected
    if (!recinto) {
      setErrorMsg('Selecciona un recinto antes de iniciar sesión');
      return;
    }

    try {
      // persist selection for subsequent app usage
      localStorage.setItem('recinto', recinto);
      await signInWithMicrosoft(recinto);
    } catch (err) {
      console.error('Error during login:', err);
      const error = err as Error;
      setErrorMsg(error?.message || 'Error al iniciar sesión');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <img
            src="https://costaricacc.com/cccr/Logoheroica.png"
            alt="Logo Heroica"
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Card de Login */}
        <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Revisión de Eventos
            </CardTitle>
            <CardDescription className="text-base">
              Sistema de gestión de revisiones de calidad
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Inicia sesión con tu cuenta Microsoft para continuar
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Recinto</label>
                <select
                  value={recinto}
                  onChange={(e) => setRecinto(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 bg-background"
                >
                  <option value="CCCI">CCCI</option>
                  <option value="CCCR">CCCR</option>
                  <option value="CEVP">CEVP</option>
                </select>
              </div>

              <Button
                onClick={handleLogin}
                className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 shadow-lg hover:shadow-xl"
                size="lg"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Iniciar Sesión con Microsoft
              </Button>

              {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Solo se permiten cuentas Microsoft corporativas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            © 2025 Grupo Heroica - Sistema de Revisión de Calidad
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
