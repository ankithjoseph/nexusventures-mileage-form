import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LogbookData } from '@/types/logbook';
import logoImage from '@/assets/nexus-ventures-logo.png';

// Extend jsPDF type to include autoTable properties
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

export const generatePDF = (data: LogbookData, includeFillableFields: boolean = false, t?: (key: string) => string) => {
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
    doc.addImage(logoImage, 'PNG', pageWidth - marginRight - logoWidth, yPos, logoWidth, logoHeight);
  } catch (error) {
    console.error('Error adding logo to PDF:', error);
  }

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(t ? t('app.title.mileage') : 'Business Mileage Logbook – Ireland', marginLeft, yPos + 5);
  yPos += 11;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(t ? t('app.subtitle') : 'Employee/Director, Tax Year 2024', marginLeft, yPos);
  yPos += 12;

  // Driver & Vehicle Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t ? t('driver.section.title') : 'Driver & Vehicle Information', marginLeft, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const driverVehicleData = [
    [t ? t('driver.name') : 'Driver Name:', data.driver_name, t ? t('driver.ppsn') : 'PPSN:', data.ppsn],
    [t ? t('vehicle.registration') : 'Vehicle Registration:', data.vehicle_registration, t ? t('vehicle.makeModel') : 'Make & Model:', data.vehicle_make_model],
    [t ? t('vehicle.purchaseDate') : 'Purchase Date:', data.purchase_date, t ? t('vehicle.co2').replace(/\u2082/g, '2') : 'CO2 (g/km):', data.co2_g_km.toString()],
    [t ? t('vehicle.engineSize') : 'Engine Size:', data.engine_size, t ? t('vehicle.fuelType') : 'Fuel Type:', data.fuel_type]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: driverVehicleData,
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

  // Trips Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t ? t('mileage.trips') : 'Business Trips', marginLeft, yPos);
  yPos += 5;

  const tripTableData = data.trips
    .filter(trip => trip.date || trip.from || trip.to) // Only include non-empty rows
    .map((trip, index) => [
      (index + 1).toString(),
      trip.date,
      trip.from,
      trip.to,
      trip.purpose,
      trip.odo_start.toString(),
      trip.odo_end.toString(),
      trip.business_km.toString(),
      trip.tolls_parking ? `€${trip.tolls_parking}` : '',
      trip.notes
    ]);

  if (tripTableData.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [[
        t ? '#' : '#',
        t ? t('trip.date') : 'Date',
        t ? t('trip.from') : 'From',
        t ? t('trip.to') : 'To',
        t ? t('trip.business') : 'Purpose',
        t ? t('trip.odoStart') : 'Odo Start',
        t ? t('trip.odoEnd') : 'Odo End',
        t ? t('trip.businessKm') : 'Bus. km',
        t ? t('trip.tollsParking') : 'Tolls €',
        t ? t('trip.notes') : 'Notes'
      ]],
      body: tripTableData,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 20 },
        2: { cellWidth: 22 },
        3: { cellWidth: 22 },
        4: { cellWidth: 22 },
        5: { cellWidth: 18 },
        6: { cellWidth: 18 },
        7: { cellWidth: 16 },
        8: { cellWidth: 16 },
        9: { cellWidth: 18 }
      },
      tableWidth: contentWidth
    });

    yPos = doc.lastAutoTable?.finalY ?? yPos + 10;
  } else {
    yPos += 5;
  }

  // Check if we need a new page
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  // Add space before next section
  yPos += 15;

  // Annual Totals
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t ? t('mileage.totals') : 'Annual Totals', marginLeft, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      [t ? t('totals.totalKmAll') : 'Total km (All):', data.total_km_all.toString(), t ? t('totals.totalKmBusiness') : 'Total km (Business):', data.total_km_business.toString(), t ? t('totals.businessPercent') : 'Business %:', data.business_percent.toString() + '%']
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { cellWidth: 25 },
      2: { fontStyle: 'bold', cellWidth: 38 },
      3: { cellWidth: 25 },
      4: { fontStyle: 'bold', cellWidth: 25 },
      5: { cellWidth: 25 }
    }
  });

  yPos = doc.lastAutoTable?.finalY ?? yPos + 10;

  // Add space before next section
  yPos += 15;

  // Running Costs
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t ? t('runningCosts.title') : 'Running Costs (Annual)', marginLeft, yPos);
  yPos += 8;

  const runningCostsData = [
    [t ? t('runningCosts.fuel') : 'Fuel:', `€${data.fuel_eur || '0.00'}`, t ? t('runningCosts.insurance') : 'Insurance:', `€${data.insurance_eur || '0.00'}`],
    [t ? t('runningCosts.motorTax') : 'Motor Tax:', `€${data.motor_tax_eur || '0.00'}`, t ? t('runningCosts.repairsMaintenance') : 'Repairs & Maintenance:', `€${data.repairs_maintenance_eur || '0.00'}`],
    [t ? t('runningCosts.nctTesting') : 'NCT Testing:', `€${data.nct_testing_eur || '0.00'}`, `${data.other_desc || (t ? t('runningCosts.otherDescription') : 'Other')}:`, `€${data.other_eur || '0.00'}`]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: runningCostsData,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45 },
      1: { cellWidth: 45 },
      2: { fontStyle: 'bold', cellWidth: 45 },
      3: { cellWidth: 45 }
    }
  });

  yPos = doc.lastAutoTable?.finalY ?? yPos + 10;

  // Add space before next section
  yPos += 15;

  // Capital Allowances
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t ? t('capitalAllowances.title') : 'Capital Allowances', marginLeft, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      [t ? t('capitalAllowances.carCost') : 'Car Cost:', `€${data.car_cost_eur || '0.00'}`, t ? t('capitalAllowances.purchaseDate') : 'Purchase Date:', data.purchase_date_ca, (t ? t('capitalAllowances.co2Band').replace(/\u2082/g, '2') : 'CO2 Band'), data.co2_band]
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 25 },
      1: { cellWidth: 35 },
      2: { fontStyle: 'bold', cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { fontStyle: 'bold', cellWidth: 22 },
      5: { cellWidth: 25 }
    }
  });

  yPos = doc.lastAutoTable?.finalY ?? yPos + 10;

  // Add space before next section
  yPos += 15;

  // Declaration
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t ? t('declaration.title') : 'Declaration', marginLeft, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  const declarationText = t ? t('mileage.declaration') : 'I confirm the above journeys were necessarily incurred in the performance of my duties (excludes commuting).';
  const splitText = doc.splitTextToSize(declarationText, contentWidth - 10);
  doc.text(splitText, marginLeft + 5, yPos);
  yPos += splitText.length * 5 + 10;

  doc.setFont('helvetica', 'normal');
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      [t ? t('form.signature') : 'Signature:', data.signature, t ? t('form.date') : 'Date:', data.signed_date]
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 25 },
      1: { cellWidth: 70, fontStyle: 'italic' },
      2: { fontStyle: 'bold', cellWidth: 20 },
      3: { cellWidth: 50 }
    }
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

  return doc;
};
