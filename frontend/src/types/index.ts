// Core entity types based on the requirements

export type PricingType = 'flat' | 'per_unit' | 'slab';
export type FeeType = 'monthly' | 'annual' | 'one_time';
export type GrowthType = 'percentage' | 'fixed';
export type ProjectionInterval = 'monthly' | 'yearly';
export type ParentType = 'model' | 'module';
export type UnitGrowthType = 'fixed' | 'percentage';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
];

export interface Model {
  id: string;
  name: string;
  description?: string;
  currency: string;
  minimum_fee: number;
  implementation_fee: number;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
  modules: ModelModule[];
  unit_types: ModelUnitType[];
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ModuleCatalogue {
  id: string;
  name: string;
  product_id: string;
}

export interface ModelUnitType {
  id: string;
  model_id: string;
  name: string;
  starting_units: number;
  growth_type: UnitGrowthType;
  growth_value: number;
  created_at: string;
  updated_at: string;
}

export interface ModelModule {
  id: string;
  model_id: string;
  unit_type_id: string;
  module_name: string;
  pricing_type: PricingType;
  monthly_fee?: number; // For flat rate or per-unit rate
  one_time_fee?: number; // One-time setup fee
  module_minimum_fee?: number; // Optional minimum for usage-based modules
  slabs: PricingSlab[];
  order: number;
}

export interface PricingSlab {
  id: string;
  from_units: number;
  to_units?: number; // null means infinity
  rate_per_unit: number;
  fee_type: FeeType;
  parent_type: ParentType;
  parent_id: string;
}

export interface Projection {
  id: string;
  model_id: string;
  name: string;
  start_date: string;
  end_date?: string;
  periods?: number;
  interval: ProjectionInterval;
  starting_units: number;
  growth_type: GrowthType;
  growth_value: number;
  created_at: string;
  results: ProjectionResult[];
}

export interface ProjectionResult {
  id: string;
  projection_id: string;
  period: string;
  units: number;
  monthly_fee: number;
  annual_fee: number;
  one_time_fee: number;
  minimum_applied: boolean;
  total: number;
}

// UI State types
export interface CreateModelData {
  name: string;
  description?: string;
  currency: string;
}

export interface CreateModuleData {
  unit_type_id: string;
  module_name: string;
  pricing_type: PricingType;
  monthly_fee?: number;
  annual_fee?: number;
  one_time_fee?: number;
  module_minimum_fee?: number;
  module_implementation_fee?: number;
  slabs: PricingSlab[];
}

export interface CreateUnitTypeData {
  name: string;
  starting_units: number;
  growth_type: UnitGrowthType;
  growth_value: number;
}

export interface CreateSlabData {
  from_units: number;
  to_units?: number;
  rate_per_unit: number;
  fee_type: FeeType;
}

export interface CreateProjectionData {
  name: string;
  start_date: string;
  end_date?: string;
  periods?: number;
  interval: ProjectionInterval;
}

// Default module catalogue - can be modified by users
export const DEFAULT_MODULE_CATALOGUE: ModuleCatalogue[] = [
  { id: 'analytics', name: 'Analytics', product_id: '' },
  { id: 'support', name: 'Support', product_id: '' },
  { id: 'storage', name: 'Storage', product_id: '' },
  { id: 'api', name: 'API Access', product_id: '' },
  { id: 'security', name: 'Security', product_id: '' },
  { id: 'integration', name: 'Integration', product_id: '' },
  { id: 'customization', name: 'Customization', product_id: '' },
  { id: 'training', name: 'Training', product_id: '' },
];
