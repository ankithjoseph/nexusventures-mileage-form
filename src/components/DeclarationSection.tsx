import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface DeclarationSectionProps {
  data: any;
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export const DeclarationSection = ({ data, onChange, onSubmit, isSubmitting = false }: DeclarationSectionProps) => {
  return (
    <Card className="p-6 bg-muted/30">
      <h2 className="text-lg font-semibold mb-4 text-primary">Declaration & Signature</h2>
      
      <div className="mb-6 p-4 bg-card rounded-md border">
        <p className="text-sm text-foreground leading-relaxed">
          I confirm the above journeys were necessarily incurred in the performance of my duties (excludes commuting).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="signature" className="text-sm font-medium">
            Signature (Type Name)
          </Label>
          <Input
            id="signature"
            value={data.signature}
            onChange={(e) => onChange('signature', e.target.value)}
            placeholder="John Doe"
            className="font-serif italic"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signed_date" className="text-sm font-medium">
            Date
          </Label>
          <Input
            id="signed_date"
            type="date"
            value={data.signed_date}
            onChange={(e) => onChange('signed_date', e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button 
          onClick={onSubmit} 
          disabled={isSubmitting}
          size="lg"
          className="min-w-[200px]"
        >
          <Send className="w-4 h-4 mr-2" />
          {isSubmitting ? "Enviando..." : "Enviar Registro"}
        </Button>
      </div>
    </Card>
  );
};
