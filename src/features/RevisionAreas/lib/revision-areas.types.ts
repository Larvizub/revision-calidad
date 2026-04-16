export type RevisionOutcome = 'cumple' | 'no_cumple' | 'no_aplica' | null;

export interface RevisionResult {
  parametroId: string;
  resultado: RevisionOutcome;
}
