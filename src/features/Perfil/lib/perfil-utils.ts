import type { PerfilFormData } from './perfil.types';

export const INITIAL_PERFIL_FORM_DATA: PerfilFormData = {
  fotoPerfil: ''
};

export const getUserInitials = (displayName?: string | null): string => {
  if (!displayName) {
    return 'U';
  }

  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return initials || 'U';
};
