import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Mail } from 'lucide-react';

const PerfilInfoNoteCard: React.FC = () => {
  return (
    <Card className="border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
      <CardContent className="pt-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Mail className="h-4 w-4 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">
              Información de Microsoft Active Directory
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-200">
              <p>
                Los datos de <strong>nombre</strong> y <strong>email</strong> se sincronizan automáticamente con Microsoft Active Directory y no pueden ser modificados desde esta aplicación.
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Solo puedes cambiar tu foto de perfil</li>
                <li>El rol y estado son gestionados por administradores</li>
                <li>Los datos se actualizan automáticamente al iniciar sesión</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerfilInfoNoteCard;
