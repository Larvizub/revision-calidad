import React from 'react';
import { Label } from '@/components/ui/label';

interface RevisionCalidadCommentsCardProps {
  label: string;
  content: string;
}

const RevisionCalidadCommentsCard: React.FC<RevisionCalidadCommentsCardProps> = ({ label, content }) => {
  return (
    <div className="bg-card rounded-lg border border-border/50 p-4 lg:p-6 shadow-sm">
      <Label className="text-sm font-medium mb-2">{label}</Label>
      <div className="whitespace-pre-wrap text-sm text-foreground">{content}</div>
    </div>
  );
};

export default RevisionCalidadCommentsCard;
