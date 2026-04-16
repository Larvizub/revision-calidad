import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

interface RevisionCalidadSearchCardProps {
  searchTerm: string;
  filteredCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
}

const RevisionCalidadSearchCard: React.FC<RevisionCalidadSearchCardProps> = ({
  searchTerm,
  filteredCount,
  totalCount,
  onSearchChange,
  onClearSearch
}) => {
  return (
    <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
      <Label className="text-base font-medium mb-3 block">Buscar Eventos</Label>
      <div className="flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar eventos por nombre o ID..."
            value={searchTerm}
            onChange={(e) => onSearchChange((e.target as HTMLInputElement).value)}
            className="pl-10 border-border/50 focus:border-primary/50"
          />
        </div>
        {searchTerm && (
          <Button
            onClick={onClearSearch}
            variant="outline"
            className="border-primary/20 hover:border-primary/40 hover:bg-primary/5"
            title="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {searchTerm && (
        <p className="text-sm text-muted-foreground mt-2">
          {filteredCount} evento(s) encontrado(s) de {totalCount} total
        </p>
      )}
    </div>
  );
};

export default RevisionCalidadSearchCard;
