export type VerificacionOutcome = 'verificado' | 'pendiente' | 'no_cumple' | null;

export interface VerificacionResult {
  parametroId: string;
  verificacion: VerificacionOutcome;
}
