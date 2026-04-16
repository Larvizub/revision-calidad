import React from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ParametrosSearchBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onSearch: () => Promise<void>;
}

const ParametrosSearchBar: React.FC<ParametrosSearchBarProps> = ({
  searchTerm,
  setSearchTerm,
  onSearch
}) => {
  return (
    <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar parámetros por nombre o área..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-10 border-border/50 focus:border-primary/50"
          />
        </div>
        <Button
          onClick={() => {
            void onSearch();
          }}
          variant="outline"
          className="border-primary/20 hover:border-primary/40 hover:bg-primary/5"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ParametrosSearchBar;
