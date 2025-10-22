/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, microsoftProvider, RECINTO_CONFIGS } from '@/services/firebase';
import { DatabaseService, setDatabaseForRecinto } from '@/services/database';
import type { Usuario } from '@/types';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  department?: string;
  role?: Usuario['rol'];
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithMicrosoft: (recinto?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Función para registrar/actualizar usuario en Firebase Database
const ensureUserInDatabase = async (firebaseUser: User, dbService: DatabaseService) => {
  try {
    console.log('AuthContext: Verificando usuario en base de datos...', firebaseUser.email);
    
    // Verificar si el usuario ya existe en Firebase Database por UID (más eficiente)
    let existingUser = await dbService.getUserByUid(firebaseUser.uid);
    
    // Si no existe por UID, buscar por email como fallback
    if (!existingUser) {
      existingUser = await dbService.getUserByEmail(firebaseUser.email!);
    }
    
    if (!existingUser) {
      console.log('AuthContext: Usuario no encontrado, creando nuevo registro...');
      
      // Crear nuevo usuario en Firebase Database
      const newUsuario: Omit<Usuario, 'id'> = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        nombre: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
        rol: 'estandar' as Usuario['rol'],
        estado: 'activo' as Usuario['estado'],
        fotoPerfil: firebaseUser.photoURL || '',
        fechaCreacion: new Date().toISOString(),
        ultimoAcceso: new Date().toISOString()
      };
      
      await dbService.createUsuario(newUsuario);
      console.log('AuthContext: Usuario creado en base de datos');
    } else {
      console.log('AuthContext: Usuario existente encontrado, actualizando último acceso...');
      
      // Solo actualizar último acceso si han pasado más de 5 minutos desde la última actualización
      const lastAccess = existingUser.ultimoAcceso ? new Date(existingUser.ultimoAcceso).getTime() : 0;
      const now = new Date().getTime();
      const fiveMinutes = 5 * 60 * 1000; // 5 minutos en milisegundos
      
      if (now - lastAccess > fiveMinutes) {
        // Actualizar información si es necesario
        const updatedData: Partial<Usuario> = {
          ultimoAcceso: new Date().toISOString(),
          // Sincronizar información de Microsoft si ha cambiado
          nombre: firebaseUser.displayName || existingUser.nombre,
          fotoPerfil: firebaseUser.photoURL || existingUser.fotoPerfil,
          // Asegurar que el UID esté presente
          uid: firebaseUser.uid
        };
        
        await dbService.updateUsuario(existingUser.id, updatedData);
        console.log('AuthContext: Información de usuario actualizada');
      } else {
        console.log('AuthContext: Usuario actualizado recientemente, omitiendo actualización');
      }
    }
  } catch (error) {
    console.error('AuthContext: Error al gestionar usuario en base de datos:', error);
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Crear instancia de DatabaseService una sola vez
  // Antes de crearla, revisar si hay recinto en localStorage y establecer DB
  useEffect(() => {
    const stored = localStorage.getItem('recinto');
    if (stored) {
      setDatabaseForRecinto(stored);
    }
  }, []);

  const dbService = useMemo(() => new DatabaseService(), []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        // Asegurar que el usuario esté registrado en Firebase Database
        await ensureUserInDatabase(user, dbService);
        
        // Crear perfil del usuario con información de Microsoft
        // Intentar obtener el registro completo del usuario para leer el rol y la foto almacenada en la DB
        let dbUserRole: Usuario['rol'] | undefined;
        let dbUserFoto: string | undefined;
        try {
          const found = await dbService.getUserByEmail(user.email || '');
          dbUserRole = found?.rol;
          dbUserFoto = found?.fotoPerfil;
        } catch {
          // ignore, ya se hizo log dentro del servicio
        }

        const resolvedPhoto = dbUserFoto && dbUserFoto.trim() !== '' ? dbUserFoto : (user.photoURL || null);

        const profile: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: resolvedPhoto,
          // Extraer información adicional si está disponible
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          role: dbUserRole,
        };
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [dbService]);

  const signInWithMicrosoft = async (recinto?: string) => {
    try {
      if (recinto) {
        // Set DB instances for the selected recinto before login
        setDatabaseForRecinto(recinto);
      }

      const result = await signInWithPopup(auth, microsoftProvider);
      const user = result.user;

      console.log('Usuario autenticado con Microsoft:', user);

      // Validar dominio del correo según recinto seleccionado
      try {
        const email = user.email || '';
        if (recinto) {
          const cfg = RECINTO_CONFIGS[recinto];
          if (cfg && cfg.allowedDomains && cfg.allowedDomains.length) {
            const matched = cfg.allowedDomains.some(domain => email.endsWith(domain));
            if (!matched) {
              // Dominio no permitido: cerrar sesión inmediatamente y alertar
              await signOut(auth);
              throw new Error('El dominio de tu cuenta no está autorizado para el recinto seleccionado.');
            }
          }
        }
      } catch (validationError) {
        console.error('AuthContext: Validación de dominio fallida', validationError);
        throw validationError;
      }
    } catch (error) {
      console.error('Error signing in with Microsoft:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signInWithMicrosoft,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
