import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DriverVehicleSection } from "@/components/DriverVehicleSection";
import { TripsTable } from "@/components/TripsTable";
import { TotalsSection } from "@/components/TotalsSection";
import { RunningCostsSection } from "@/components/RunningCostsSection";
import { CapitalAllowancesSection } from "@/components/CapitalAllowancesSection";
import { DeclarationSection } from "@/components/DeclarationSection";
import { LogbookData, TripRow, createEmptyLogbook, createEmptyTrip } from "@/types/logbook";
import { generatePDF } from "@/utils/pdfGenerator";
import { Download, Save, Upload, FileText, Linkedin, Globe, Send } from "lucide-react";
import { toast } from "sonner";
import nexusLogo from "@/assets/nexus-ventures-logo.png";
import { Header } from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const [formData, setFormData] = useState<LogbookData>(createEmptyLogbook());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTripChange = (rowIndex: number, field: keyof TripRow, value: string) => {
    setFormData(prev => {
      const newTrips = [...prev.trips];
      newTrips[rowIndex] = {
        ...newTrips[rowIndex],
        [field]: value
      };
      return {
        ...prev,
        trips: newTrips
      };
    });
  };

  const handleSubmitForm = async () => {
    try {
      setIsSubmitting(true);

      // Validar campos requeridos básicos
      if (!formData.driver_name || !formData.driver_email) {
        toast.error(t('form.required'));
        setIsSubmitting(false);
        return;
      }

      // Validar email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.driver_email)) {
        toast.error(t('form.email.invalid'));
        setIsSubmitting(false);
        return;
      }

      // Validar que haya al menos un viaje con datos
      const hasValidTrip = formData.trips.some(trip =>
        trip.date && trip.from && trip.to && trip.business_km
      );

      if (!hasValidTrip) {
        toast.error(t('mileage.validation.trip'));
        setIsSubmitting(false);
        return;
      }

      // Validar registro del vehículo
      if (!formData.vehicle_registration || formData.vehicle_registration.trim() === '') {
        toast.error(t('mileage.validation.vehicle'));
        setIsSubmitting(false);
        return;
      }

      // Validar firma y fecha
      if (!formData.signature || !formData.signed_date) {
        toast.error(t('mileage.declaration.signature'));
        setIsSubmitting(false);
        return;
      }

      // Generar PDF
      const pdf = generatePDF(formData, false, t);
      const pdfBlob = pdf.output('blob');

      // Convertir PDF a base64
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);

      reader.onloadend = async () => {
        const base64PDF = reader.result?.toString().split(',')[1];

        // Preparar datos para enviar
        const emailData = {
          driver_name: formData.driver_name,
          driver_email: formData.driver_email,
          pdfData: base64PDF,
          vehicle_registration: formData.vehicle_registration,
        };

        // Enviar emails using Resend API
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Nexus Ventures Logbook <log@happydreamsireland.com>',
            to: 'jesus@irishtaxagents.com',
            subject: `Nuevo Registro de Business Mileage - ${formData.driver_name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 10px;">
                  Nuevo Registro de Business Mileage
                </h1>
                
                <p style="font-size: 16px; margin: 20px 0;">
                  Se ha recibido un nuevo registro de mileage logbook.
                </p>

                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Conductor:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${formData.driver_name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Email:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${formData.driver_email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Registro del Vehículo:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${formData.vehicle_registration}</td>
                  </tr>
                </table>

                <p style="font-size: 14px; color: #666; margin: 20px 0;">
                  El PDF del registro está adjunto.
                </p>
              </div>
            `,
            attachments: [
              {
                filename: 'logbook.pdf',
                content: base64PDF,
                type: 'application/pdf',
              },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send email');
        }

        toast.success(t('form.success'));
        setIsSubmitting(false);
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
      const doc = generatePDF(formData, false, t);
      const date = new Date().toISOString().split('T')[0];
      doc.save(`mileage-logbook-${date}.pdf`);
    } catch (error) {
      console.error('Error generating PDF for download', error);
      toast.error('Error generating PDF');
    }
  };


  const handleSaveData = () => {
    try {
      const dataStr = JSON.stringify(formData);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mileage-logbook-data-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(t('form.data.saved'));
    } catch (error) {
      toast.error(t('form.data.save.error'));
      console.error(error);
    }
  };

  const handleLoadData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const loadedData = JSON.parse(event.target?.result as string);
            setFormData(loadedData);
            toast.success(t('form.data.loaded'));
          } catch (error) {
            toast.error(t('form.data.load.error'));
            console.error(error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          <DriverVehicleSection
            data={formData}
            onChange={handleFieldChange}
          />

          <TripsTable
            trips={formData.trips}
            onChange={handleTripChange}
            onAddRow={() => {
              setFormData(prev => ({
                ...prev,
                trips: [...prev.trips, createEmptyTrip()]
              }));
            }}
            onRemoveRow={(rowIndex: number) => {
              setFormData(prev => ({
                ...prev,
                trips: prev.trips.filter((_, i) => i !== rowIndex)
              }));
            }}
          />

          <TotalsSection
            data={formData}
            trips={formData.trips}
            onChange={handleFieldChange}
          />

          <RunningCostsSection
            data={formData}
            onChange={handleFieldChange}
          />

          <CapitalAllowancesSection
            data={formData}
            onChange={handleFieldChange}
          />

          <DeclarationSection
            data={formData}
            onChange={handleFieldChange}
            onSubmit={handleSubmitForm}
            onDownload={handleDownloadPdf}
            isSubmitting={isSubmitting}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <img
                src={nexusLogo}
                alt="Nexus Ventures"
                className="h-8 w-auto object-contain"
              />
            </div>
            <div className="text-center">
              <p>Business Mileage Logbook – Ireland Tax Year 2024</p>
              <p className="mt-1">For tax compliance purposes. Keep records for at least 6 years.</p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://www.nexusventures.eu"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Globe className="w-4 h-4" />
                www.nexusventures.eu
              </a>
              <a
                href="https://www.linkedin.com/company/nexusventures"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
