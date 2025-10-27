import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LogbookData } from "@/types/logbook";

interface DriverVehicleSectionProps {
  data: Partial<LogbookData>;
  onChange: (field: string, value: string) => void;
}

export const DriverVehicleSection = ({ data, onChange }: DriverVehicleSectionProps) => {
  const { t } = useLanguage();

  return (
    <TooltipProvider>
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 text-primary">{t('driver.section.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="driver_name" className="text-sm font-medium">
              {t('driver.name')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="driver_name"
              value={data.driver_name}
              onChange={(e) => onChange('driver_name', e.target.value)}
              placeholder={t('placeholders.name')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="driver_email" className="text-sm font-medium">
              {t('driver.email')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="driver_email"
              type="email"
              value={data.driver_email}
              onChange={(e) => onChange('driver_email', e.target.value)}
              placeholder={t('placeholders.email')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ppsn" className="text-sm font-medium">
              {t('driver.ppsn')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ppsn"
              value={data.ppsn}
              onChange={(e) => onChange('ppsn', e.target.value)}
              placeholder={t('placeholders.ppsn')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle_registration" className="text-sm font-medium">
              {t('vehicle.registration')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="vehicle_registration"
              value={data.vehicle_registration}
              onChange={(e) => onChange('vehicle_registration', e.target.value)}
              placeholder={t('placeholders.registration')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle_make_model" className="text-sm font-medium">
              {t('vehicle.makeModel')}
            </Label>
            <Input
              id="vehicle_make_model"
              value={data.vehicle_make_model}
              onChange={(e) => onChange('vehicle_make_model', e.target.value)}
              placeholder={t('placeholders.makeModel')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase_date" className="text-sm font-medium">
              {t('vehicle.purchaseDate')}
            </Label>
            <Input
              id="purchase_date"
              type="date"
              value={data.purchase_date}
              onChange={(e) => onChange('purchase_date', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="co2_g_km" className="text-sm font-medium">
                {t('vehicle.co2')} <span className="text-destructive">*</span>
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-semibold mb-2">{t('vehicle.co2Tooltip.title')}</p>
                    <ul className="text-sm space-y-1">
                      <li>• {t('vehicle.co2Tooltip.location1')}</li>
                      <li>• {t('vehicle.co2Tooltip.location2')}</li>
                      <li>• {t('vehicle.co2Tooltip.location3')}</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="co2_g_km"
              type="number"
              value={data.co2_g_km}
              onChange={(e) => onChange('co2_g_km', e.target.value)}
              placeholder={t('placeholders.co2')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="engine_size" className="text-sm font-medium">
              {t('vehicle.engineSize')}
            </Label>
            <Input
              id="engine_size"
              value={data.engine_size}
              onChange={(e) => onChange('engine_size', e.target.value)}
              placeholder={t('placeholders.engineSize')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fuel_type" className="text-sm font-medium">
              {t('vehicle.fuelType')}
            </Label>
            <Select value={data.fuel_type} onValueChange={(value) => onChange('fuel_type', value)}>
              <SelectTrigger id="fuel_type">
                <SelectValue placeholder={t('vehicle.selectFuelType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="petrol">{t('vehicle.fuelTypes.petrol')}</SelectItem>
                <SelectItem value="diesel">{t('vehicle.fuelTypes.diesel')}</SelectItem>
                <SelectItem value="hybrid">{t('vehicle.fuelTypes.hybrid')}</SelectItem>
                <SelectItem value="EV">{t('vehicle.fuelTypes.ev')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
};
