import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Header
    'app.title': 'Nexus Ventures Forms',
    'app.title.mileage': 'Business Mileage Logbook',
    'app.title.expense': 'Business Expense Report',
    'app.title.sepa': 'SEPA Direct Debit Mandate',
    'app.title.card': 'Card Payment Mandate',
    'app.title.aml': 'AML Compliance Form',
    'app.title.incorporation': 'Company Incorporation',
    'app.subtitle': 'Ireland – Employee/Director, Tax Year 2024',
    'app.subtitle.sepa': 'Authorize direct debit payments',
    'app.subtitle.card': 'Securely authorize card payments',
    'app.subtitle.aml': 'Submit required compliance documentation',
    'app.subtitle.incorporation': 'Provide details for your new company',
    'nav.mileage': 'Mileage Logbook',
    'nav.expense': 'Expense Report',
    'lang.toggle': 'EN',

    // Common
    'form.submit': 'Submit Report',
    'form.download': 'Download PDF',
    'form.sending': 'Sending...',
    'form.name': 'Name',
    'form.email': 'Email',
    'form.pps': 'PPS',
    'form.signature': 'Signature',
    'form.date': 'Date',
    'form.notes': 'Notes',
    'form.required': 'Please complete all required fields',
    'form.email.invalid': 'Please enter a valid email',
    'form.success': 'Report submitted successfully. Check your email.',
    'form.error': 'Error submitting report',
    'form.pdf.error': 'Error generating PDF',
    'form.data.saved': 'Data saved successfully!',
    'form.data.loaded': 'Data loaded successfully!',
    'form.data.save.error': 'Failed to save data',
    'form.data.load.error': 'Failed to load data',

    // Mileage Logbook
    'mileage.title': 'Mileage Logbook',
    'mileage.declaration': 'I confirm the above journeys were necessarily incurred in the performance of my duties (excludes commuting).',
    'mileage.declaration.signature': 'Please complete the signature and date in the Declaration section',
    'mileage.personal.info': 'Personal Information',
    'mileage.vehicle.info': 'Vehicle Information',
    'mileage.trips': 'Business Trips',
    'mileage.add.trip': 'Add Trip',
    'mileage.remove.trip': 'Remove',
    'mileage.total.mileage': 'Total Mileage',
    'mileage.totals': 'Totals',
    'mileage.trips.count': 'Number of Trips',
    'mileage.business.mileage': 'Business Mileage (km)',
    'mileage.rate': 'Rate (€/km)',
    'mileage.total.amount': 'Total Amount (€)',
    'mileage.validation.trip': 'Please complete at least one trip with date, from, to and mileage',
    'mileage.validation.vehicle': 'Please enter the vehicle registration',

    // Driver & Vehicle Section
    'driver.section.title': 'Driver & Vehicle Information',
    'driver.name': 'Driver Name',
    'driver.email': 'Email',
    'driver.ppsn': 'PPSN',
    'driver.address': 'Address',
    'vehicle.registration': 'Vehicle Registration',
    'vehicle.make': 'Make',
    'vehicle.model': 'Model',
    'vehicle.engine': 'Engine Size (cc)',
    'vehicle.fuel': 'Fuel Type',
    'vehicle.co2': 'CO₂ (g/km)',
    'vehicle.seats': 'Number of Seats',
    'vehicle.purchase': 'Purchase Date',
    'vehicle.value': 'Original Value (€)',
    'vehicle.makeModel': 'Make/Model',
    'vehicle.purchaseDate': 'Purchase Date',
    'vehicle.engineSize': 'Engine Size',
    'vehicle.fuelType': 'Fuel Type',
    'vehicle.selectFuelType': 'Select fuel type',
    'vehicle.fuelTypes.petrol': 'Petrol',
    'vehicle.fuelTypes.diesel': 'Diesel',
    'vehicle.fuelTypes.hybrid': 'Hybrid',
    'vehicle.fuelTypes.ev': 'Electric',
    'vehicle.co2Tooltip.title': 'Where to find the CO₂?',
    'vehicle.co2Tooltip.location1': 'On the vehicle registration certificate',
    'vehicle.co2Tooltip.location2': 'On motorcheck.ie (free with registration)',
    'vehicle.co2Tooltip.location3': 'In the vehicle manual',

    // Trip fields
    'trip.date': 'Date',
    'trip.from': 'From',
    'trip.to': 'To',
    'trip.business': 'Business Purpose',
    'trip.mileage': 'Mileage (km)',
    'trip.odoStart': 'Odometer Start',
    'trip.odoEnd': 'Odometer End',
    'trip.businessKm': 'Business km',
    'trip.tollsParking': 'Tolls/Parking €',
    'trip.notes': 'Notes',
    'trip.actions': 'Actions',
    'trip.purpose.interWorkplace': 'Inter-workplace',
    'trip.purpose.temporaryWorkplace': 'Temporary workplace',

    // Expense Report
    'expense.title': 'Expense Report for Business Travel',
    'expense.declaration': 'I confirm that the above expenses were necessarily incurred in the performance of my duties for business travel purposes. All information provided is true and accurate to the best of my knowledge.',
    'expense.personal.info': 'Personal Information',
    'expense.vehicle.info': 'Vehicle Information',
    'expense.mileage.reading': 'Mileage Reading',
    'expense.expenses': 'Expenses',
    'expense.reason': 'Reason for Trip',
    'expense.trip.date': 'Trip Date',
    'expense.origin': 'Origin',
    'expense.destination': 'Destination',
    'expense.license': 'License Plate',
    'expense.make.model': 'Make/Model',
    'expense.fuel.type': 'Fuel Type',
    'expense.co2': 'CO₂ (g/km)',
    'expense.start.km': 'Start km',
    'expense.end.km': 'End km',
    'expense.business.km': 'Business km',
    'expense.tolls': 'Tolls (€)',
    'expense.parking': 'Parking (€)',
    'expense.fuel': 'Fuel (€)',
    'expense.meals': 'Meals (€)',
    'expense.accommodation': 'Accommodation (€)',

    // Placeholders
    'placeholders.name': 'John Doe',
    'placeholders.email': 'john.doe@example.com',
    'placeholders.ppsn': '1234567A',
    'placeholders.registration': '24-D-12345',
    'placeholders.makeModel': 'Toyota Corolla',
    'placeholders.co2': '120',
    'placeholders.engineSize': '1.6L',
    'placeholders.location': 'Location',
    'placeholders.notes': 'Notes',
    'placeholders.description': 'Description',
    'placeholders.co2Band': 'e.g., A, B, C',

    // Expense Report Placeholders
    'expense.placeholders.name': 'Full Name',
    'expense.placeholders.email': 'email@example.com',
    'expense.placeholders.pps': 'PPS Number',
    'expense.placeholders.tripReason': 'Trip Reason',
    'expense.placeholders.origin': 'Origin',
    'expense.placeholders.destination': 'Destination',
    'expense.placeholders.license': 'License Plate',
    'expense.placeholders.makeModel': 'Make/Model',
    'expense.placeholders.notes': 'Additional Notes',
    'expense.placeholders.signature': 'Signature (Name)',

    // Expense Report Fuel Types
    'expense.fuelTypes.gasolina': 'Gasoline',
    'expense.fuelTypes.diesel': 'Diesel',
    'expense.fuelTypes.hibrido': 'Hybrid',
    'expense.fuelTypes.ev': 'EV',

    // Section titles
    'declaration.title': 'Declaration & Signature',
    'trips.title': 'Business Trips',
    'trips.rows': 'rows',
    'trips.addRow': 'Add row',
    'trips.remove': 'Remove',
    'totals.title': 'Annual Totals',
    'totals.totalKmAll': 'Total km (All)',
    'totals.totalKmBusiness': 'Total km (Business)',
    'totals.businessPercent': 'Business Percentage',

    // Running Costs
    'runningCosts.title': 'Running Costs (Annual Totals)',
    'runningCosts.fuel': 'Fuel (€)',
    'runningCosts.insurance': 'Insurance (€)',
    'runningCosts.motorTax': 'Motor Tax (€)',
    'runningCosts.repairsMaintenance': 'Repairs & Maintenance (€)',
    'runningCosts.nctTesting': 'NCT Testing (€)',
    'runningCosts.otherDescription': 'Other Description',
    'runningCosts.otherAmount': 'Other Amount (€)',

    // Capital Allowances
    'capitalAllowances.title': 'Capital Allowances',
    'capitalAllowances.carCost': 'Car Cost (€)',
    'capitalAllowances.purchaseDate': 'Purchase Date',
    'capitalAllowances.co2Band': 'CO₂ Band',
  },
  es: {
    // Header
    'app.title': 'Formularios Nexus Ventures',
    'app.title.mileage': 'Libro de Kilometraje Laboral',
    'app.title.expense': 'Informe de Gastos por Viajes de Trabajo',
    'app.title.sepa': 'Mandato de Débito Directo SEPA',
    'app.title.card': 'Mandato de Pago con Tarjeta',
    'app.title.aml': 'Formulario de Cumplimiento AML',
    'app.title.incorporation': 'Constitución de Empresa',
    'app.subtitle': 'Irlanda - Empleado/Director, Año Fiscal 2024',
    'app.subtitle.sepa': 'Autorizar pagos por domiciliación bancaria',
    'app.subtitle.card': 'Autorizar pagos con tarjeta de forma segura',
    'app.subtitle.aml': 'Enviar documentación de cumplimiento requerida',
    'app.subtitle.incorporation': 'Proporcione detalles para su nueva empresa',
    'nav.mileage': 'Libro de Kilometraje',
    'nav.expense': 'Informe de Gastos',
    'lang.toggle': 'ES',

    // Common
    'form.submit': 'Enviar Informe',
    'form.download': 'Descargar PDF',
    'form.sending': 'Enviando...',
    'form.name': 'Nombre',
    'form.email': 'Email',
    'form.pps': 'PPS',
    'form.signature': 'Firma',
    'form.date': 'Fecha',
    'form.notes': 'Notas',
    'form.required': 'Por favor complete los campos requeridos',
    'form.email.invalid': 'Por favor ingrese un email válido',
    'form.success': 'Informe enviado exitosamente. Revise su email.',
    'form.error': 'Error al enviar el informe',
    'form.pdf.error': 'Error al generar el PDF',
    'form.data.saved': '¡Datos guardados exitosamente!',
    'form.data.loaded': '¡Datos cargados exitosamente!',
    'form.data.save.error': 'Error al guardar los datos',
    'form.data.load.error': 'Error al cargar los datos',

    // Mileage Logbook
    'mileage.title': 'Libro de Kilometraje',
    'mileage.declaration': 'Confirmo que los viajes anteriores fueron necesariamente incurridos en el desempeño de mis funciones (excluye desplazamientos).',
    'mileage.declaration.signature': 'Por favor complete la firma y fecha en la sección de Declaration',
    'mileage.personal.info': 'Información Personal',
    'mileage.vehicle.info': 'Datos del Vehículo',
    'mileage.trips': 'Viajes de Trabajo',
    'mileage.add.trip': 'Agregar Viaje',
    'mileage.remove.trip': 'Eliminar',
    'mileage.total.mileage': 'Kilometraje Total',
    'mileage.totals': 'Totales',
    'mileage.trips.count': 'Número de Viajes',
    'mileage.business.mileage': 'Kilometraje Laboral (km)',
    'mileage.rate': 'Tarifa (€/km)',
    'mileage.total.amount': 'Monto Total (€)',
    'mileage.validation.trip': 'Por favor complete al menos un viaje con fecha, origen, destino y kilómetros',
    'mileage.validation.vehicle': 'Por favor ingrese el registro del vehículo',

    // Driver & Vehicle Section
    'driver.section.title': 'Información del Conductor y Vehículo',
    'driver.name': 'Nombre del Conductor',
    'driver.email': 'Email',
    'driver.ppsn': 'PPS',
    'driver.address': 'Dirección',
    'vehicle.registration': 'Matrícula del Vehículo',
    'vehicle.make': 'Marca',
    'vehicle.model': 'Modelo',
    'vehicle.engine': 'Cilindrada (cc)',
    'vehicle.fuel': 'Tipo de Combustible',
    'vehicle.co2': 'CO₂ (g/km)',
    'vehicle.seats': 'Número de Asientos',
    'vehicle.purchase': 'Fecha de Compra',
    'vehicle.value': 'Valor Original (€)',
    'vehicle.makeModel': 'Marca y Modelo',
    'vehicle.purchaseDate': 'Fecha de Compra',
    'vehicle.engineSize': 'Tamaño del Motor',
    'vehicle.fuelType': 'Tipo de Combustible',
    'vehicle.selectFuelType': 'Seleccionar tipo de combustible',
    'vehicle.fuelTypes.petrol': 'Gasolina',
    'vehicle.fuelTypes.diesel': 'Diésel',
    'vehicle.fuelTypes.hybrid': 'Híbrido',
    'vehicle.fuelTypes.ev': 'Eléctrico',
    'vehicle.co2Tooltip.title': '¿Dónde encontrar el CO₂?',
    'vehicle.co2Tooltip.location1': 'En el certificado de registro del vehículo',
    'vehicle.co2Tooltip.location2': 'En motorcheck.ie (gratis con matrícula)',
    'vehicle.co2Tooltip.location3': 'En el manual del vehículo',

    // Trip fields
    'trip.date': 'Fecha',
    'trip.from': 'Desde',
    'trip.to': 'Hasta',
    'trip.business': 'Propósito Laboral',
    'trip.mileage': 'Kilometraje (km)',
    'trip.odoStart': 'Odómetro Inicio',
    'trip.odoEnd': 'Odómetro Final',
    'trip.businessKm': 'Km Laborales',
    'trip.tollsParking': 'Peajes/Estacionamiento €',
    'trip.notes': 'Notas',
    'trip.actions': 'Acciones',
    'trip.purpose.interWorkplace': 'Entre lugares de trabajo',
    'trip.purpose.temporaryWorkplace': 'Lugar de trabajo temporal',

    // Expense Report
    'expense.title': 'Informe de Gastos por Viajes de Trabajo',
    'expense.declaration': 'Confirmo que los gastos anteriores fueron necesariamente incurridos en el desempeño de mis funciones para fines de viajes de trabajo. Toda la información proporcionada es verdadera y precisa según mi leal saber y entender.',
    'expense.personal.info': 'Información Personal',
    'expense.vehicle.info': 'Datos del Vehículo',
    'expense.mileage.reading': 'Lectura de Kilometraje',
    'expense.expenses': 'Gastos',
    'expense.reason': 'Motivo del viaje',
    'expense.trip.date': 'Fecha del viaje',
    'expense.origin': 'Origen',
    'expense.destination': 'Destino',
    'expense.license': 'Matrícula',
    'expense.make.model': 'Marca/Modelo',
    'expense.fuel.type': 'Tipo de combustible',
    'expense.co2': 'CO₂ (g/km)',
    'expense.start.km': 'Kilómetros inicio',
    'expense.end.km': 'Kilómetros final',
    'expense.business.km': 'Suma de kms realizados por trabajo',
    'expense.tolls': 'Peajes (€)',
    'expense.parking': 'Parking (€)',
    'expense.fuel': 'Combustible (€)',
    'expense.meals': 'Dietas (€)',
    'expense.accommodation': 'Alojamiento (€)',

    // Section titles
    'declaration.title': 'Declaración y Firma',
    'trips.title': 'Viajes de Trabajo',
    'trips.rows': 'filas',
    'trips.addRow': 'Agregar fila',
    'trips.remove': 'Eliminar',
    'totals.title': 'Totales Anuales',
    'totals.totalKmAll': 'Km Totales (Todos)',
    'totals.totalKmBusiness': 'Km Totales (Laborales)',
    'totals.businessPercent': 'Porcentaje Laboral',
    'runningCosts.title': 'Costos de Operación (Totales Anuales)',
    'runningCosts.fuel': 'Combustible (€)',
    'runningCosts.insurance': 'Seguro (€)',
    'runningCosts.motorTax': 'Impuesto de Circulación (€)',
    'runningCosts.repairsMaintenance': 'Reparaciones y Mantenimiento (€)',
    'runningCosts.nctTesting': 'Prueba NCT (€)',
    'runningCosts.otherDescription': 'Otra Descripción',
    'runningCosts.otherAmount': 'Otro Monto (€)',
    'capitalAllowances.title': 'Deducciones por Capital',
    'capitalAllowances.carCost': 'Costo del Vehículo (€)',
    'capitalAllowances.purchaseDate': 'Fecha de Compra',
    'capitalAllowances.co2Band': 'Banda CO₂',

    // Placeholders
    'placeholders.name': 'Juan Pérez',
    'placeholders.email': 'juan.perez@ejemplo.com',
    'placeholders.ppsn': '1234567A',
    'placeholders.registration': '24-D-12345',
    'placeholders.makeModel': 'Toyota Corolla',
    'placeholders.co2': '120',
    'placeholders.engineSize': '1.6L',
    'placeholders.location': 'Ubicación',
    'placeholders.notes': 'Notas',
    'placeholders.description': 'Descripción',
    'placeholders.co2Band': 'ej. A, B, C',

    // Expense Report Placeholders
    'expense.placeholders.name': 'Nombre completo',
    'expense.placeholders.email': 'email@ejemplo.com',
    'expense.placeholders.pps': 'Número PPS',
    'expense.placeholders.tripReason': 'Motivo del viaje',
    'expense.placeholders.origin': 'Origen',
    'expense.placeholders.destination': 'Destino',
    'expense.placeholders.license': 'Matrícula',
    'expense.placeholders.makeModel': 'Marca/Modelo',
    'expense.placeholders.notes': 'Notas adicionales',
    'expense.placeholders.signature': 'Firma (Nombre)',

    // Expense Report Fuel Types
    'expense.fuelTypes.gasolina': 'Gasolina',
    'expense.fuelTypes.diesel': 'Diésel',
    'expense.fuelTypes.hibrido': 'Híbrido',
    'expense.fuelTypes.ev': 'EV',
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Try to get from localStorage, default to 'en'
    const saved = localStorage.getItem('language');
    return (saved === 'en' || saved === 'es') ? saved : 'en';
  });

  const toggleLanguage = () => {
    setLanguage(prev => {
      const newLang = prev === 'en' ? 'es' : 'en';
      localStorage.setItem('language', newLang);
      return newLang;
    });
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};