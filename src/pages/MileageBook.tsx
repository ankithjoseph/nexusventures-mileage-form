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
import { Download, Save, Upload, FileText, Send } from "lucide-react";
import { toast } from "sonner";
import Footer from '@/components/Footer';
import { Header } from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";

const MileageBook = () => {
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

        // Send email with PDF attachment
        const emailData = {
          name: formData.driver_name,
          email: formData.driver_email,
          pps: formData.ppsn || 'N/A',
          pdfData: base64PDF,
          type: 'mileage-logbook'
        };

        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send email');
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
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl flex-1">
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

      <Footer title="Business Mileage Logbook – Ireland Tax Year 2024" subtitle="For tax compliance purposes. Keep records for at least 6 years." />
    </div>
  );
};

export default MileageBook;