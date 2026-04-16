import type { Usuario } from '@/types';

export interface UsuarioFormData {
  email: string;
  nombre: string;
  rol: Usuario['rol'];
  estado: Usuario['estado'];
  fotoPerfil: string;
}

export const DEFAULT_USUARIO_FORM_DATA: UsuarioFormData = {
  email: '',
  nombre: '',
  rol: 'estandar',
  estado: 'activo',
  fotoPerfil: ''
};
