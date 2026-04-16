import React from 'react';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2 } from 'lucide-react';

interface RevisionCalidadEvidenciasCardProps {
  evidencias: string[];
  isAdmin: boolean;
  deletingEvidence: string | null;
  onDeleteEvidence: (url: string) => void;
}

const RevisionCalidadEvidenciasCard: React.FC<RevisionCalidadEvidenciasCardProps> = ({
  evidencias,
  isAdmin,
  deletingEvidence,
  onDeleteEvidence
}) => {
  return (
    <div className="mt-2 bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
      <Label className="text-sm font-medium mb-2 block">Evidencias guardadas</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {evidencias.map((url, index) => (
          <div key={url ?? index} className="relative border border-border/30 rounded overflow-hidden group">
            <a href={url} target="_blank" rel="noopener noreferrer" className="block" title="Abrir evidencia en una nueva pestaña">
              <img
                src={url}
                alt={`Evidencia ${index + 1}`}
                className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(ev) => {
                  (ev.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </a>
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 flex justify-between">
              <span>Evidencia {index + 1}</span>
              <span className="underline">Ver</span>
            </div>
            {isAdmin && (
              <button
                type="button"
                className="absolute top-2 right-2 bg-white/90 text-red-600 rounded-full p-1 shadow-sm hover:bg-white"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onDeleteEvidence(url);
                }}
                disabled={deletingEvidence === url}
                title="Eliminar evidencia"
              >
                {deletingEvidence === url ? (
                  <Skeleton className="h-3.5 w-3.5 rounded-full" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevisionCalidadEvidenciasCard;
