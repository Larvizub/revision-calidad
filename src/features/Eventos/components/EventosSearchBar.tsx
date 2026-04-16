import React from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EventosSearchBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onSearch: () => Promise<void>;
}

const EventosSearchBar: React.FC<EventosSearchBarProps> = ({
  searchTerm,
  setSearchTerm,
  onSearch
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-4">
      <Input
        placeholder="Buscar por ID o nombre..."
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            void onSearch();
          }
        }}
        className="flex-1"
      />
      <Button
        onClick={() => {
          void onSearch();
        }}
        className="font-semibold"
      >
        <Search className="mr-2 h-4 w-4" />
        Buscar
      </Button>
    </div>
  );
};

export default EventosSearchBar;
