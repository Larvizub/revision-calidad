export interface Evento {
  id: string;
  idEvento: number;
  nombre: string;
  descripcion?: string;
  fechaCreacion: string;
  fechaEvento?: string;
  estado: 'activo' | 'inactivo';
}

export interface Area {
  id: string;
  nombre: string;
  descripcion?: string;
  estado: 'activo' | 'inactivo';
}

export interface Parametro {
  id: string;
  idArea: string;
  nombre: string;
  estado: 'activo' | 'inactivo';
}

export interface Revision {
  id: string;
  idEvento: string;
  idArea: string;
  idUsuario: string;
  fechaRevision: string;
  resultados: { [parametroId: string]: 'cumple' | 'no_cumple' | 'no_aplica' };
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  // Comentario original del revisor (creador de la revisión)
  comentarios?: string;
  // Comentario adicional del equipo de calidad
  comentariosCalidad?: string;
  // URLs de evidencias (imágenes) subidas por el verificador de calidad
  evidencias?: string[];
  aprobadoPor?: string;
  aprobadoPorUid?: string;
  fechaAprobacion?: string;
  // Para la verificación de calidad
  verificacionCalidad?: { [parametroId: string]: 'verificado' | 'pendiente' | 'no_cumple' };
}

export interface Usuario {
  id: string;
  uid?: string; // UID de Firebase Auth
  email: string;
  nombre: string;
  rol: 'administrador' | 'estandar' | 'calidad';
  estado: 'activo' | 'inactivo';
  fechaCreacion: string;
  ultimoAcceso?: string; // Último acceso del usuario
  fotoPerfil?: string;
}

export interface Reporte {
  id: string;
  tipo: 'revisiones_evento' | 'revisiones_area' | 'verificaciones_calidad' | 'general' | 'aprobaciones_pendientes';
  nombre: string;
  fechaGeneracion: string;
  urlPdf?: string;
  urlExcel?: string;
  filtros: {
    idEvento?: string;
    nombreEvento?: string;
    idArea?: string;
    nombreArea?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    estado?: 'pendiente' | 'aprobado' | 'rechazado' | 'todos';
    usuarioCreador?: string;
  };
  generadoPor: string;
  datosReporte?: Record<string, unknown>; // Datos específicos del reporte generado
}
