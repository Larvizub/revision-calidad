import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, User } from 'lucide-react';
import type { Usuario } from '@/types';
import UsuarioRolBadge from './UsuarioRolBadge';
import UsuarioEstadoBadge from './UsuarioEstadoBadge';

interface UsuariosTableCardProps {
  usuarios: Usuario[];
  onEdit: (usuario: Usuario) => void;
  onDelete: (usuario: Usuario) => void;
}

const UsuariosTableCard: React.FC<UsuariosTableCardProps> = ({ usuarios, onEdit, onDelete }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuarios ({usuarios.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {usuarios.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No se encontraron usuarios</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {usuario.fotoPerfil ? (
                          <img
                            src={usuario.fotoPerfil}
                            alt={usuario.nombre}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                        )}
                        <span className="font-medium">{usuario.nombre || 'Sin nombre'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{usuario.email || 'Sin email'}</TableCell>
                    <TableCell>
                      <UsuarioRolBadge rol={usuario.rol} />
                    </TableCell>
                    <TableCell>
                      <UsuarioEstadoBadge estado={usuario.estado} />
                    </TableCell>
                    <TableCell>
                      {usuario.fechaCreacion ? new Date(usuario.fechaCreacion).toLocaleDateString('es-ES') : 'Sin fecha'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => onEdit(usuario)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(usuario)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UsuariosTableCard;
