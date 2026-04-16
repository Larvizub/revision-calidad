import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileText, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface RevisionCalidadVerificadorCardProps {
  comentariosCalidad: string;
  onComentariosCalidadChange: (value: string) => void;
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  uploading: boolean;
}

const RevisionCalidadVerificadorCard: React.FC<RevisionCalidadVerificadorCardProps> = ({
  comentariosCalidad,
  onComentariosCalidadChange,
  files,
  setFiles,
  uploading
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
      <Label className="text-base font-medium mb-2">Comentario del verificador de calidad</Label>
      <textarea
        value={comentariosCalidad}
        onChange={(e) => onComentariosCalidadChange(e.target.value)}
        placeholder="Añade aquí comentarios del equipo de calidad (opcional)..."
        className="w-full min-h-[100px] p-3 rounded-md border border-border/30 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
      />

      <Label className="text-sm font-medium mb-2">Evidencias (imágenes) (opcional)</Label>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="border-2 border-dashed border-border/40 rounded-lg p-4 flex items-center gap-4">
            <div className="w-16 h-16 flex items-center justify-center bg-muted/20 rounded-md">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Arrastra las imágenes aquí o selecciónalas (opcional)</p>
              <p className="text-xs text-muted-foreground">Formatos: JPG/PNG. Máx 6 archivos, tamaño recomendado 5MB c/u.</p>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const list = e.target.files;
              if (!list) return;
              setFiles(Array.from(list).slice(0, 6));
            }}
            className="hidden"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md"
              disabled={uploading}
            >
              {uploading ? <Skeleton className="h-4 w-4 rounded-full mr-2" /> : null}
              <span>{uploading ? 'Subiendo...' : 'Seleccionar archivos'}</span>
            </Button>
            <p className="text-xs text-muted-foreground">{files.length} / 6 seleccionados</p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-3">
          {files.map((file, index) => (
            <div key={index} className="relative border border-border/30 rounded overflow-hidden">
              <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-28 object-cover" />
              <button
                type="button"
                onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                className="absolute top-1 right-1 bg-white/80 text-foreground rounded-full p-1 shadow-sm hover:bg-white"
                title="Eliminar evidencia"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="p-2 text-xs text-muted-foreground truncate">{file.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RevisionCalidadVerificadorCard;
