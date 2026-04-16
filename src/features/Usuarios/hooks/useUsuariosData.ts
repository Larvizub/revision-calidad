import { useState, useEffect, useCallback, useMemo } from 'react';
import { DatabaseService } from '@/services/database';
import { useToast } from '@/hooks/useToast';
import type { Usuario } from '@/types';
import { DEFAULT_USUARIO_FORM_DATA, type UsuarioFormData } from '../lib/usuarios.types';

export const useUsuariosData = () => {
  const dbService = useMemo(() => new DatabaseService(), []);
  const { showSuccess, showError } = useToast();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [formData, setFormData] = useState<UsuarioFormData>(DEFAULT_USUARIO_FORM_DATA);

  const loadUsuarios = useCallback(async () => {
    setIsLoading(true);
    try {
      const usuariosData = await dbService.getUsuarios();
      setUsuarios(usuariosData);
    } catch (error) {
      console.error('Error loading usuarios:', error);
      showError('Error al cargar usuarios: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [showError, dbService]);

  useEffect(() => {
    loadUsuarios();
  }, [loadUsuarios]);

  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((usuario) => {
      const matchesSearch =
        (usuario.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (usuario.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRol = filterRol === 'todos' || usuario.rol === filterRol;
      const matchesEstado = filterEstado === 'todos' || usuario.estado === filterEstado;
      return matchesSearch && matchesRol && matchesEstado;
    });
  }, [usuarios, searchTerm, filterRol, filterEstado]);

  const resetForm = () => {
    setFormData(DEFAULT_USUARIO_FORM_DATA);
    setEditingUsuario(null);
    setShowForm(false);
  };

  const handleCreate = () => {
    showError('Los usuarios se registran automáticamente al iniciar sesión con Microsoft');
  };

  const handleEdit = (usuario: Usuario) => {
    setFormData({
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      estado: usuario.estado,
      fotoPerfil: usuario.fotoPerfil || ''
    });
    setEditingUsuario(usuario);
    setShowForm(true);
  };

  const handleDelete = (usuario: Usuario) => {
    setUsuarioToDelete(usuario);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!usuarioToDelete) return;

    try {
      setIsSaving(true);
      await dbService.deleteUsuario(usuarioToDelete.id);
      setUsuarios((prev) => prev.filter((usuario) => usuario.id !== usuarioToDelete.id));
      showSuccess('Usuario eliminado exitosamente');
      setShowDeleteConfirm(false);
      setUsuarioToDelete(null);
    } catch (error) {
      console.error('Error deleting usuario:', error);
      showError('Error al eliminar usuario: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUsuario) {
      showError('Solo se permite editar usuarios existentes. Los usuarios se registran automáticamente.');
      return;
    }

    if (!formData.email.trim() || !formData.nombre.trim()) {
      showError('Email y nombre son obligatorios');
      return;
    }

    const emailExists = usuarios.some(
      (usuario) =>
        usuario.email.toLowerCase() === formData.email.toLowerCase() &&
        usuario.id !== editingUsuario.id
    );

    if (emailExists) {
      showError('Ya existe un usuario con este email');
      return;
    }

    try {
      setIsSaving(true);
      const usuarioData: Partial<Usuario> = {
        rol: formData.rol,
        estado: formData.estado,
        fotoPerfil: formData.fotoPerfil ? formData.fotoPerfil : undefined,
        ultimoAcceso: new Date().toISOString()
      };

      await dbService.updateUsuario(editingUsuario.id, usuarioData);

      setUsuarios((prev) =>
        prev.map((usuario) =>
          usuario.id === editingUsuario.id ? { ...usuario, ...usuarioData } : usuario
        )
      );

      showSuccess('Usuario actualizado exitosamente');
      resetForm();
    } catch (error) {
      console.error('Error saving usuario:', error);
      showError('Error al guardar usuario: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    usuarios,
    isLoading,
    showForm,
    setShowForm,
    editingUsuario,
    isSaving,
    showDeleteConfirm,
    setShowDeleteConfirm,
    usuarioToDelete,
    searchTerm,
    setSearchTerm,
    filterRol,
    setFilterRol,
    filterEstado,
    setFilterEstado,
    formData,
    setFormData,
    filteredUsuarios,
    resetForm,
    handleCreate,
    handleEdit,
    handleDelete,
    confirmDelete,
    handleSubmit
  };
};
