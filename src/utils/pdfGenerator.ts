import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LogbookData } from '@/types/logbook';
import logoImage from '@/assets/nexus-ventures-logo.png';
import italogo from '@/assets/ITA-logo.png';

import type { CompanyIncorporationData } from '@/components/CompanyIncorporationForm';

// Extend jsPDF type to include autoTable properties
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

export const generatePDF = (data: LogbookData, _includeFillableFields: boolean = false, t?: (key: string) => string) => {
  const doc: jsPDFWithAutoTable = new jsPDF({ compress: true });
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
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(t ? t('app.title.mileage') : 'Business Mileage Logbook – Ireland', marginLeft, yPos + 5);
  yPos += 11;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(t ? t('app.subtitle') : 'Employee/Director, Tax Year 2024', marginLeft, yPos);
  yPos += 12;

  // Driver & Vehicle Information
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(t ? t('driver.section.title') : 'Driver & Vehicle Information', marginLeft, yPos);
  yPos += 8;

  doc.setFontSize(8);
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
      styles: { fontSize: 8, cellPadding: 1.5 },
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
  doc.setFontSize(11);
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
    styles: { fontSize: 8, cellPadding: 1.5 },
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
  doc.setFontSize(11);
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
    styles: { fontSize: 8, cellPadding: 1.5 },
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
  doc.setFontSize(11);
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
    styles: { fontSize: 8, cellPadding: 1.5 },
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

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(t ? t('declaration.title') : 'Declaration', marginLeft, yPos);
  yPos += 8;

  doc.setFontSize(8);
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
    styles: { fontSize: 8, cellPadding: 1.5 },
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

export const generateExpensePDF = (formData: any, t?: (key: string) => string) => {
  const doc: jsPDFWithAutoTable = new jsPDF({ compress: true });
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
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(t ? t('app.title.expense') : 'Expense Report', marginLeft, yPos + 5);
  yPos += 11;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(t ? t('app.subtitle') : 'Employee/Director, Tax Year 2024', marginLeft, yPos);
  yPos += 12;

  // Personal Information
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(t ? t('expense.personal.info') : 'Personal Information', marginLeft, yPos);
  yPos += 8;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  const personalData = [
    [t ? t('form.name') : 'Name:', formData.name, t ? t('form.pps') : 'PPS:', formData.pps],
    ['Email:', formData.email, '', ''],
    [t ? t('expense.reason') : 'Reason for Trip:', formData.motivo_viaje, '', ''],
    [t ? t('expense.trip.date') : 'Trip Date:', formData.fecha_viaje, t ? t('expense.origin') : 'Origin:', formData.origen],
    [t ? t('expense.destination') : 'Destination:', formData.destino, '', '']
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: personalData,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1.5 },
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
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(t ? t('expense.vehicle.info') : 'Vehicle Information', marginLeft, yPos);
  yPos += 8;

  const vehicleData = [
    [t ? t('expense.license') : 'License Plate:', formData.matricula, t ? t('expense.make.model') : 'Make & Model:', formData.marca_modelo],
    [t ? t('expense.fuel.type') : 'Fuel Type:', formData.tipo_combustible, t ? t('expense.co2').replace(/\u2082/g, '2') : 'CO2 (g/km):', formData.co2_g_km]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: vehicleData,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1.5 },
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
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(t ? t('expense.mileage.reading') : 'Mileage Reading', marginLeft, yPos);
  yPos += 8;

  const mileageData = [
    [t ? t('expense.start.km') : 'Start KM:', formData.km_inicio + ' km', t ? t('expense.end.km') : 'End KM:', formData.km_final + ' km'],
    [t ? t('expense.business.km') : 'Business KM:', formData.suma_km_trabajo + ' km', '', '']
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: mileageData,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1.5 },
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
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(t ? t('expense.expenses') : 'Expenses', marginLeft, yPos);
  yPos += 8;

  const expensesData = [
    [t ? t('expense.tolls') : 'Tolls:', '€' + (formData.peajes || '0.00'), t ? t('expense.parking') : 'Parking:', '€' + (formData.parking || '0.00')],
    [t ? t('expense.fuel') : 'Fuel:', '€' + (formData.combustible || '0.00'), t ? t('expense.meals') : 'Meals:', '€' + (formData.dietas || '0.00')],
    [t ? t('expense.accommodation') : 'Accommodation:', '€' + (formData.alojamiento || '0.00'), '', '']
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: expensesData,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { cellWidth: 45 },
      2: { fontStyle: 'bold', cellWidth: 35 },
      3: { cellWidth: 45 }
    }
  });

  yPos = doc.lastAutoTable?.finalY ?? yPos + 10;
    // Add space before next section
  yPos += 15;

  // Notes
  if (formData.notas) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(t ? t('form.notes') : 'Notes', marginLeft, yPos);
    yPos += 8;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(formData.notas, contentWidth);
    doc.text(splitNotes, marginLeft, yPos);
    yPos += splitNotes.length * 5 + 10;
      // Add space before next section
  yPos += 15;
  }

  // Declaration
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(t ? t('declaration.title') : 'Declaration', marginLeft, yPos);
  yPos += 8;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const declarationText = t ? t('expense.declaration') : 'I confirm that the above expenses were necessarily incurred in the performance of my duties.';
  const splitDeclaration = doc.splitTextToSize(declarationText, contentWidth);
  doc.text(splitDeclaration, marginLeft, yPos);
  yPos += splitDeclaration.length * 5 + 20;


  // Signature
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(t ? t('form.signature') : 'Signature', marginLeft, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      [t ? t('form.signature') : 'Signature:', formData.firma, t ? t('form.date') : 'Date:', formData.fecha_firma]
    ],
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1.5 },
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

export const generateCompanyIncorporationPDF = (data: CompanyIncorporationData) => {
  const doc: jsPDFWithAutoTable = new jsPDF({ compress: true });
  const marginLeft = 12;
  const marginRight = 12;
  const pageWidth = 210;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let yPos = 10;

  // Helper to ensure there is enough space left on the page for upcoming content.
  const ensureSpace = (neededHeight: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    const bottomMargin = 10; // keep consistent footer spacing
    if (yPos + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      yPos = 10; // top margin for subsequent pages
    }
  };

  try {
    const logoWidth = 38;
    const logoHeight = 14
    doc.addImage(logoImage, 'PNG', pageWidth - marginRight - logoWidth, yPos, logoWidth, logoHeight);
  } catch (error) {
    console.error('Error adding logo to company PDF:', error);
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Company Incorporation Form', marginLeft, yPos + 5);
  yPos += 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Application details for company incorporation', marginLeft, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Applicant Information', marginLeft, yPos);
  yPos += 4;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      ['Full Name', data.applicant.fullName, 'Email', data.applicant.email],
      ['Phone', data.applicant.phone, '', ''],
      ['Address', data.applicant.address, '', '']
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: 'bold' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 28 },
      1: { cellWidth: (contentWidth / 2) - 28 },
      2: { fontStyle: 'bold', cellWidth: 24 },
      3: { cellWidth: (contentWidth / 2) - 24 }
    },
    tableWidth: contentWidth
  });

  yPos = doc.lastAutoTable?.finalY ?? yPos + 8;
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Company Information', marginLeft, yPos);
  yPos += 4;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      ['Preferred Name', data.company.preferredName, 'Alternative Name', data.company.alternativeName],
      ['Address', data.company.address, 'Eircode', data.company.eircode],
      ['Activities', data.company.activities, '', '']
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: 'bold' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 30 },
      1: { cellWidth: (contentWidth / 2) - 30 },
      2: { fontStyle: 'bold', cellWidth: 28 },
      3: { cellWidth: (contentWidth / 2) - 28 }
    },
    tableWidth: contentWidth
  });

  yPos = doc.lastAutoTable?.finalY ?? yPos + 8;
  yPos += 8;

  ensureSpace(18);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Directors', marginLeft, yPos);
  yPos += 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  data.directors.forEach((d, idx) => {
    ensureSpace(48); // rough space for one director block

    doc.setFont('helvetica', 'bold');
    doc.text(`Director ${idx + 1}`, marginLeft, yPos);
    yPos += 3;
    doc.setFont('helvetica', 'normal');

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: [
        ['Full Name', d.fullName, 'Email', d.email],
        ['Phone', d.phone, 'DOB', d.dob],
        ['Address', d.address, 'Nationality', d.nationality],
        ['PPS', d.pps, 'Profession', d.profession]
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: 'bold' },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 30 },
        1: { cellWidth: (contentWidth / 2) - 30 },
        2: { fontStyle: 'bold', cellWidth: 30 },
        3: { cellWidth: (contentWidth / 2) - 30 }
      },
      tableWidth: contentWidth
    });

    yPos = doc.lastAutoTable?.finalY ?? yPos + 8;
    yPos += 6;
  });

  yPos += 2;

  ensureSpace(24);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Company Secretary', marginLeft, yPos);
  yPos += 4;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  if (data.secretary?.isNexusSecretary) {
    yPos += 2;
    const text = 'NEXUS VENTURES to be appointed as company secretary';
    const lines = doc.splitTextToSize(text, contentWidth);
    ensureSpace((lines as string[]).length * 5 + 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(lines, marginLeft, yPos);
    //yPos += 8;
    (doc as any).lastAutoTable = undefined;
  } else if (data.secretary) {
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: [
        ['Full Name', data.secretary.fullName, 'DOB', data.secretary.dob],
        ['Phone', data.secretary.phone, 'Email', data.secretary.email],
        ['Address', data.secretary.address, 'Nationality', data.secretary.nationality]
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: 'bold' },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 30 },
        1: { cellWidth: (contentWidth / 2) - 30 },
        2: { fontStyle: 'bold', cellWidth: 28 },
        3: { cellWidth: (contentWidth / 2) - 28 }
      },
      tableWidth: contentWidth
    });
  }

  yPos = doc.lastAutoTable?.finalY ?? yPos + 4;
  yPos += 6;

  ensureSpace(28);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Ownership & Share Capital', marginLeft, yPos);
  yPos += 4;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const ownersBody = data.ownership.owners.map((o, idx) => [
    String(idx + 1),
    o.fullName,
    o.nationality,
    `${o.sharePercentage}%`
  ]);

  if (ownersBody.length) {
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: ownersBody,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 65 },
        2: { cellWidth: 55 },
        3: { cellWidth: 30 }
      },
      tableWidth: contentWidth
    });

    yPos = doc.lastAutoTable?.finalY ?? yPos + 10;
  }

  yPos += 4;

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [['Total Share Capital', `€${data.shareCapital.toString()}`]],
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 40 }
    }
  });

  yPos = doc.lastAutoTable?.finalY ?? yPos + 6;
  yPos += 6;

  // Declaration section
  ensureSpace(16); // declaration heading + text + signature/date
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Declaration', marginLeft, yPos);
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  const confirmText =
    'I confirm that the information provided is true and complete and that I wish to proceed with the incorporation as outlined.';
  const split = doc.splitTextToSize(confirmText, contentWidth);
  doc.text(split, marginLeft, yPos);

  // Space after statement
  yPos += 4;
  ensureSpace(10); // space for signature/date after declaration text


  // Signature image only (no label/border) with date to the right
  const sigW = Math.min(contentWidth * 0.7, 110);
  const sigH = 22;
  const sigX = marginLeft;
  const sigY = yPos;
  try {
    if (data.signatureData) {
      doc.addImage(data.signatureData as string, 'PNG', sigX, sigY, sigW, sigH);
    }
  } catch {}

  if (data.signatureDate) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const dateX = sigX + sigW + 8;
    const dateY = sigY + sigH - (sigH/2);
    const pageMaxX = doc.internal.pageSize.getWidth() - 12; // respect right margin
    const text = "Date: " + String(data.signatureDate);
    if (dateX + 30 > pageMaxX) {
      // Fallback: print below signature if not enough horizontal space
      doc.text(text, sigX, sigY + sigH + 6);
      yPos = sigY + sigH + 10;
    } else {
      doc.text(text, dateX, dateY);
      yPos = sigY + sigH + 8;
    }
  } else {
    yPos = sigY + sigH + 6;
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const pageNumber = `${i}/${totalPages}`;
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.text(pageNumber, w - 20, h - 10);
  }

  return doc;
};


export interface SepaPdfData {
  name: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
  iban: string;
  bic: string;
  creditor?: string; // defaults to Nexus Ventures
  paymentType?: 'recurrent' | 'one-off' | '';
  signatureDate?: string;
  signatureData?: string | null; // data URL (PNG)
}

export const generateSepaPDF = (data: SepaPdfData) => {
  const doc: jsPDF = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const pageWidth = (doc as any).internal.pageSize.getWidth();

  doc.setFillColor(228, 224, 206);
  doc.rect(10, 10, pageWidth - 20, 18, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SEPA Direct Debit Mandate', pageWidth / 2, 22, { align: 'center' } as any);

  try {
    const logoW = 30;
    const logoH = 12;
    doc.addImage(logoImage as unknown as string, 'PNG', pageWidth - 12 - logoW, 12, logoW, logoH);
  } catch {}

  const headerBottom = 10 + 18;
  const creditorBandY = headerBottom + 2;
  const creditorBandH = 20;
  doc.setFillColor(219, 234, 254);
  doc.rect(10, creditorBandY, pageWidth - 20, creditorBandH, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('*Creditor Identifier: IE75ZZZ362238', 14, creditorBandY + creditorBandH / 2 + 4);

  const legalStart = creditorBandY + creditorBandH + 4;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const legal = 'By signing this mandate form, you authorise (A) Nexus Ventures Ltd to send instructions to your bank to debit your account and (B) your bank to debit your account in accordance with the instruction from Nexus Ventures Ltd. As part of your rights, you are entitled to a refund from your bank under the terms and conditions of your agreement with your bank. Please complete all the fields below marked *';
  const splitted = doc.splitTextToSize(legal, pageWidth - 24);
  doc.text(splitted as any, 12, legalStart);

  let y = legalStart + (splitted as string[]).length * 4 + 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('*Customer Name :', 12, y);
  doc.setDrawColor(0);
  doc.rect(60, y - 6, pageWidth - 72, 8);
  if (data.name) {
    doc.setFont('helvetica', 'normal');
    doc.text(data.name, 62, y);
  }

  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Address:', 12, y);
  doc.setDrawColor(0);
  doc.rect(60, y - 8, pageWidth - 72, 24);
  if (data.address) {
    doc.setFont('helvetica', 'normal');
    const addressLines = doc.splitTextToSize(data.address, pageWidth - 80);
    doc.text(addressLines as any, 62, y + 2);
  }

  y += 34;
  doc.setFont('helvetica', 'bold');
  doc.text('*City:', 12, y);
  const cityBoxX = 30;
  const cityBoxW = 40;
  const postcodeBoxX = cityBoxX + cityBoxW + 25;
  const postcodeBoxW = 40;
  const countryBoxW = 40;
  const countryBoxX = pageWidth - countryBoxW - 12;
  doc.rect(cityBoxX, y - 6, cityBoxW, 8);
  doc.rect(postcodeBoxX, y - 6, postcodeBoxW, 8);
  doc.rect(countryBoxX, y - 6, countryBoxW, 8);
  doc.text('*Postcode:', postcodeBoxX - 22, y);
  doc.text('*Country:', countryBoxX - 20, y);
  if (data.city) { doc.setFont('helvetica', 'normal'); doc.text(data.city, cityBoxX + 2, y); }
  if (data.postcode) { doc.setFont('helvetica', 'normal'); doc.text(data.postcode, postcodeBoxX + 2, y); }
  if (data.country) { doc.setFont('helvetica', 'normal'); doc.text(data.country, countryBoxX + 2, y); }

  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.text('*Account number (IBAN) :', 12, y);
  doc.rect(60, y - 6, pageWidth - 72, 8);
  if (data.iban) { doc.setFont('helvetica', 'normal'); doc.text(data.iban, 62, y); }

  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.text('*Swift BIC :', 12, y);
  doc.rect(60, y - 6, 60, 8);
  if (data.bic) { doc.setFont('helvetica', 'normal'); doc.text(data.bic, 62, y); }

  y += 16;
  doc.setDrawColor(0);
  doc.rect(12, y, pageWidth - 24, 26);
  doc.setFontSize(9);
  doc.text('*Creditors Name : Nexus Ventures Limited & Irish Tax Agents Limited', 14, y + 6);
  doc.text('*Creditors Address: Nexus, Officepods Cranford Centre, Stillorgan Rd., Dublin. D04F1P2', 14, y + 12);
  doc.text('*Country : Republic of Ireland', 14, y + 18);

  y += 36;
  doc.setFontSize(10);
  doc.text('*Type of payment', 12, y);
  const recurrentX = 70;
  const oneOffX = 140;
  doc.setDrawColor(0);
  doc.circle(recurrentX, y - 1.5, 2, 'S');
  doc.text('Recurrent', recurrentX + 6, y);
  doc.circle(oneOffX, y - 1.5, 2, 'S');
  doc.text('One-Off', oneOffX + 6, y);
  if (data.paymentType === 'recurrent') { doc.setFillColor(0, 0, 0); doc.circle(recurrentX, y - 1.5, 1.2, 'F'); }
  else if (data.paymentType === 'one-off') { doc.setFillColor(0, 0, 0); doc.circle(oneOffX, y - 1.5, 1.2, 'F'); }

  y += 12;
  doc.text('*Date of signing :', 12, y);
  doc.rect(45, y - 6, 60, 8);
  if (data.signatureDate) { doc.setFont('helvetica', 'normal'); doc.text(data.signatureDate, 47, y); }

  y += 18;
  doc.text('*Signature(s) :', 12, y);
  const sigX = 60;
  const sigY = y - 6;
  const sigW = 100;
  const sigH = 24;
  doc.rect(sigX, sigY, sigW, sigH);
  try {
    if (data.signatureData) {
      doc.addImage(data.signatureData, 'PNG', sigX + 2, sigY + 2, sigW - 4, sigH - 4);
    }
  } catch {}

  return doc;
};

export interface CardPaymentPdfData {
  name: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
  creditor?: string; // defaults to Irish Tax Agents Limited
  paymentType?: 'recurrent' | 'one-off' | '';
  signatureDate?: string;
  signatureData?: string | null; // data URL (PNG)
}

export const generateCardPaymentPDF = (data: CardPaymentPdfData) => {
  const doc: jsPDF = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const pageWidth = (doc as any).internal.pageSize.getWidth();

  doc.setFillColor(228, 224, 206);
  doc.rect(10, 10, pageWidth - 20, 18, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CARD PAYMENT', pageWidth / 2, 22, { align: 'center' } as any);

  try {
    const logoW = 30;
    const logoH = 14;
    doc.addImage(italogo as unknown as string, 'PNG', pageWidth - 12 - logoW, 12, logoW, logoH);
  } catch {}

  const headerBottom = 10 + 18;
  const creditorBandY = headerBottom + 2;
  const creditorBandH = 20;
  doc.setFillColor(219, 234, 254);
  doc.rect(10, creditorBandY, pageWidth - 20, creditorBandH, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('*Creditor Identifier: IE58ZZZ362641', 14, creditorBandY + creditorBandH / 2 + 4);

  const legalStart = creditorBandY + creditorBandH + 4;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const legal = 'Legal Text: By signing this mandate form, you authorise (A) Irish Tax Agents LTD. To send instructions to your bank to debit your account and (B) your bank to debit your account in accordance with the instruction from Irish Tax Agents LTD. As part of your rights, you are entitled to a refund from your bank under the terms and conditions of your agreement with your bank. A refund must be claimed within 8 weeks starting from the date on which your account was debited. Your rights are explained in a statement that you can obtain from your bank. Please complete all the fields below marked *';
  const splitted = doc.splitTextToSize(legal, pageWidth - 24);
  doc.text(splitted as any, 12, legalStart);

  let y = legalStart + (splitted as string[]).length * 4 + 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Name :', 12, y);
  doc.rect(60, y - 6, pageWidth - 72, 8);
  if (data.name) { doc.setFont('helvetica', 'normal'); doc.text(data.name, 62, y); }

  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Address:', 12, y);
  doc.rect(60, y - 8, pageWidth - 72, 24);
  if (data.address) {
    doc.setFont('helvetica', 'normal');
    const addressLines = doc.splitTextToSize(data.address, pageWidth - 80);
    doc.text(addressLines as any, 62, y + 2);
  }

  y += 34;
  doc.setFont('helvetica', 'bold');
  doc.text('*City:', 12, y);
  const cityBoxX = 30;
  const cityBoxW = 40;
  const postcodeBoxX = cityBoxX + cityBoxW + 25;
  const postcodeBoxW = 40;
  const countryBoxW = 40;
  const countryBoxX = pageWidth - countryBoxW - 12;
  doc.rect(cityBoxX, y - 6, cityBoxW, 8);
  doc.rect(postcodeBoxX, y - 6, postcodeBoxW, 8);
  doc.rect(countryBoxX, y - 6, countryBoxW, 8);
  doc.text('*Postcode:', postcodeBoxX - 22, y);
  doc.text('*Country:', countryBoxX - 20, y);
  if (data.city) { doc.setFont('helvetica', 'normal'); doc.text(data.city, cityBoxX + 2, y); }
  if (data.postcode) { doc.setFont('helvetica', 'normal'); doc.text(data.postcode, postcodeBoxX + 2, y); }
  if (data.country) { doc.setFont('helvetica', 'normal'); doc.text(data.country, countryBoxX + 2, y); }

  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.text('*Card Number', 12, y);
  doc.rect(60, y - 6, pageWidth - 72, 8);
  if (data.cardNumber) { doc.setFont('helvetica', 'normal'); doc.text(data.cardNumber, 62, y); }

  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.text('*Expiration Date', 12, y);
  doc.rect(60, y - 6, 40, 8);
  doc.text('*CVC', 110, y);
  doc.rect(126, y - 6, 30, 8);
  if (data.expiry) { doc.setFont('helvetica', 'normal'); doc.text(data.expiry, 62, y); }
  if (data.cvc) { doc.setFont('helvetica', 'normal'); doc.text(data.cvc, 128, y); }

  y += 16;
  doc.setDrawColor(0);
  doc.rect(12, y, pageWidth - 24, 28);
  doc.setFontSize(9);
  doc.text('*Creditors Name: Irish Tax Agents Limited', 14, y + 6);
  doc.text('*Creditors Address: Nexus, Officepods Cranford Centre, Stillorgan Rd., Dublin 4 (D04F1P2)', 14, y + 12);
  doc.text('*Country: Republic of Ireland', 14, y + 18);

  y += 36;
  doc.setFontSize(10);
  doc.text('*Type of payment', 12, y);
  const recurrentX = 90;
  const oneOffX = 160;
  doc.circle(recurrentX, y - 1.5, 2, 'S');
  doc.text('Recurrent', recurrentX + 6, y);
  doc.circle(oneOffX, y - 1.5, 2, 'S');
  doc.text('One-Off Payment', oneOffX + 6, y);
  if (data.paymentType === 'recurrent') { doc.setFillColor(0, 0, 0); doc.circle(recurrentX, y - 1.5, 1.2, 'F'); }
  else if (data.paymentType === 'one-off') { doc.setFillColor(0, 0, 0); doc.circle(oneOffX, y - 1.5, 1.2, 'F'); }

  y += 12;
  doc.text('*Date of signing:', 12, y);
  doc.rect(45, y - 6, 60, 8);
  if (data.signatureDate) { doc.setFont('helvetica', 'normal'); doc.text(data.signatureDate, 47, y); }

  y += 18;
  doc.text('*Signature(s):', 12, y);
  const sigX = 60;
  const sigY = y - 6;
  const sigW = 100;
  const sigH = 24;
  doc.rect(sigX, sigY, sigW, sigH);
  try {
    if (data.signatureData) {
      doc.addImage(data.signatureData, 'PNG', sigX + 2, sigY + 2, sigW - 4, sigH - 4);
    }
  } catch {}

  return doc;
};
