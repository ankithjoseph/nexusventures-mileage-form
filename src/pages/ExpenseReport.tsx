import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Header } from "@/components/Header";
// lucide icons not used in this page
import { toast } from "sonner";
import ThankYouDialog from '@/components/ThankYouDialog';
import Footer from '@/components/Footer';
import { useLanguage } from "@/contexts/LanguageContext";
import { generateExpensePDF } from '@/utils/pdfGenerator';
import FormActions from '@/components/FormActions';
import pb from '@/lib/pocketbase';

interface ExpenseReportData {
  name: string;
  email: string;
  pps: string;
  motivo_viaje: string;
  fecha_viaje: string;
  origen: string;
  destino: string;
  matricula: string;
  marca_modelo: string;
  tipo_combustible: string;
  co2_g_km: string;
  km_inicio: string;
  km_final: string;
  suma_km_trabajo: string;
  peajes: string;
  parking: string;
  combustible: string;
  dietas: string;
  alojamiento: string;
  notas: string;
  firma: string;
  fecha_firma: string;
}

const createEmptyExpenseReport = (): ExpenseReportData => ({
  name: "",
  email: "",
  pps: "",
  motivo_viaje: "",
  fecha_viaje: "",
  origen: "",
  destino: "",
  matricula: "",
  marca_modelo: "",
  tipo_combustible: "gasolina",
  co2_g_km: "",
  km_inicio: "",
  km_final: "",
  suma_km_trabajo: "",
  peajes: "",
  parking: "",
  combustible: "",
  dietas: "",
  alojamiento: "",
  notas: "",
  firma: "",
  fecha_firma: "",
});

const ExpenseReport = () => {
  const [formData, setFormData] = useState<ExpenseReportData>(createEmptyExpenseReport());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thankYouOpen, setThankYouOpen] = useState(false);
  const { t } = useLanguage();

  const resetForm = () => {
    setFormData(createEmptyExpenseReport());
    setIsSubmitting(false);
  };

  const handleFieldChange = (field: keyof ExpenseReportData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Basic validation
      if (!formData.name || !formData.email || !formData.pps || !formData.motivo_viaje || !formData.fecha_viaje || !formData.origen || !formData.destino || !formData.firma || !formData.fecha_firma) {
        toast.error(t('form.required'));
        setIsSubmitting(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error(t('form.email.invalid'));
        setIsSubmitting(false);
        return;
      }

      // Calculate suma_km_trabajo if not provided
      const kmInicio = parseFloat(formData.km_inicio) || 0;
      const kmFinal = parseFloat(formData.km_final) || 0;
      const sumaKm = kmFinal - kmInicio;
      if (sumaKm > 0 && !formData.suma_km_trabajo) {
        handleFieldChange('suma_km_trabajo', sumaKm.toString());
      }

      // Generate PDF
      const doc = generateExpensePDF(formData, t);

      const pdfBlob = doc.output('blob');

      // Convert PDF to base64
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);

      reader.onloadend = async (event: ProgressEvent<FileReader>) => {
        const result = event.target?.result;
        const base64PDF = result?.toString().split(',')[1];

        // Send email with PDF attachment
        // Send the full form data to the server so it can email and persist a record
        // Include the current PocketBase user id so the server can attach the relation
        const emailData = {
          ...formData,
          pdfData: base64PDF,
          type: 'expense-report',
          pb_user_id: (pb.authStore as any)?.model?.id ?? null,
        };

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        try {
          const token = (pb.authStore as any)?.token;
          if (token) headers['Authorization'] = `Bearer ${token}`;
        } catch (e) {
          // ignore if authStore not available
        }

        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers,
          body: JSON.stringify(emailData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send email');
        }
        toast.success(t('form.success'));
        setIsSubmitting(false);
        setThankYouOpen(true);
      };

      reader.onerror = () => {
        toast.error(t('form.pdf.error'));
        setIsSubmitting(false);
      };

    } catch (error) {
      toast.error(t('form.error'));
      console.error(error);
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = () => {
    try {
      const doc = generateExpensePDF(formData, t);
      const date = new Date().toISOString().split('T')[0];
      doc.save(`expense-report-${date}.pdf`);
    } catch (error) {
      console.error('Error generating PDF for download', error);
      toast.error(t('form.pdf.error'));
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl flex-1">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-6 text-primary">{t('expense.title')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t('form.name')} *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder={t('expense.placeholders.name')}
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('form.email')} *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder={t('expense.placeholders.email')}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pps">{t('form.pps')} *</Label>
              <Input
                id="pps"
                name="pps"
                value={formData.pps}
                onChange={(e) => handleFieldChange('pps', e.target.value)}
                placeholder={t('expense.placeholders.pps')}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <Label htmlFor="motivo_viaje">{t('expense.reason')} *</Label>
            <Input
              id="motivo_viaje"
              value={formData.motivo_viaje}
              onChange={(e) => handleFieldChange('motivo_viaje', e.target.value)}
              placeholder={t('expense.placeholders.tripReason')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="fecha_viaje">{t('expense.trip.date')} *</Label>
              <Input
                id="fecha_viaje"
                type="date"
                value={formData.fecha_viaje}
                onChange={(e) => handleFieldChange('fecha_viaje', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="origen">{t('expense.origin')} *</Label>
              <Input
                id="origen"
                value={formData.origen}
                onChange={(e) => handleFieldChange('origen', e.target.value)}
                placeholder={t('expense.placeholders.origin')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destino">{t('expense.destination')} *</Label>
              <Input
                id="destino"
                value={formData.destino}
                onChange={(e) => handleFieldChange('destino', e.target.value)}
                placeholder={t('expense.placeholders.destination')}
              />
            </div>
          </div>

          <h3 className="text-md font-semibold mb-4">{t('expense.vehicle.info')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="matricula">{t('expense.license')}</Label>
              <Input
                id="matricula"
                value={formData.matricula}
                onChange={(e) => handleFieldChange('matricula', e.target.value)}
                placeholder={t('expense.placeholders.license')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marca_modelo">{t('expense.make.model')}</Label>
              <Input
                id="marca_modelo"
                value={formData.marca_modelo}
                onChange={(e) => handleFieldChange('marca_modelo', e.target.value)}
                placeholder={t('expense.placeholders.makeModel')}
              />
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{t('expense.fuel.type')}</legend>
              <RadioGroup
                value={formData.tipo_combustible}
                onValueChange={(value) => handleFieldChange('tipo_combustible', value)}
                className="flex flex-row gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="gasolina" id="gasolina" />
                  <Label htmlFor="gasolina">{t('expense.fuelTypes.gasolina')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="diesel" id="diesel" />
                  <Label htmlFor="diesel">{t('expense.fuelTypes.diesel')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hibrido" id="hibrido" />
                  <Label htmlFor="hibrido">{t('expense.fuelTypes.hibrido')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ev" id="ev" />
                  <Label htmlFor="ev">{t('expense.fuelTypes.ev')}</Label>
                </div>
              </RadioGroup>
            </fieldset>
            <div className="space-y-2">
              <Label htmlFor="co2_g_km">CO₂ (g/km)</Label>
              <Input
                id="co2_g_km"
                type="number"
                value={formData.co2_g_km}
                onChange={(e) => handleFieldChange('co2_g_km', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <h3 className="text-md font-semibold mb-4">{t('expense.mileage.reading')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="km_inicio">{t('expense.start.km')}</Label>
              <Input
                id="km_inicio"
                type="number"
                value={formData.km_inicio}
                onChange={(e) => handleFieldChange('km_inicio', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="km_final">{t('expense.end.km')}</Label>
              <Input
                id="km_final"
                type="number"
                value={formData.km_final}
                onChange={(e) => handleFieldChange('km_final', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="suma_km_trabajo">{t('expense.business.km')}</Label>
              <Input
                id="suma_km_trabajo"
                type="number"
                value={formData.suma_km_trabajo}
                onChange={(e) => handleFieldChange('suma_km_trabajo', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <h3 className="text-md font-semibold mb-4">{t('expense.expenses')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="peajes">{t('expense.tolls')}</Label>
              <Input
                id="peajes"
                type="number"
                step="0.01"
                value={formData.peajes}
                onChange={(e) => handleFieldChange('peajes', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parking">{t('expense.parking')}</Label>
              <Input
                id="parking"
                type="number"
                step="0.01"
                value={formData.parking}
                onChange={(e) => handleFieldChange('parking', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="combustible">{t('expense.fuel')}</Label>
              <Input
                id="combustible"
                type="number"
                step="0.01"
                value={formData.combustible}
                onChange={(e) => handleFieldChange('combustible', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dietas">{t('expense.meals')}</Label>
              <Input
                id="dietas"
                type="number"
                step="0.01"
                value={formData.dietas}
                onChange={(e) => handleFieldChange('dietas', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alojamiento">{t('expense.accommodation')}</Label>
              <Input
                id="alojamiento"
                type="number"
                step="0.01"
                value={formData.alojamiento}
                onChange={(e) => handleFieldChange('alojamiento', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              value={formData.notas}
              onChange={(e) => handleFieldChange('notas', e.target.value)}
              placeholder={t('expense.placeholders.notes')}
              rows={3}
            />
          </div>

          <div className="mb-6 p-4 bg-muted/30 rounded-md border">
            <h3 className="text-md font-semibold mb-2 text-primary">Declaration</h3>
            <p className="text-sm text-foreground leading-relaxed">
              {t('expense.declaration')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="firma">{t('form.signature')} *</Label>
              <Input
                id="firma"
                value={formData.firma}
                onChange={(e) => handleFieldChange('firma', e.target.value)}
                placeholder={t('expense.placeholders.signature')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_firma">{t('form.date')} *</Label>
              <Input
                id="fecha_firma"
                type="date"
                value={formData.fecha_firma}
                onChange={(e) => handleFieldChange('fecha_firma', e.target.value)}
              />
            </div>
          </div>

              <div className="mt-6">
                <FormActions onDownload={handleDownloadPdf} onSubmit={handleSubmit} isSubmitting={isSubmitting} downloadLabel={t('form.download')} submitLabel={isSubmitting ? t('form.sending') : t('form.submit')} />
              </div>

              <ThankYouDialog
                open={thankYouOpen}
                onOpenChange={(v) => setThankYouOpen(v)}
                title={'Thank you'}
                description={'Your expense report has been submitted. A copy has been emailed to you.'}
                primaryLabel={ 'New form'}
                onPrimary={() => { resetForm(); setThankYouOpen(false); }}
              />
        </Card>
      </main>

      <Footer title="Business Expense Report" subtitle="For tax compliance purposes. Keep records for at least 6 years." />
    </div>
  );
};

export default ExpenseReport;
