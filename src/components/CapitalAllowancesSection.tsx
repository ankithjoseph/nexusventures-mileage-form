import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface CapitalAllowancesSectionProps {
  data: any;
  onChange: (field: string, value: string) => void;
}

export const CapitalAllowancesSection = ({ data, onChange }: CapitalAllowancesSectionProps) => {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4 text-primary">Capital Allowances</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="car_cost_eur" className="text-sm font-medium">
            Car Cost (€)
          </Label>
          <Input
            id="car_cost_eur"
            type="number"
            step="0.01"
            value={data.car_cost_eur}
            onChange={(e) => onChange('car_cost_eur', e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchase_date_ca" className="text-sm font-medium">
            Purchase Date
          </Label>
          <Input
            id="purchase_date_ca"
            type="date"
            value={data.purchase_date_ca}
            onChange={(e) => onChange('purchase_date_ca', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="co2_band" className="text-sm font-medium">
            CO₂ Band
          </Label>
          <Input
            id="co2_band"
            value={data.co2_band}
            onChange={(e) => onChange('co2_band', e.target.value)}
            placeholder="e.g., A, B, C"
          />
        </div>
      </div>
    </Card>
  );
};
