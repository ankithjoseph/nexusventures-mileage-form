import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LogbookData } from '@/types/logbook';

export const generatePDF = (data: LogbookData, includeFillableFields: boolean = false) => {
  const doc = new jsPDF();
  const marginLeft = 15;
  const marginRight = 15;
  const pageWidth = 210; // A4 width in mm
  const contentWidth = pageWidth - marginLeft - marginRight;
  
  let yPos = 20;

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Business Mileage Logbook – Ireland', marginLeft, yPos);
  yPos += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Employee/Director, Tax Year 2024', marginLeft, yPos);
  yPos += 12;

  // Driver & Vehicle Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Driver & Vehicle Information', marginLeft, yPos);
  yPos += 8;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const driverVehicleData = [
    ['Driver Name:', data.driver_name, 'PPSN:', data.ppsn],
    ['Vehicle Registration:', data.vehicle_registration, 'Make & Model:', data.vehicle_make_model],
    ['Purchase Date:', data.purchase_date, 'CO₂ (g/km):', data.co2_g_km.toString()],
    ['Engine Size:', data.engine_size, 'Fuel Type:', data.fuel_type]
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
  
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Trips Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Business Trips', marginLeft, yPos);
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
      head: [['#', 'Date', 'From', 'To', 'Purpose', 'Odo Start', 'Odo End', 'Bus. km', 'Tolls €', 'Notes']],
      body: tripTableData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 22 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 28 },
        5: { cellWidth: 18 },
        6: { cellWidth: 18 },
        7: { cellWidth: 16 },
        8: { cellWidth: 16 },
        9: { cellWidth: 24 }
      }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
  } else {
    yPos += 5;
  }

  // Check if we need a new page
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  // Annual Totals
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Annual Totals', marginLeft, yPos);
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      ['Total km (All):', data.total_km_all.toString(), 'Total km (Business):', data.total_km_business.toString(), 'Business %:', data.business_percent.toString() + '%']
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
  
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Running Costs
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Running Costs (Annual)', marginLeft, yPos);
  yPos += 8;
  
  const runningCostsData = [
    ['Fuel:', `€${data.fuel_eur || '0.00'}`, 'Insurance:', `€${data.insurance_eur || '0.00'}`],
    ['Motor Tax:', `€${data.motor_tax_eur || '0.00'}`, 'Repairs & Maintenance:', `€${data.repairs_maintenance_eur || '0.00'}`],
    ['NCT Testing:', `€${data.nct_testing_eur || '0.00'}`, `${data.other_desc || 'Other'}:`, `€${data.other_eur || '0.00'}`]
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
  
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Capital Allowances
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Capital Allowances', marginLeft, yPos);
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      ['Car Cost:', `€${data.car_cost_eur || '0.00'}`, 'Purchase Date:', data.purchase_date_ca, 'CO₂ Band:', data.co2_band]
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
  
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Declaration
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Declaration', marginLeft, yPos);
  yPos += 8;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  const declarationText = 'I confirm the above journeys were necessarily incurred in the performance of my duties (excludes commuting).';
  const splitText = doc.splitTextToSize(declarationText, contentWidth - 10);
  doc.text(splitText, marginLeft + 5, yPos);
  yPos += splitText.length * 5 + 10;
  
  doc.setFont('helvetica', 'normal');
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      ['Signature:', data.signature, 'Date:', data.signed_date]
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

  return doc;
};
