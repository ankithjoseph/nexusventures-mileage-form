export interface TripRow {
  date: string;
  from: string;
  to: string;
  purpose: string;
  odo_start: number | string;
  odo_end: number | string;
  business_km: number | string;
  tolls_parking: number | string;
  notes: string;
}

export interface LogbookData {
  // Driver & Vehicle
  driver_name: string;
  driver_email: string;
  ppsn: string;
  vehicle_registration: string;
  vehicle_make_model: string;
  purchase_date: string;
  co2_g_km: number | string;
  engine_size: string;
  fuel_type: string;
  
  // Trips
  trips: TripRow[];
  
  // Annual Totals
  total_km_all: number | string;
  total_km_business: number | string;
  business_percent: number | string;
  
  // Running Costs
  fuel_eur: number | string;
  insurance_eur: number | string;
  motor_tax_eur: number | string;
  repairs_maintenance_eur: number | string;
  nct_testing_eur: number | string;
  other_desc: string;
  other_eur: number | string;
  
  // Capital Allowances
  car_cost_eur: number | string;
  purchase_date_ca: string;
  co2_band: string;
  
  // Declaration
  signature: string;
  signed_date: string;
}

export const createEmptyTrip = (): TripRow => ({
  date: '',
  from: '',
  to: '',
  purpose: 'inter-workplace',
  odo_start: '',
  odo_end: '',
  business_km: '',
  tolls_parking: '',
  notes: ''
});

export const createEmptyLogbook = (): LogbookData => ({
  driver_name: '',
  driver_email: '',
  ppsn: '',
  vehicle_registration: '',
  vehicle_make_model: '',
  purchase_date: '',
  co2_g_km: '',
  engine_size: '',
  fuel_type: 'petrol',
  trips: Array(5).fill(null).map(() => createEmptyTrip()),
  total_km_all: '',
  total_km_business: '',
  business_percent: '',
  fuel_eur: '',
  insurance_eur: '',
  motor_tax_eur: '',
  repairs_maintenance_eur: '',
  nct_testing_eur: '',
  other_desc: '',
  other_eur: '',
  car_cost_eur: '',
  purchase_date_ca: '',
  co2_band: '',
  signature: '',
  signed_date: ''
});
