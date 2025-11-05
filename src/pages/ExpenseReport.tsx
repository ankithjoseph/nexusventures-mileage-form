import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Header } from "@/components/Header";
import { Send, Globe, Link, Download } from "lucide-react";
import { toast } from "sonner";
import nexusLogo from "@/assets/nexus-ventures-logo.png";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLanguage } from "@/contexts/LanguageContext";

// Extend jsPDF type to include autoTable properties
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

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
  const { t } = useLanguage();

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
      const doc: jsPDFWithAutoTable = new jsPDF();
      const marginLeft = 15;
      const marginRight = 15;
      const pageWidth = 210; // A4 width in mm
      const contentWidth = pageWidth - marginLeft - marginRight;

      let yPos = 15;

      // Add logo
      try {
        const logoWidth = 40;
        const logoHeight = 12;
        doc.addImage(nexusLogo, 'PNG', pageWidth - marginRight - logoWidth, yPos, logoWidth, logoHeight);
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
      }

      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(t('app.title.expense'), marginLeft, yPos + 5);
      yPos += 11;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(t('app.subtitle'), marginLeft, yPos);
      yPos += 12;

      // Personal Information
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(t('expense.personal.info'), marginLeft, yPos);
      yPos += 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      const personalData = [
        [t('form.name') + ':', formData.name, t('form.pps') + ':', formData.pps],
        ['Email:', formData.email, '', ''],
        [t('expense.reason') + ':', formData.motivo_viaje, '', ''],
        [t('expense.trip.date') + ':', formData.fecha_viaje, t('expense.origin') + ':', formData.origen],
        [t('expense.destination') + ':', formData.destino, '', '']
      ];

      autoTable(doc, {
        startY: yPos,
        head: [],
        body: personalData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
          1: { cellWidth: 50 },
          2: { fontStyle: 'bold', cellWidth: 35 },
          3: { cellWidth: 55 }
        },
        tableWidth: contentWidth
      });

      yPos = doc.lastAutoTable?.finalY ?? yPos + 10;

      // Add space before next section
      yPos += 15;

      // Vehicle Information
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(t('expense.vehicle.info'), marginLeft, yPos);
      yPos += 8;

      const vehicleData = [
        [t('expense.license'), formData.matricula, t('expense.make.model'), formData.marca_modelo],
        [t('expense.fuel.type'), formData.tipo_combustible, (t ? t('expense.co2').replace(/\u2082/g, '2') : 'CO2 (g/km)'), formData.co2_g_km]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [],
        body: vehicleData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
          1: { cellWidth: 50 },
          2: { fontStyle: 'bold', cellWidth: 35, font: "Notosans" },
          3: { cellWidth: 55 }
        },
        tableWidth: contentWidth
      });

      yPos = doc.lastAutoTable?.finalY ?? yPos + 10;

      // Mileage
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(t('expense.mileage.reading'), marginLeft, yPos);
      yPos += 8;

      const mileageData = [
        [t('expense.start.km'), formData.km_inicio + ' km', t('expense.end.km'), formData.km_final + ' km'],
        [t('expense.business.km'), formData.suma_km_trabajo + ' km', '', '']
      ];

      autoTable(doc, {
        startY: yPos,
        head: [],
        body: mileageData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60 },
          1: { cellWidth: 40 },
          2: { fontStyle: 'bold', cellWidth: 45 },
          3: { cellWidth: 35 }
        },
        tableWidth: contentWidth
      });

      yPos = doc.lastAutoTable?.finalY ?? yPos + 10;

      // Expenses
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(t('expense.expenses'), marginLeft, yPos);
      yPos += 8;

      const expensesData = [
        [t('expense.tolls'), '€' + (formData.peajes || '0.00'), t('expense.parking'), '€' + (formData.parking || '0.00')],
        [t('expense.fuel'), '€' + (formData.combustible || '0.00'), t('expense.meals'), '€' + (formData.dietas || '0.00')],
        [t('expense.accommodation'), '€' + (formData.alojamiento || '0.00'), '', '']
      ];

      autoTable(doc, {
        startY: yPos,
        head: [],
        body: expensesData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 35 },
          1: { cellWidth: 45 },
          2: { fontStyle: 'bold', cellWidth: 35 },
          3: { cellWidth: 45 }
        }
      });

      yPos = doc.lastAutoTable?.finalY ?? yPos + 10;

      // Notes
      if (formData.notas) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(t('form.notes'), marginLeft, yPos);
        yPos += 8;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const splitNotes = doc.splitTextToSize(formData.notas, contentWidth);
        doc.text(splitNotes, marginLeft, yPos);
        yPos += splitNotes.length * 5 + 10;
      }

      // Declaration
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(t('declaration.title'), marginLeft, yPos);
      yPos += 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const declarationText = t('expense.declaration');
      const splitDeclaration = doc.splitTextToSize(declarationText, contentWidth);
      doc.text(splitDeclaration, marginLeft, yPos);
      yPos += splitDeclaration.length * 5 + 10;

      // Signature
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(t('form.signature'), marginLeft, yPos);
      yPos += 8;

      autoTable(doc, {
        startY: yPos,
        head: [],
        body: [
          [t('form.signature'), formData.firma, t('form.date'), formData.fecha_firma]
        ],
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 25 },
          1: { cellWidth: 70, fontStyle: 'italic' },
          2: { fontStyle: 'bold', cellWidth: 20 },
          3: { cellWidth: 50 }
        },
        tableWidth: contentWidth
      });

      // Add page numbers
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        const pageNumber = `${i}/${totalPages}`;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.text(pageNumber, pageWidth - 20, pageHeight - 10);
      }

      const pdfBlob = doc.output('blob');

      // Convert PDF to base64
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);

      reader.onloadend = async (event: ProgressEvent<FileReader>) => {
        const result = event.target?.result;
        const base64PDF = result?.toString().split(',')[1];

        // Send email with PDF attachment
        const emailData = {
          name: formData.name,
          email: formData.email,
          pps: formData.pps,
          pdfData: base64PDF,
          type: 'expense-report'
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
      const doc: jsPDFWithAutoTable = new jsPDF();
      const marginLeft = 15;
      const marginRight = 15;
      const pageWidth = 210; // A4 width in mm
      const contentWidth = pageWidth - marginLeft - marginRight;

      let yPos = 15;

      // Add logo
      try {
        const logoWidth = 40;
        const logoHeight = 12;
        doc.addImage(nexusLogo, 'PNG', pageWidth - marginRight - logoWidth, yPos, logoWidth, logoHeight);
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
      }

      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(t('app.title.expense'), marginLeft, yPos + 5);
      yPos += 11;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(t('app.subtitle'), marginLeft, yPos);
      yPos += 12;

      // Personal Information
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(t('expense.personal.info'), marginLeft, yPos);
      yPos += 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      const personalData = [
        [t('form.name') + ':', formData.name, t('form.pps') + ':', formData.pps],
        [t('expense.reason') + ':', formData.motivo_viaje, '', ''],
        [t('expense.trip.date') + ':', formData.fecha_viaje, t('expense.origin') + ':', formData.origen],
        [t('expense.destination') + ':', formData.destino, '', '']
      ];

      autoTable(doc, {
        startY: yPos,
        head: [],
        body: personalData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
          1: { cellWidth: 50 },
          2: { fontStyle: 'bold', cellWidth: 35 },
          3: { cellWidth: 55 }
        }
      });

      yPos = doc.lastAutoTable?.finalY ?? yPos + 10;

      // Add space before next section
      yPos += 15;

      // Vehicle Information
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(t('expense.vehicle.info'), marginLeft, yPos);
      yPos += 8;

      const vehicleData = [
        [t('expense.license'), formData.matricula, t('expense.make.model'), formData.marca_modelo],
        [t('expense.fuel.type'), formData.tipo_combustible, (t ? t('expense.co2').replace(/\u2082/g, '2') : 'CO2 (g/km)'), formData.co2_g_km]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [],
        body: vehicleData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
          1: { cellWidth: 50 },
          2: { fontStyle: 'bold', cellWidth: 35 },
          3: { cellWidth: 55 }
        },
        tableWidth: contentWidth
      });

      yPos = doc.lastAutoTable?.finalY ?? yPos + 10;

      // Add space before next section
      yPos += 15;

      // Mileage
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(t('expense.mileage.reading'), marginLeft, yPos);
      yPos += 8;

      const mileageData = [
        [t('expense.start.km'), formData.km_inicio + ' km', t('expense.end.km'), formData.km_final + ' km'],
        [t('expense.business.km'), formData.suma_km_trabajo + ' km', '', '']
      ];

      autoTable(doc, {
        startY: yPos,
        head: [],
        body: mileageData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60 },
          1: { cellWidth: 40 },
          2: { fontStyle: 'bold', cellWidth: 45 },
          3: { cellWidth: 35 }
        },
        tableWidth: contentWidth
      });

      yPos = doc.lastAutoTable?.finalY ?? yPos + 10;

      // Add space before next section
      yPos += 15;

      // Expenses
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(t('expense.expenses'), marginLeft, yPos);
      yPos += 8;

      const expensesData = [
        [t('expense.tolls'), '€' + (formData.peajes || '0.00'), t('expense.parking'), '€' + (formData.parking || '0.00')],
        [t('expense.fuel'), '€' + (formData.combustible || '0.00'), t('expense.meals'), '€' + (formData.dietas || '0.00')],
        [t('expense.accommodation'), '€' + (formData.alojamiento || '0.00'), '', '']
      ];

      autoTable(doc, {
        startY: yPos,
        head: [],
        body: expensesData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 35 },
          1: { cellWidth: 45 },
          2: { fontStyle: 'bold', cellWidth: 35 },
          3: { cellWidth: 45 }
        },
        tableWidth: contentWidth
      });

      yPos = doc.lastAutoTable?.finalY ?? yPos + 10;

      // Notes
      if (formData.notas) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(t('form.notes'), marginLeft, yPos);
        yPos += 8;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const splitNotes = doc.splitTextToSize(formData.notas, contentWidth);
        doc.text(splitNotes, marginLeft, yPos);
        yPos += splitNotes.length * 5 + 10;
      }

      yPos += 15;

      // Declaration
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(t('declaration.title'), marginLeft, yPos);
      yPos += 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const declarationText = t('expense.declaration');
      const splitDeclaration = doc.splitTextToSize(declarationText, contentWidth);
      doc.text(splitDeclaration, marginLeft, yPos);
      yPos += splitDeclaration.length * 5 + 10;

      // Signature
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(t('form.signature'), marginLeft, yPos);
      yPos += 8;

      autoTable(doc, {
        startY: yPos,
        head: [],
        body: [
          [t('form.signature'), formData.firma, t('form.date'), formData.fecha_firma]
        ],
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 25 },
          1: { cellWidth: 70, fontStyle: 'italic' },
          2: { fontStyle: 'bold', cellWidth: 20 },
          3: { cellWidth: 50 }
        },
        tableWidth: contentWidth
      });

      // Add page numbers
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        const pageNumber = `${i}/${totalPages}`;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.text(pageNumber, pageWidth - 20, pageHeight - 10);
      }

      const date = new Date().toISOString().split('T')[0];
      doc.save(`expense-report-${date}.pdf`);
    } catch (error) {
      console.error('Error generating PDF for download', error);
      toast.error(t('form.pdf.error'));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
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
            <div className="space-y-2">
              <Label>{t('expense.fuel.type')}</Label>
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
            </div>
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

          <div className="flex justify-end items-center gap-3">
            <Button onClick={handleDownloadPdf} variant="outline" size="lg">
              <Download className="w-4 h-4 mr-2" />
              {t('form.download')}
            </Button>

            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? t('form.sending') : t('form.submit')}
            </Button>
          </div>
        </Card>
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
              <p>Business Expense Report – Ireland Tax Year 2024</p>
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
                href="https://www.linkedin.com/company/nexus-ventures-limited"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Link className="w-4 h-4" />
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ExpenseReport;
