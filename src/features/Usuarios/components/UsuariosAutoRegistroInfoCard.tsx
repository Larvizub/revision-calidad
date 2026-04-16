import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { UserCheck } from 'lucide-react';

const UsuariosAutoRegistroInfoCard: React.FC = () => {
  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
      <CardContent className="pt-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
              <UserCheck className="h-4 w-4 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">
              Registro Automático de Usuarios
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-200">
              <p>
                <strong>Los usuarios se registran automáticamente</strong> cuando inician sesión con Microsoft por
                primera vez. No es necesario crear usuarios manualmente.
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Los usuarios nuevos se registran automáticamente como "Estándar"</li>
                <li>Puedes editar el rol y estado de usuarios existentes</li>
                <li>La información se sincroniza con Microsoft Active Directory</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UsuariosAutoRegistroInfoCard;
