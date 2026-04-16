import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface RevisionAreasSearchCardProps {
  eventoIdSearch: string;
  setEventoIdSearch: (value: string) => void;
  isSearchingSkill: boolean;
  onSearch: () => Promise<void>;
}

const RevisionAreasSearchCard: React.FC<RevisionAreasSearchCardProps> = ({
  eventoIdSearch,
  setEventoIdSearch,
  isSearchingSkill,
  onSearch
}) => {
  return (
    <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Búsqueda Rápida por ID de Evento (Skill)</Label>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Ingrese ID de Skill..."
              value={eventoIdSearch}
              onChange={(e) => setEventoIdSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              className="border-border/50"
            />
            <Button
              onClick={onSearch}
              variant="secondary"
              size="icon"
              disabled={isSearchingSkill}
              title="Buscar por ID en Skill"
            >
              {isSearchingSkill ? <Skeleton className="h-4 w-4 rounded-full" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevisionAreasSearchCard;
