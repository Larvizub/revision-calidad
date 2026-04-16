import React from 'react';
import { ProfileLoadingSkeleton } from '@/components/AppSkeletons';
import PerfilHeader from './components/PerfilHeader';
import PerfilInfoNoteCard from './components/PerfilInfoNoteCard';
import PerfilNoAuthState from './components/PerfilNoAuthState';
import PerfilPhotoCard from './components/PerfilPhotoCard';
import PerfilSummaryCards from './components/PerfilSummaryCards';
import PerfilSystemInfoCard from './components/PerfilSystemInfoCard';
import { usePerfilData } from './hooks/usePerfilData';

const Perfil: React.FC = () => {
  const {
    user,
    userProfile,
    usuario,
    isLoading,
    isSaving,
    isEditing,
    formData,
    setIsEditing,
    setFormData,
    handleSave,
    handleCancel
  } = usePerfilData();

  if (!user || !userProfile) {
    return <PerfilNoAuthState />;
  }

  if (isLoading) {
    return <ProfileLoadingSkeleton />;
  }

  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="p-4 lg:p-6 space-y-6 min-h-full">
        <PerfilHeader />

        <PerfilSummaryCards userProfile={userProfile} usuario={usuario} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerfilPhotoCard
            usuario={usuario}
            userProfile={userProfile}
            isEditing={isEditing}
            isSaving={isSaving}
            fotoPerfil={formData.fotoPerfil}
            onFotoPerfilChange={(value) => setFormData((prev) => ({ ...prev, fotoPerfil: value }))}
            onStartEditing={() => setIsEditing(true)}
            onSave={handleSave}
            onCancel={handleCancel}
          />

          <PerfilSystemInfoCard userProfile={userProfile} usuario={usuario} />
        </div>

        <PerfilInfoNoteCard />
      </div>
    </div>
  );
};

export default Perfil;
