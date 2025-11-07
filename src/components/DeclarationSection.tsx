import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LogbookData } from "@/types/logbook";
import FormActions from '@/components/FormActions';

interface DeclarationSectionProps {
  data: Partial<LogbookData>;
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  onDownload?: () => void;
}

export const DeclarationSection = ({ data, onChange, onSubmit, isSubmitting = false, onDownload }: DeclarationSectionProps) => {
  const { t } = useLanguage();

  return (
    <Card className="p-6 bg-muted/30">
      <h2 className="text-lg font-semibold mb-4 text-primary">{t('declaration.title')}</h2>

      <div className="mb-6 p-4 bg-card rounded-md border">
        <p className="text-sm text-foreground leading-relaxed">
          {t('mileage.declaration')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="signature" className="text-sm font-medium">
            {t('form.signature')} (Type Name)
          </Label>
          <Input
            id="signature"
            name="signature"
            value={data.signature}
            onChange={(e) => onChange('signature', e.target.value)}
            placeholder={t('placeholders.name')}
            className="font-serif italic"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signed_date" className="text-sm font-medium">
            {t('form.date')}
          </Label>
          <Input
            id="signed_date"
            type="date"
            value={data.signed_date}
            onChange={(e) => onChange('signed_date', e.target.value)}
          />
        </div>
      </div>

          <div className="mt-6">
            <FormActions onDownload={onDownload} onSubmit={onSubmit} isSubmitting={isSubmitting} downloadLabel={t('form.download')} submitLabel={t('form.submit')} />
          </div>
    </Card>
  );
};
