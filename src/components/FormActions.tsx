import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Send } from 'lucide-react';

type Props = {
  onDownload?: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  downloadLabel?: string;
  submitLabel?: string;
  downloadVariant?: 'outline' | 'default';
};

const FormActions: React.FC<Props> = ({ onDownload, onSubmit, isSubmitting = false, downloadLabel = 'Download', submitLabel = 'Submit', downloadVariant = 'outline' }) => {
  return (
    <div className="flex justify-end items-center gap-3">
      {onDownload && (
        <Button type="button" onClick={onDownload} variant={downloadVariant} size="lg">
          <Download className="w-4 h-4 mr-2" />
          {downloadLabel}
        </Button>
      )}

      <Button onClick={onSubmit} disabled={isSubmitting} size="lg" className="min-w-[200px]">
        <Send className="w-4 h-4 mr-2" />
        {isSubmitting ? 'Sending…' : submitLabel}
      </Button>
    </div>
  );
};

export default FormActions;
