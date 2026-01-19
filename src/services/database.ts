import { ref, push, set, get, update, remove, onValue } from 'firebase/database';
import { getDatabaseForRecinto, functions } from './firebase';
import { httpsCallable } from 'firebase/functions';
import type { Database } from 'firebase/database';

// Instancia de base de datos por defecto (se usará si no se proporciona recinto)
let currentDatabase: Database | null = null;

export function setDatabaseForRecinto(recinto?: string) {
  currentDatabase = getDatabaseForRecinto(recinto);
}
import type { Area, Evento, Parametro, Revision, Reporte, Usuario } from '@/types';

export class DatabaseService {
  private db = currentDatabase ?? getDatabaseForRecinto();
  private eventosRef = ref(this.db, 'eventos');
  private areasRef = ref(this.db, 'areas');
  private parametrosRef = ref(this.db, 'parametros');
  private revisionesRef = ref(this.db, 'revisiones');
  private reportesRef = ref(this.db, 'reportes');
  private usuariosRef = ref(this.db, 'usuarios');

  constructor() {
    try {
      console.log('DatabaseService: Inicializando con base de datos URL:', this.db.app.options.databaseURL);
      console.log('DatabaseService: Referencia usuarios:', this.usuariosRef.toString());
    } catch (error) {
      console.warn('DatabaseService: Error leyendo información de la base de datos en constructor', error);
    }
  }

  // Crear un nuevo evento
  async createEvento(evento: Omit<Evento, 'id'>): Promise<string> {
    const newEventoRef = push(this.eventosRef);
    await set(newEventoRef, evento);
    return newEventoRef.key!;
  }

  // Obtener todos los eventos
  async getEventos(): Promise<Evento[]> {
    const snapshot = await get(this.eventosRef);
    if (snapshot.exists()) {
      const eventos: Evento[] = [];
      snapshot.forEach((childSnapshot) => {
        eventos.push({
          id: childSnapshot.key!,
          ...childSnapshot.val(),
        });
      });
      return eventos;
    }
    return [];
  }

  // Obtener evento por ID
  async getEventoById(id: string): Promise<Evento | null> {
  const eventoRef = ref(this.db, `eventos/${id}`);
  const snapshot = await get(eventoRef);
    if (snapshot.exists()) {
      return {
        id: snapshot.key!,
        ...snapshot.val(),
      };
    }
    return null;
  }

  // Buscar evento por ID de evento o nombre
  async searchEventos(searchTerm: string): Promise<Evento[]> {
    const eventos = await this.getEventos();
    return eventos.filter(evento =>
      evento.idEvento.toString().includes(searchTerm) ||
      evento.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Actualizar evento
  async updateEvento(id: string, updates: Partial<Evento>): Promise<void> {
  const eventoRef = ref(this.db, `eventos/${id}`);
  await update(eventoRef, updates);
  }

  // Eliminar evento
  async deleteEvento(id: string): Promise<void> {
  const eventoRef = ref(this.db, `eventos/${id}`);
  await remove(eventoRef);
  }

  // Importar eventos desde Excel
  async importEventosFromExcel(eventos: Omit<Evento, 'id'>[]): Promise<void> {
    const updates: { [key: string]: Omit<Evento, 'id'> } = {};
    eventos.forEach(evento => {
      const newKey = push(this.eventosRef).key!;
      updates[newKey] = evento;
    });
    await update(this.eventosRef, updates);
  }

  // Obtener eventos desde Skill API via Cloud Function
  async getSkillEventsFromAPI(month: number, year: number): Promise<Array<{ idEvento: number; nombre: string }>> {
    try {
      const getSkillEvents = httpsCallable(functions, 'getSkillEvents');
      const result = await getSkillEvents({ month, year });
      const data = result.data as { success: boolean, events: Array<{ idEvento: number; nombre: string }> };
      
      if (data.success) {
        return data.events;
      }
      return [];
    } catch (error) {
      console.error('Error calling getSkillEvents cloud function:', error);
      throw error;
    }
  }

  // Métodos para áreas

  // Crear una nueva área
  async createArea(area: Omit<Area, 'id'>): Promise<string> {
    try {
      const newAreaRef = push(this.areasRef);
      await set(newAreaRef, area);
      return newAreaRef.key!;
    } catch (error) {
      console.error('DatabaseService: Error al crear área:', error);
      throw error;
    }
  }

  // Obtener todas las áreas
  async getAreas(): Promise<Area[]> {
    try {
      const snapshot = await get(this.areasRef);
      if (snapshot.exists()) {
        const areas: Area[] = [];
        snapshot.forEach((childSnapshot) => {
          areas.push({
            id: childSnapshot.key!,
            ...childSnapshot.val(),
          });
        });
        return areas;
      }
      return [];
    } catch (error) {
      console.error('DatabaseService: Error al obtener áreas:', error);
      throw error;
    }
  }

  // Obtener área por ID
  async getAreaById(id: string): Promise<Area | null> {
  const areaRef = ref(this.db, `areas/${id}`);
  const snapshot = await get(areaRef);
    if (snapshot.exists()) {
      return {
        id: snapshot.key!,
        ...snapshot.val(),
      };
    }
    return null;
  }

  // Buscar área por nombre
  async searchAreas(searchTerm: string): Promise<Area[]> {
    const areas = await this.getAreas();
    return areas.filter(area =>
      area.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Actualizar área
  async updateArea(id: string, updates: Partial<Area>): Promise<void> {
  const areaRef = ref(this.db, `areas/${id}`);
  await update(areaRef, updates);
  }

  // Eliminar área
  async deleteArea(id: string): Promise<void> {
  const areaRef = ref(this.db, `areas/${id}`);
  await remove(areaRef);
  }

  // Importar áreas desde Excel
  async importAreasFromExcel(areas: Omit<Area, 'id'>[]): Promise<void> {
    const updates: { [key: string]: Omit<Area, 'id'> } = {};
    areas.forEach(area => {
      const newKey = push(this.areasRef).key!;
      updates[newKey] = area;
    });
    await update(this.areasRef, updates);
  }

  // Métodos para parámetros

  // Crear un nuevo parámetro
  async createParametro(parametro: Omit<Parametro, 'id'>): Promise<string> {
    try {
      const newParametroRef = push(this.parametrosRef);
      await set(newParametroRef, parametro);
      return newParametroRef.key!;
    } catch (error) {
      console.error('DatabaseService: Error al crear parámetro:', error);
      throw error;
    }
  }

  // Obtener todos los parámetros
  async getParametros(): Promise<Parametro[]> {
    try {
      const snapshot = await get(this.parametrosRef);
      if (snapshot.exists()) {
        const parametros: Parametro[] = [];
        snapshot.forEach((childSnapshot) => {
          parametros.push({
            id: childSnapshot.key!,
            ...childSnapshot.val(),
          });
        });
        return parametros;
      }
      return [];
    } catch (error) {
      console.error('DatabaseService: Error al obtener parámetros:', error);
      throw error;
    }
  }

  // Obtener parámetro por ID
  async getParametroById(id: string): Promise<Parametro | null> {
  const parametroRef = ref(this.db, `parametros/${id}`);
  const snapshot = await get(parametroRef);
    if (snapshot.exists()) {
      return {
        id: snapshot.key!,
        ...snapshot.val(),
      };
    }
    return null;
  }

  // Buscar parámetros por nombre
  async searchParametros(searchTerm: string): Promise<Parametro[]> {
    const parametros = await this.getParametros();
    return parametros.filter(parametro =>
      parametro.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Actualizar parámetro
  async updateParametro(id: string, updates: Partial<Parametro>): Promise<void> {
  const parametroRef = ref(this.db, `parametros/${id}`);
  await update(parametroRef, updates);
  }

  // Eliminar parámetro
  async deleteParametro(id: string): Promise<void> {
  const parametroRef = ref(this.db, `parametros/${id}`);
  await remove(parametroRef);
  }

  // Importar parámetros desde Excel
  async importParametrosFromExcel(parametros: Omit<Parametro, 'id'>[]): Promise<void> {
    const updates: { [key: string]: Omit<Parametro, 'id'> } = {};
    parametros.forEach(parametro => {
      const newKey = push(this.parametrosRef).key!;
      updates[newKey] = parametro;
    });
    await update(this.parametrosRef, updates);
  }

  // Métodos para revisiones

  // Crear una nueva revisión
  async createRevision(revision: Omit<Revision, 'id'>): Promise<string> {
    try {
      const newRevisionRef = push(this.revisionesRef);
      // Limpiar valores undefined para evitar que Firebase rechace la escritura
      const cleaned: Record<string, unknown> = {};
      Object.entries(revision).forEach(([k, v]) => {
        if (v !== undefined) cleaned[k] = v as unknown;
      });
  await set(newRevisionRef, cleaned);
  // Emitir evento global para que la UI pueda sincronizarse
  try { window.dispatchEvent(new Event('revisiones:changed')); } catch { /* noop server-side */ }
  return newRevisionRef.key!;
    } catch (error) {
      console.error('DatabaseService: Error al crear revisión:', error);
      throw error;
    }
  }

  // Obtener todas las revisiones
  async getRevisiones(): Promise<Revision[]> {
    try {
      const snapshot = await get(this.revisionesRef);
      if (snapshot.exists()) {
        const revisiones: Revision[] = [];
        snapshot.forEach((childSnapshot) => {
          revisiones.push({
            id: childSnapshot.key!,
            ...childSnapshot.val(),
          });
        });
        return revisiones;
      }
      return [];
    } catch (error) {
      console.error('DatabaseService: Error al obtener revisiones:', error);
      throw error;
    }
  }

  // Escuchar revisiones en tiempo real. Devuelve una función para desuscribirse
  onRevisionesChange(listener: (revisiones: Revision[]) => void): () => void {
    try {
      const unsubscribe = onValue(this.revisionesRef, (snapshot) => {
        const revisiones: Revision[] = [];
        snapshot.forEach((childSnapshot) => {
          revisiones.push({
            id: childSnapshot.key!,
            ...childSnapshot.val(),
          });
        });
        listener(revisiones);
      }, (error) => {
        console.error('DatabaseService: Error en listener de revisiones:', error);
      });
      return () => { try { unsubscribe(); } catch { /* ignorar */ } };
    } catch (error) {
      console.error('DatabaseService: Error al inicializar listener de revisiones:', error);
      return () => {};
    }
  }

  // Obtener revisiones pendientes de calidad
  async getRevisionesPendientes(): Promise<Revision[]> {
    try {
      const revisiones = await this.getRevisiones();
      return revisiones.filter(revision => revision.estado === 'pendiente');
    } catch (error) {
      console.error('DatabaseService: Error al obtener revisiones pendientes:', error);
      throw error;
    }
  }

  // Obtener revisión por ID
  async getRevisionById(id: string): Promise<Revision | null> {
    try {
  const revisionRef = ref(this.db, `revisiones/${id}`);
  const snapshot = await get(revisionRef);
      if (snapshot.exists()) {
        return {
          id: snapshot.key!,
          ...snapshot.val(),
        };
      }
      return null;
    } catch (error) {
      console.error('DatabaseService: Error al obtener revisión:', error);
      throw error;
    }
  }
  
    // Eliminar revisión
    async deleteRevision(id: string): Promise<void> {
      try {
        const revisionRef = ref(this.db, `revisiones/${id}`);
  await remove(revisionRef);
  try { window.dispatchEvent(new Event('revisiones:changed')); } catch { /* noop */ }
      } catch (error) {
        console.error('DatabaseService: Error al eliminar revisión:', error);
        throw error;
      }
    }

  // Actualizar revisión (para verificación de calidad)
  async updateRevision(id: string, updates: Partial<Revision>): Promise<void> {
    try {
  const revisionRef = ref(this.db, `revisiones/${id}`);
  // Limpiar valores undefined porque Firebase update() rechaza undefined en los valores
  const cleanedUpdates: Partial<Record<string, unknown>> = {};
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) cleanedUpdates[key] = value as unknown;
  });
  // Si no hay nada para actualizar, omitir
  if (Object.keys(cleanedUpdates).length === 0) return;
  await update(revisionRef, cleanedUpdates as Record<string, unknown>);
  try { window.dispatchEvent(new Event('revisiones:changed')); } catch { /* noop */ }
    } catch (error) {
      console.error('DatabaseService: Error al actualizar revisión:', error);
      throw error;
    }
  }

  // Aprobar revisión
  async aprobarRevision(id: string, usuarioCalidad: string, comentarios?: string): Promise<void> {
    try {
      const updates: Partial<Revision> = {
        estado: 'aprobado',
        aprobadoPor: usuarioCalidad,
        fechaAprobacion: new Date().toISOString(),
        comentarios: comentarios || undefined
      };
      await this.updateRevision(id, updates);
    } catch (error) {
      console.error('DatabaseService: Error al aprobar revisión:', error);
      throw error;
    }
  }

  // Rechazar revisión
  async rechazarRevision(id: string, usuarioCalidad: string, comentarios?: string): Promise<void> {
    try {
      const updates: Partial<Revision> = {
        estado: 'rechazado',
        aprobadoPor: usuarioCalidad,
        fechaAprobacion: new Date().toISOString(),
        comentarios: comentarios || undefined
      };
      await this.updateRevision(id, updates);
    } catch (error) {
      console.error('DatabaseService: Error al rechazar revisión:', error);
      throw error;
    }
  }

  // Métodos para reportes

  // Crear un nuevo reporte
  async createReporte(reporte: Omit<Reporte, 'id'>): Promise<string> {
    try {
      const newReporteRef = push(this.reportesRef);
      // Limpiar valores undefined (incluyendo anidados) para evitar que RTDB rechace la escritura
      const cleanedReporte = JSON.parse(JSON.stringify(reporte));
      await set(newReporteRef, cleanedReporte);
      return newReporteRef.key!;
    } catch (error) {
      console.error('DatabaseService: Error al crear reporte:', error);
      throw error;
    }
  }

  // Obtener todos los reportes
  async getReportes(): Promise<Reporte[]> {
    try {
      const snapshot = await get(this.reportesRef);
      if (snapshot.exists()) {
        const reportes: Reporte[] = [];
        snapshot.forEach((childSnapshot) => {
          reportes.push({
            id: childSnapshot.key!,
            ...childSnapshot.val(),
          });
        });
        return reportes.sort((a, b) => new Date(b.fechaGeneracion).getTime() - new Date(a.fechaGeneracion).getTime());
      }
      return [];
    } catch (error) {
      console.error('DatabaseService: Error al obtener reportes:', error);
      throw error;
    }
  }

  // Obtener datos para reporte de revisiones por evento
  async getReporteRevisionesPorEvento(idEvento: string): Promise<{
    evento: Evento | null;
    revisiones: (Revision & { area?: Area; parametros?: Parametro[] })[];
  }> {
    try {
      const [evento, revisiones, areas, parametros] = await Promise.all([
        this.getEventoById(idEvento),
        this.getRevisiones(),
        this.getAreas(),
        this.getParametros()
      ]);

      const revisionesEvento = revisiones
        .filter(r => r.idEvento === idEvento)
        .map(revision => {
          const area = areas.find(a => a.id === revision.idArea);
          const parametrosArea = parametros.filter(p => p.idArea === revision.idArea);
          return {
            ...revision,
            area,
            parametros: parametrosArea
          };
        });

      return {
        evento,
        revisiones: revisionesEvento
      };
    } catch (error) {
      console.error('DatabaseService: Error al obtener datos de reporte:', error);
      throw error;
    }
  }

  // Obtener datos para reporte de verificaciones de calidad
  async getReporteVerificacionesCalidad(filtros?: {
    fechaDesde?: string;
    fechaHasta?: string;
    estado?: string;
  }): Promise<{
    revisiones: (Revision & { evento?: Evento; area?: Area })[];
  }> {
    try {
      const [revisiones, eventos, areas] = await Promise.all([
        this.getRevisiones(),
        this.getEventos(),
        this.getAreas()
      ]);

      let revisionesFiltradas = revisiones.filter(r => r.verificacionCalidad);

      if (filtros?.fechaDesde) {
        revisionesFiltradas = revisionesFiltradas.filter(r => 
          new Date(r.fechaRevision) >= new Date(filtros.fechaDesde!)
        );
      }

      if (filtros?.fechaHasta) {
        revisionesFiltradas = revisionesFiltradas.filter(r => 
          new Date(r.fechaRevision) <= new Date(filtros.fechaHasta!)
        );
      }

      if (filtros?.estado && filtros.estado !== 'todos') {
        revisionesFiltradas = revisionesFiltradas.filter(r => r.estado === filtros.estado);
      }

      const revisionesConDatos = revisionesFiltradas.map(revision => {
        const evento = eventos.find(e => e.id === revision.idEvento);
        const area = areas.find(a => a.id === revision.idArea);
        return {
          ...revision,
          evento,
          area
        };
      });

      return {
        revisiones: revisionesConDatos
      };
    } catch (error) {
      console.error('DatabaseService: Error al obtener verificaciones de calidad:', error);
      throw error;
    }
  }

  // CRUD para Usuarios
  async createUsuario(usuario: Omit<Usuario, 'id'>): Promise<string> {
    try {
      const newUsuarioRef = push(this.usuariosRef);
      await set(newUsuarioRef, usuario);
      return newUsuarioRef.key!;
    } catch (error) {
      console.error('DatabaseService: Error al crear usuario:', error);
      throw error;
    }
  }

  async getUsuarios(): Promise<Usuario[]> {
    try {
      console.log('DatabaseService: Obteniendo usuarios de Firebase...');
      const snapshot = await get(this.usuariosRef);
      console.log('DatabaseService: Snapshot existe:', snapshot.exists());
      
      if (snapshot.exists()) {
        const usuarios: Usuario[] = [];
        console.log('DatabaseService: Datos del snapshot:', snapshot.val());
        
        snapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val();
          console.log('DatabaseService: Usuario individual:', {
            id: childSnapshot.key,
            data: userData
          });
          
          usuarios.push({
            id: childSnapshot.key!,
            ...userData,
          });
        });
        
        console.log('DatabaseService: Total usuarios obtenidos:', usuarios.length);
        console.log('DatabaseService: Usuarios completos:', usuarios);
        
        return usuarios.sort((a, b) => {
          const nombreA = a.nombre || '';
          const nombreB = b.nombre || '';
          return nombreA.localeCompare(nombreB);
        });
      }
      
      console.log('DatabaseService: No hay usuarios en la base de datos');
      return [];
    } catch (error) {
      console.error('DatabaseService: Error al obtener usuarios:', error);
      throw error;
    }
  }

  async updateUsuario(id: string, usuario: Partial<Omit<Usuario, 'id'>>): Promise<void> {
    try {
  const usuarioRef = ref(this.db, `usuarios/${id}`);
  // Limpiar valores undefined para evitar que Firebase rechace la actualización o ignore claves
  const cleaned: Partial<Record<string, unknown>> = {};
  Object.entries(usuario).forEach(([k, v]) => {
    if (v !== undefined) cleaned[k] = v as unknown;
  });
  if (Object.keys(cleaned).length === 0) return;
  await update(usuarioRef, cleaned as Record<string, unknown>);
    } catch (error) {
      console.error('DatabaseService: Error al actualizar usuario:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<Usuario | null> {
    try {
      console.log('DatabaseService: Buscando usuario por email:', email);
      const snapshot = await get(this.usuariosRef);
      
      if (snapshot.exists()) {
        let foundUser: Usuario | null = null;
        snapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val();
          if (userData && userData.email === email) {
            foundUser = {
              id: childSnapshot.key!,
              ...userData
            };
            return true; // Romper el ciclo forEach
          }
        });
        
        console.log('DatabaseService: Usuario encontrado por email:', foundUser ? 'Sí' : 'No');
        return foundUser;
      }
      
      return null;
    } catch (error) {
      console.error('DatabaseService: Error al buscar usuario por email:', error);
      throw error;
    }
  }

  async getUserByUid(uid: string): Promise<Usuario | null> {
    try {
      console.log('DatabaseService: Buscando usuario por UID:', uid);
      const snapshot = await get(this.usuariosRef);
      
      if (snapshot.exists()) {
        let foundUser: Usuario | null = null;
        snapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val();
          if (userData && userData.uid === uid) {
            foundUser = {
              id: childSnapshot.key!,
              ...userData
            };
            return true; // Romper el ciclo forEach
          }
        });
        
        console.log('DatabaseService: Usuario encontrado por UID:', foundUser ? 'Sí' : 'No');
        return foundUser;
      }
      
      return null;
    } catch (error) {
      console.error('DatabaseService: Error al buscar usuario por UID:', error);
      throw error;
    }
  }

  async deleteUsuario(id: string): Promise<void> {
    try {
  const usuarioRef = ref(this.db, `usuarios/${id}`);
  await remove(usuarioRef);
    } catch (error) {
      console.error('DatabaseService: Error al eliminar usuario:', error);
      throw error;
    }
  }

  async getUsuarioById(id: string): Promise<Usuario | null> {
    try {
  const usuarioRef = ref(this.db, `usuarios/${id}`);
  const snapshot = await get(usuarioRef);
      if (snapshot.exists()) {
        return {
          id: snapshot.key!,
          ...snapshot.val(),
        };
      }
      return null;
    } catch (error) {
      console.error('DatabaseService: Error al obtener usuario:', error);
      throw error;
    }
  }
}
