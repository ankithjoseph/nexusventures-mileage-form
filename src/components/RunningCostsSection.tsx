import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { LogbookData } from "@/types/logbook";

interface RunningCostsSectionProps {
  data: Partial<LogbookData>;
  onChange: (field: string, value: string) => void;
}

export const RunningCostsSection = ({ data, onChange }: RunningCostsSectionProps) => {
  const { t } = useLanguage();
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4 text-primary">{t('runningCosts.title')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fuel_eur" className="text-sm font-medium">
            {t('runningCosts.fuel')}
          </Label>
          <Input
            id="fuel_eur"
            type="number"
            step="0.01"
            value={data.fuel_eur}
            onChange={(e) => onChange('fuel_eur', e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="insurance_eur" className="text-sm font-medium">
            {t('runningCosts.insurance')}
          </Label>
          <Input
            id="insurance_eur"
            type="number"
            step="0.01"
            value={data.insurance_eur}
            onChange={(e) => onChange('insurance_eur', e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="motor_tax_eur" className="text-sm font-medium">
            {t('runningCosts.motorTax')}
          </Label>
          <Input
            id="motor_tax_eur"
            type="number"
            step="0.01"
            value={data.motor_tax_eur}
            onChange={(e) => onChange('motor_tax_eur', e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="repairs_maintenance_eur" className="text-sm font-medium">
            {t('runningCosts.repairsMaintenance')}
          </Label>
          <Input
            id="repairs_maintenance_eur"
            type="number"
            step="0.01"
            value={data.repairs_maintenance_eur}
            onChange={(e) => onChange('repairs_maintenance_eur', e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nct_testing_eur" className="text-sm font-medium">
            {t('runningCosts.nctTesting')}
          </Label>
          <Input
            id="nct_testing_eur"
            type="number"
            step="0.01"
            value={data.nct_testing_eur}
            onChange={(e) => onChange('nct_testing_eur', e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="other_desc" className="text-sm font-medium">
            {t('runningCosts.otherDescription')}
          </Label>
          <Input
            id="other_desc"
            value={data.other_desc}
            onChange={(e) => onChange('other_desc', e.target.value)}
            placeholder={t('placeholders.description')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="other_eur" className="text-sm font-medium">
            {t('runningCosts.otherAmount')}
          </Label>
          <Input
            id="other_eur"
            type="number"
            step="0.01"
            value={data.other_eur}
            onChange={(e) => onChange('other_eur', e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>
    </Card>
  );
};
