import { useCallback, useEffect, useMemo, useState } from 'react';
import { DatabaseService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import type { Usuario } from '@/types';
import { INITIAL_PERFIL_FORM_DATA } from '../lib/perfil-utils';
import type { PerfilFormData } from '../lib/perfil.types';

export const usePerfilData = () => {
  const dbService = useMemo(() => new DatabaseService(), []);
  const { user, userProfile } = useAuth();
  const { showSuccess, showError } = useToast();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<PerfilFormData>(INITIAL_PERFIL_FORM_DATA);

  const loadUsuario = useCallback(async () => {
    if (!user || !userProfile?.email) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log('Perfil: Cargando usuario por email:', userProfile.email);
      const currentUser = await dbService.getUserByEmail(userProfile.email);

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
  }, [dbService, showError, user, userProfile]);

  useEffect(() => {
    void loadUsuario();
  }, [loadUsuario]);

  const handleSave = useCallback(async () => {
    if (!usuario) {
      return;
    }

    setIsSaving(true);
    try {
      await dbService.updateUsuario(usuario.id, {
        fotoPerfil: formData.fotoPerfil
      });

      setUsuario((prev) => (prev ? { ...prev, fotoPerfil: formData.fotoPerfil } : null));
      setIsEditing(false);
      showSuccess('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error updating perfil:', error);
      showError('Error al actualizar perfil: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  }, [dbService, formData.fotoPerfil, showError, showSuccess, usuario]);

  const handleCancel = useCallback(() => {
    if (usuario) {
      setFormData({
        fotoPerfil: usuario.fotoPerfil || userProfile?.photoURL || ''
      });
    }
    setIsEditing(false);
  }, [userProfile?.photoURL, usuario]);

  return {
    user,
    userProfile,
    usuario,
    isLoading,
    isSaving,
    isEditing,
    formData,
    setIsEditing,
    setFormData,
    handleSave,
    handleCancel
  };
};
