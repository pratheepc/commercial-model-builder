import mongoose from 'mongoose';

// Pricing Slab Schema
const pricingSlabSchema = new mongoose.Schema({
  from_units: { type: Number, required: true },
  to_units: { type: Number, default: null }, // null means unlimited
  rate_per_unit: { type: Number, required: true },
  fee_type: { 
    type: String, 
    enum: ['monthly', 'annual', 'one-time'], 
    required: true 
  },
  parent_type: { 
    type: String, 
    enum: ['module', 'model'], 
    required: true 
  },
  parent_id: { type: String, required: true }
}, {
  timestamps: true
});

// Model Unit Type Schema
const modelUnitTypeSchema = new mongoose.Schema({
  model_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Model', required: true },
  name: { type: String, required: true },
  starting_units: { type: Number, required: true, default: 0 },
  growth_type: { 
    type: String, 
    enum: ['fixed', 'percentage'], 
    required: true,
    default: 'percentage'
  },
  growth_value: { type: Number, required: true, default: 0 }
}, {
  timestamps: true
});

// Module Schema
const moduleSchema = new mongoose.Schema({
  model_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Model', required: true },
  unit_type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ModelUnitType', required: true },
  module_name: { type: String, required: true },
  pricing_type: { 
    type: String, 
    enum: ['flat', 'per_unit', 'slab'], 
    required: true 
  },
  monthly_fee: { type: Number, default: 0 },
  annual_fee: { type: Number, default: 0 },
  one_time_fee: { type: Number, default: 0 },
  module_minimum_fee: { type: Number, default: 0 },
  module_implementation_fee: { type: Number, default: 0 },
  order: { type: Number, required: true },
  slabs: [pricingSlabSchema]
}, {
  timestamps: true
});

// Model Schema
const modelSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  minimum_fee: { type: Number, default: 0 },
  implementation_fee: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'draft'], 
    default: 'active' 
  },
  modules: [moduleSchema]
}, {
  timestamps: true
});

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' }
}, {
  timestamps: true
});

// Module Catalogue Schema
const moduleCatalogueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false }
}, {
  timestamps: true
});

// Projection Schema
const projectionSchema = new mongoose.Schema({
  model_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Model', required: true },
  name: { type: String, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: false },
  periods: { type: Number, required: false },
  interval: { 
    type: String, 
    enum: ['monthly', 'yearly'], 
    required: true 
  },
  results: [{
    period: { type: Number, required: true },
    date: { type: Date, required: true },
    units: { type: Number, required: true },
    total_fee: { type: Number, required: true },
    breakdown: {
      module_fees: [{
        module_name: String,
        fee: Number
      }],
      minimum_fee: Number,
      implementation_fee: Number
    }
  }]
}, {
  timestamps: true
});

// Create and export models
export const Model = mongoose.model('Model', modelSchema);
export const Product = mongoose.model('Product', productSchema);
export const ModelUnitType = mongoose.model('ModelUnitType', modelUnitTypeSchema);
export const ModuleCatalogue = mongoose.model('ModuleCatalogue', moduleCatalogueSchema);
export const Projection = mongoose.model('Projection', projectionSchema);
