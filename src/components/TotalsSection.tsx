import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface TotalsSectionProps {
  data: any;
  trips: any[];
  onChange: (field: string, value: string) => void;
}

export const TotalsSection = ({ data, trips, onChange }: TotalsSectionProps) => {
  const { t } = useLanguage();
  const calculateTotals = () => {
    let totalBusiness = 0;
    trips.forEach(trip => {
      const km = parseFloat(trip.business_km as string) || 0;
      totalBusiness += km;
    });
    
    const totalAll = parseFloat(data.total_km_all as string) || totalBusiness;
    const businessPercent = totalAll > 0 ? (totalBusiness / totalAll * 100).toFixed(2) : '0';
    
    onChange('total_km_business', totalBusiness.toString());
    onChange('business_percent', businessPercent);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-primary">{t('totals.title')}</h2>
        <Button onClick={calculateTotals} variant="outline" size="sm">
          <Calculator className="w-4 h-4 mr-2" />
          Calculate
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="total_km_all" className="text-sm font-medium">
            {t('totals.totalKmAll')} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="total_km_all"
            type="number"
            value={data.total_km_all}
            onChange={(e) => onChange('total_km_all', e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="total_km_business" className="text-sm font-medium">
            {t('totals.totalKmBusiness')} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="total_km_business"
            type="number"
            value={data.total_km_business}
            onChange={(e) => onChange('total_km_business', e.target.value)}
            placeholder="0"
            className="bg-muted/30"
            readOnly
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="business_percent" className="text-sm font-medium">
            {t('totals.businessPercent')} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="business_percent"
            type="number"
            step="0.01"
            value={data.business_percent}
            onChange={(e) => onChange('business_percent', e.target.value)}
            placeholder="0.00"
            className="bg-muted/30"
            readOnly
          />
        </div>
      </div>
    </Card>
  );
};
