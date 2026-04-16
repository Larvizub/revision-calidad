import React from 'react';
import { FileText } from 'lucide-react';

interface RevisionCalidadEmptyStateProps {
  title: string;
  description: string;
}

const RevisionCalidadEmptyState: React.FC<RevisionCalidadEmptyStateProps> = ({ title, description }) => {
  return (
    <div className="bg-card rounded-lg border border-border/50 p-8 text-center">
      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default RevisionCalidadEmptyState;
