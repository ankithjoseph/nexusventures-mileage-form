import { useState } from "react";
import { DriverVehicleSection } from "@/components/DriverVehicleSection";
import { TripsTable } from "@/components/TripsTable";
import { TotalsSection } from "@/components/TotalsSection";
import { RunningCostsSection } from "@/components/RunningCostsSection";
import { CapitalAllowancesSection } from "@/components/CapitalAllowancesSection";
import { DeclarationSection } from "@/components/DeclarationSection";
import { LogbookData, TripRow, createEmptyLogbook, createEmptyTrip } from "@/types/logbook";
import { generatePDF } from "@/utils/pdfGenerator";
// lucide icons not used in this page
import { toast } from "sonner";
import Footer from '@/components/Footer';
import { Header } from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";
import ThankYouDialog from '@/components/ThankYouDialog';

import pb from '@/lib/pocketbase';

const MileageBook = () => {
  const [formData, setFormData] = useState<LogbookData>(createEmptyLogbook());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();
  const [thankYouOpen, setThankYouOpen] = useState(false);

  const resetForm = () => {
    setFormData(createEmptyLogbook());
    setIsSubmitting(false);
    setThankYouOpen(false);
  };

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
        // Include PocketBase user id and token for server-side persistence
        const emailData = {
          name: formData.driver_name,
          email: formData.driver_email,
          pps: formData.ppsn || 'N/A',
          pdfData: base64PDF,
          type: 'mileage-logbook',
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
      const doc = generatePDF(formData, false, t);
      const date = new Date().toISOString().split('T')[0];
      doc.save(`mileage-logbook-${date}.pdf`);
    } catch (error) {
      console.error('Error generating PDF for download', error);
      toast.error('Error generating PDF');
    }
  };


  // Note: save/load helpers removed because they were not used. Re-add if you need client-side JSON import/export.

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

      <ThankYouDialog
        open={thankYouOpen}
        onOpenChange={(v) => setThankYouOpen(v)}
        title={'Thank you'}
        description={'Your mileage logbook has been submitted. A copy has been emailed to you.'}
        primaryLabel={'New form'}
        onPrimary={() => { resetForm(); setThankYouOpen(false); }}
      />

      <Footer title="Business Mileage Logbook" subtitle="For tax compliance purposes. Keep records for at least 6 years." />
    </div>
  );
};

export default MileageBook;