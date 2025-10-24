import { Model, ModelModule, PricingSlab, ProjectionResult, UnitGrowthType } from '@/types';

/**
 * Calculate module fee based on pricing type and unit count
 */
export function calculateModuleFee(units: number, module: ModelModule): number {
  let fee = 0;

  switch (module.pricing_type) {
    case 'flat':
      fee = module.monthly_fee || 0;
      break;
    
    case 'per_unit':
      fee = units * (module.monthly_fee || 0);
      break;
    
    case 'slab':
      fee = calculateSlabFee(units, module.slabs);
      break;
  }

  // Apply module minimum fee if specified
  if (module.module_minimum_fee && fee < module.module_minimum_fee) {
    fee = module.module_minimum_fee;
  }

  return fee;
}

/**
 * Calculate slab-based pricing
 */
export function calculateSlabFee(units: number, slabs: PricingSlab[]): number {
  if (slabs.length === 0) return 0;

  // Sort slabs by from_units
  const sortedSlabs = [...slabs].sort((a, b) => a.from_units - b.from_units);
  
  let totalFee = 0;
  let remainingUnits = units;

  for (const slab of sortedSlabs) {
    if (remainingUnits <= 0) break;
    
    const slabStart = slab.from_units;
    const slabEnd = slab.to_units || units; // null means infinity
    const slabRate = slab.rate_per_unit;
    
    // Calculate units in this slab
    const unitsInSlab = Math.min(remainingUnits, slabEnd) - Math.max(slabStart, 0);
    
    if (unitsInSlab > 0) {
      totalFee += unitsInSlab * slabRate;
      remainingUnits -= unitsInSlab;
    }
  }

  return totalFee;
}

/**
 * Calculate units for a specific unit type based on growth parameters
 */
export function calculateUnitTypeUnits(
  startingUnits: number,
  growthType: UnitGrowthType,
  growthValue: number,
  period: number
): number {
  if (period === 0) return startingUnits;
  
  if (growthType === 'fixed') {
    return startingUnits + (growthValue * period);
  } else {
    return Math.round(startingUnits * Math.pow(1 + growthValue / 100, period));
  }
}

/**
 * Calculate total model fee including all modules grouped by unit types
 */
export function calculateModelTotalWithUnitTypes(
  unitTypeUnits: { [unitTypeId: string]: number },
  model: Model
): {
  total: number;
  unitTypeFees: { [unitTypeId: string]: { moduleFees: { moduleId: string; fee: number }[]; total: number } };
  minimumApplied: boolean;
  implementationFee: number;
} {
  const unitTypeFees: { [unitTypeId: string]: { moduleFees: { moduleId: string; fee: number }[]; total: number } } = {};
  let totalBeforeMinimum = 0;

  // Calculate fees for each unit type
  for (const unitType of model.unit_types || []) {
    const units = unitTypeUnits[unitType.id] || 0;
    const modulesForUnitType = model.modules.filter(module => module.unit_type_id === unitType.id);
    
    const moduleFees = modulesForUnitType.map(module => ({
      moduleId: module.id,
      fee: calculateModuleFee(units, module)
    }));

    const unitTypeTotal = moduleFees.reduce((sum, { fee }) => sum + fee, 0);
    unitTypeFees[unitType.id] = { moduleFees, total: unitTypeTotal };
    totalBeforeMinimum += unitTypeTotal;
  }
  
  // Apply model minimum fee
  const minimumApplied = totalBeforeMinimum < model.minimum_fee;
  const total = minimumApplied ? model.minimum_fee : totalBeforeMinimum;
  
  // Add implementation fee (only for first period in projections)
  const implementationFee = model.implementation_fee || 0;

  return {
    total: total + implementationFee,
    unitTypeFees,
    minimumApplied,
    implementationFee
  };
}

/**
 * Generate projection results based on multiple unit types
 */
export function generateProjection(
  model: Model,
  startDate: string,
  periods: number,
  interval: 'monthly' | 'yearly'
): ProjectionResult[] {
  const results: ProjectionResult[] = [];
  let currentDate = new Date(startDate);
  let isFirstPeriod = true;

  for (let i = 0; i < periods; i++) {
    // Calculate units for each unit type
    const unitTypeUnits: { [unitTypeId: string]: number } = {};
    let totalUnits = 0;

    for (const unitType of model.unit_types || []) {
      const units = calculateUnitTypeUnits(
        unitType.starting_units,
        unitType.growth_type,
        unitType.growth_value,
        i
      );
      unitTypeUnits[unitType.id] = units;
      totalUnits += units;
    }

    const calculation = calculateModelTotalWithUnitTypes(unitTypeUnits, model);
    
    results.push({
      id: `result-${i}`,
      projection_id: '',
      period: currentDate.toISOString().split('T')[0],
      units: totalUnits,
      monthly_fee: calculation.total - (isFirstPeriod ? calculation.implementationFee : 0),
      annual_fee: 0, // Could be calculated if needed
      one_time_fee: isFirstPeriod ? calculation.implementationFee : 0,
      minimum_applied: calculation.minimumApplied,
      total: calculation.total
    });

    // Move to next period
    if (interval === 'monthly') {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else {
      currentDate.setFullYear(currentDate.getFullYear() + 1);
    }
    
    isFirstPeriod = false;
  }

  return results;
}

/**
 * Validate slab ranges for continuity and no overlaps
 */
export function validateSlabs(slabs: PricingSlab[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (slabs.length === 0) {
    return { valid: true, errors: [] };
  }

  // Sort by from_units
  const sortedSlabs = [...slabs].sort((a, b) => a.from_units - b.from_units);

  // Check first slab starts at 0
  if (sortedSlabs[0].from_units !== 0) {
    errors.push('First slab must start at 0 units');
  }

  // Check for gaps and overlaps
  for (let i = 0; i < sortedSlabs.length - 1; i++) {
    const current = sortedSlabs[i];
    const next = sortedSlabs[i + 1];
    
    const currentEnd = current.to_units || Infinity;
    
    if (currentEnd !== next.from_units) {
      if (currentEnd < next.from_units) {
        errors.push(`Gap between slabs: ${currentEnd} to ${next.from_units}`);
      } else {
        errors.push(`Overlap between slabs: ${next.from_units} to ${currentEnd}`);
      }
    }
  }

  // Check for negative rates
  for (const slab of slabs) {
    if (slab.rate_per_unit < 0) {
      errors.push('Rate per unit cannot be negative');
    }
  }

  return { valid: errors.length === 0, errors };
}
