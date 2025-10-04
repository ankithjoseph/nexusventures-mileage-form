import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface RunningCostsSectionProps {
  data: any;
  onChange: (field: string, value: string) => void;
}

export const RunningCostsSection = ({ data, onChange }: RunningCostsSectionProps) => {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4 text-primary">Running Costs (Annual Totals)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fuel_eur" className="text-sm font-medium">
            Fuel (€)
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
            Insurance (€)
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
            Motor Tax (€)
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
            Repairs & Maintenance (€)
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
            NCT Testing (€)
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
            Other Description
          </Label>
          <Input
            id="other_desc"
            value={data.other_desc}
            onChange={(e) => onChange('other_desc', e.target.value)}
            placeholder="Description"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="other_eur" className="text-sm font-medium">
            Other Amount (€)
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
