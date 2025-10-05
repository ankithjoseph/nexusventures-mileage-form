import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DriverVehicleSection } from "@/components/DriverVehicleSection";
import { TripsTable } from "@/components/TripsTable";
import { TotalsSection } from "@/components/TotalsSection";
import { RunningCostsSection } from "@/components/RunningCostsSection";
import { CapitalAllowancesSection } from "@/components/CapitalAllowancesSection";
import { DeclarationSection } from "@/components/DeclarationSection";
import { LogbookData, TripRow, createEmptyLogbook } from "@/types/logbook";
import { generatePDF } from "@/utils/pdfGenerator";
import { Download, Save, Upload, FileText, Linkedin, Globe, Send } from "lucide-react";
import { toast } from "sonner";
import nexusLogo from "@/assets/nexus-ventures-logo.png";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [formData, setFormData] = useState<LogbookData>(createEmptyLogbook());

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

  const handleExportPDF = async () => {
    try {
      const pdf = generatePDF(formData, false);
      pdf.save(`business-mileage-logbook-${new Date().toISOString().split('T')[0]}.pdf`);
      
      // Send summary email
      await handleSendSummary();
      
      toast.success("PDF exported and summary email sent!");
    } catch (error) {
      toast.error("Failed to export PDF");
      console.error(error);
    }
  };

  const handleSendSummary = async () => {
    try {
      const totalRunningCosts = 
        Number(formData.fuel_eur || 0) +
        Number(formData.insurance_eur || 0) +
        Number(formData.motor_tax_eur || 0) +
        Number(formData.repairs_maintenance_eur || 0) +
        Number(formData.nct_testing_eur || 0) +
        Number(formData.other_eur || 0);

      const summary = {
        driver_name: formData.driver_name,
        ppsn: formData.ppsn,
        vehicle_registration: formData.vehicle_registration,
        total_km_business: formData.total_km_business,
        business_percent: formData.business_percent,
        total_running_costs: totalRunningCosts,
        fuel_eur: formData.fuel_eur,
        insurance_eur: formData.insurance_eur,
        motor_tax_eur: formData.motor_tax_eur,
        repairs_maintenance_eur: formData.repairs_maintenance_eur,
        nct_testing_eur: formData.nct_testing_eur,
        other_eur: formData.other_eur,
        car_cost_eur: formData.car_cost_eur,
        co2_band: formData.co2_band,
      };

      const { error } = await supabase.functions.invoke('send-logbook-summary', {
        body: summary
      });

      if (error) throw error;
      
      console.log("Summary email sent successfully");
    } catch (error) {
      console.error("Error sending summary email:", error);
      // Don't show error to user as PDF was still generated
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
      toast.success("Data saved successfully!");
    } catch (error) {
      toast.error("Failed to save data");
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
            toast.success("Data loaded successfully!");
          } catch (error) {
            toast.error("Failed to load data");
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
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <img 
                src={nexusLogo} 
                alt="Nexus Ventures Logo" 
                className="h-12 w-auto object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  Business Mileage Logbook
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Ireland – Employee/Director, Tax Year 2024
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleLoadData} variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Load Data
              </Button>
              <Button onClick={handleSaveData} variant="outline" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save Data
              </Button>
              <Button onClick={handleExportPDF} size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

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
          />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={handleSaveData} variant="secondary">
              <Save className="w-4 h-4 mr-2" />
              Save Data
            </Button>
            <Button onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
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
