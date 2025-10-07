import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface DriverVehicleSectionProps {
  data: any;
  onChange: (field: string, value: string) => void;
}

export const DriverVehicleSection = ({ data, onChange }: DriverVehicleSectionProps) => {
  return (
    <TooltipProvider>
      <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4 text-primary">Driver & Vehicle Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="driver_name" className="text-sm font-medium">
            Driver Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="driver_name"
            value={data.driver_name}
            onChange={(e) => onChange('driver_name', e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="driver_email" className="text-sm font-medium">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="driver_email"
            type="email"
            value={data.driver_email}
            onChange={(e) => onChange('driver_email', e.target.value)}
            placeholder="john.doe@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ppsn" className="text-sm font-medium">
            PPSN <span className="text-destructive">*</span>
          </Label>
          <Input
            id="ppsn"
            value={data.ppsn}
            onChange={(e) => onChange('ppsn', e.target.value)}
            placeholder="1234567A"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicle_registration" className="text-sm font-medium">
            Vehicle Registration <span className="text-destructive">*</span>
          </Label>
          <Input
            id="vehicle_registration"
            value={data.vehicle_registration}
            onChange={(e) => onChange('vehicle_registration', e.target.value)}
            placeholder="24-D-12345"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicle_make_model" className="text-sm font-medium">
            Make & Model
          </Label>
          <Input
            id="vehicle_make_model"
            value={data.vehicle_make_model}
            onChange={(e) => onChange('vehicle_make_model', e.target.value)}
            placeholder="Toyota Corolla"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchase_date" className="text-sm font-medium">
            Purchase Date
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
              CO₂ (g/km) <span className="text-destructive">*</span>
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold mb-2">¿Dónde encontrar el CO₂?</p>
                  <ul className="text-sm space-y-1">
                    <li>• En el certificado de registro del vehículo</li>
                    <li>• En <a href="https://www.motorcheck.ie" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">motorcheck.ie</a> (gratis con matrícula)</li>
                    <li>• En el manual del vehículo</li>
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
            placeholder="120"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="engine_size" className="text-sm font-medium">
            Engine Size
          </Label>
          <Input
            id="engine_size"
            value={data.engine_size}
            onChange={(e) => onChange('engine_size', e.target.value)}
            placeholder="1.6L"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fuel_type" className="text-sm font-medium">
            Fuel Type
          </Label>
          <Select value={data.fuel_type} onValueChange={(value) => onChange('fuel_type', value)}>
            <SelectTrigger id="fuel_type">
              <SelectValue placeholder="Select fuel type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="petrol">Petrol</SelectItem>
              <SelectItem value="diesel">Diesel</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="EV">EV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
    </TooltipProvider>
  );
};
