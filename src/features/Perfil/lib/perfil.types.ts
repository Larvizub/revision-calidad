import type { Usuario } from '@/types';

export interface PerfilFormData {
  fotoPerfil: string;
}

export interface RoleDisplayConfig {
  label: string;
  colorClass: string;
  bgClass: string;
}

export type UsuarioRol = Usuario['rol'];
