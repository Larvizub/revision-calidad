import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Parametro } from '@/types';

interface ParametrosTableProps {
  parametros: Parametro[];
  getAreaName: (idArea: string) => string;
  onEdit: (parametro: Parametro) => void;
  onDelete: (id: string, nombre: string) => void;
}

const ParametrosTable: React.FC<ParametrosTableProps> = ({
  parametros,
  getAreaName,
  onEdit,
  onDelete
}) => {
  return (
    <div className="bg-card rounded-lg border border-border/50 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead className="font-semibold text-foreground">Área</TableHead>
              <TableHead className="font-semibold text-foreground">Nombre</TableHead>
              <TableHead className="w-[120px] font-semibold text-foreground">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parametros.map((parametro) => (
              <TableRow key={parametro.id} className="border-border/30 hover:bg-muted/30">
                <TableCell className="font-medium">{getAreaName(parametro.idArea)}</TableCell>
                <TableCell className="font-medium">{parametro.nombre}</TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(parametro)}
                      className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(parametro.id, parametro.nombre)}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ParametrosTable;
