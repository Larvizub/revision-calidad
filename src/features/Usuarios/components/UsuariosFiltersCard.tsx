import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';

interface UsuariosFiltersCardProps {
  searchTerm: string;
  filterRol: string;
  filterEstado: string;
  onSearchChange: (value: string) => void;
  onFilterRolChange: (value: string) => void;
  onFilterEstadoChange: (value: string) => void;
}

const UsuariosFiltersCard: React.FC<UsuariosFiltersCardProps> = ({
  searchTerm,
  filterRol,
  filterEstado,
  onSearchChange,
  onFilterRolChange,
  onFilterEstadoChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Filtros de Búsqueda
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Buscar</Label>
            <Input
              id="search"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filterRol">Filtrar por Rol</Label>
            <Select value={filterRol} onValueChange={onFilterRolChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los roles</SelectItem>
                <SelectItem value="administrador">Administrador</SelectItem>
                <SelectItem value="calidad">Calidad</SelectItem>
                <SelectItem value="estandar">Estándar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filterEstado">Filtrar por Estado</Label>
            <Select value={filterEstado} onValueChange={onFilterEstadoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UsuariosFiltersCard;
