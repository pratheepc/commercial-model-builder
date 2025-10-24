# Pricing-Model Tool — Updated Functional Specification (v4)
### Change: Support for Multiple Unit Types within a Model

---

## 1. Summary of Change
The system now supports **multiple unit types** within a pricing model.  
Each module under a model can reference a **specific unit type**, allowing for different units such as “Chargers”, “Stations”, or “Technicians”.  
This replaces the previous single-unit structure and ensures projections scale independently per unit type.

---

## 2. Design Objective
Enable each module to either:
- Use a **shared model-level unit type**, or
- Define its own **distinct unit type** (e.g., Chargers vs. Stations).

This makes pricing flexible for complex deployments while keeping configuration intuitive and projections accurate.

---

## 3. Data Model Updates

### 3.1 New Table — `ModelUnitType`
Stores all unit types associated with a model.

| Field | Type | Description |
|--------|------|-------------|
| `id` | int | Primary key |
| `model_id` | fk | References Model |
| `name` | varchar | Name of the unit type (e.g., Chargers) |
| `starting_units` | int | Initial count of units |
| `growth_type` | enum('fixed','percentage') | Growth model for projections |
| `growth_value` | decimal | Growth rate or fixed increment |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

### 3.2 Updated Table — `ModelModule`
Adds a reference to the unit type.

| Field | Type | Description |
|--------|------|-------------|
| `unit_type_id` | fk | References `ModelUnitType.id` |
| `pricing_type` | enum('flat','per_unit','slab') | Fee type |
| `monthly_fee` | decimal | |
| `annual_fee` | decimal | |
| `one_time_fee` | decimal | |
| `module_minimum_fee` | decimal | Optional |
| `module_implementation_fee` | decimal | Optional |

---

## 4. Updated User Flow (Option B — Unit Type Manager)

### 4.1 Step 1: Define Unit Types
New **Unit Types Tab** in each model.

| Field | Description |
|--------|-------------|
| Unit Type Name | Identifier (e.g., Chargers, Stations) |
| Starting Units | Initial count for projection |
| Growth Type | Fixed or Percentage |
| Growth Value | Growth rate or increment |

- User adds one or more unit types under a model.
- Validation: At least one unit type must exist before adding modules.

### 4.2 Step 2: Assign Unit Type to Modules
In **Modules Tab**, add a new dropdown field:
> **Unit Type** — Select from the list of unit types defined in the model.

Each module’s per-unit or slab-based pricing will now apply relative to its assigned unit type.

### 4.3 Step 3: Projection Generation
In **Projection Tab**, the engine groups modules by their `unit_type_id`.

**Computation Steps:**
1. For each unit type:
   - Generate unit count progression using its growth rule.
2. For each module linked to that unit type:
   - Compute fees (flat, per-unit, slab).
   - Apply module minimum fee.
3. Aggregate across unit types.
4. Apply model-level minimum fee to total.

### 4.4 Projection Output
Grouped by unit type for clarity.

| Period | Unit Type | Units | Module | Fee | Minimum Applied | Total |
|---------|------------|--------|---------|------|-----------------|--------|
| Month 1 | Chargers | 100 | Analytics | ₹50,000 | No | ₹50,000 |
| Month 1 | Stations | 10 | Maintenance | ₹30,000 | No | ₹30,000 |
| **Total** |  |  |  |  |  | ₹80,000 |

---

## 5. UI/UX Adjustments (shadcn/ui)

### 5.1 Model Tabs
Tabs now include:  
**Details | Unit Types | Modules | Projection**

### 5.2 Unit Types Tab
Components:  
- `Table` with Name, Starting Units, Growth Type, Growth Value.  
- `Button`: “+ Add Unit Type”  
- `Dialog`: Create/Edit form (name, starting units, growth parameters).

### 5.3 Modules Tab
Add `Unit Type` dropdown per module row.

### 5.4 Projection Tab
- Group table by Unit Type (collapsible sections).  
- Show total per group and grand total at bottom.  
- Optional “Show by Unit Type” filter.

### 5.5 Validation
- Each model must have at least one unit type.  
- Every module must reference exactly one unit type.  
- Growth values > 0.  
- Non-overlapping slabs remain enforced.

---

## 6. Projection Engine Logic (Revised)

```python
for unit_type in model.unit_types:
    units_series = project_units(unit_type.starting_units,
                                 unit_type.growth_type,
                                 unit_type.growth_value,
                                 periods)

    for module in model.modules.filter(unit_type_id=unit_type.id):
        for period, units in units_series.items():
            module_fee = calc_module_fee(units, module)
            totals[period] += module_fee

# Apply model minimum fee per period
for period in totals:
    totals[period] = max(totals[period], model.minimum_fee)
```

---

## 7. Export & Reporting Changes
- CSV exports now include “Unit Type” column.  
- Summary section shows per-unit-type totals and growth rates.

---

## 8. Acceptance Criteria

| ID | Criteria |
|----|-----------|
| AC1 | User can add multiple unit types under a model. |
| AC2 | Each module must link to exactly one unit type. |
| AC3 | Projection correctly handles multiple unit-type growth curves. |
| AC4 | Fees aggregate correctly by period and unit type. |
| AC5 | UI grouped by unit type with totals visible. |
| AC6 | Export includes unit type data. |
| AC7 | Validation prevents missing or duplicate unit types. |
| AC8 | Performance unaffected for up to 5 unit types per model. |

---

## 9. Developer Impact Summary

| Component | Change |
|------------|--------|
| DB Schema | Add `ModelUnitType` table + FK in `ModelModule`. |
| API | Update CRUD endpoints for unit types and modules. |
| Projection Engine | Iterate per unit type. |
| UI | Add Unit Types tab and selector in module form. |
| Export | Include unit type column. |
| Validation | Enforce link between modules and unit types. |

---

## 10. Migration Plan
1. Create `ModelUnitType` table.  
2. Add `unit_type_id` column to `ModelModule`.  
3. Migrate existing models: create one default unit type per model using existing unit count.  
4. Update backend logic and API endpoints.  
5. Update frontend UI per new flow.  
6. Test projections across mixed unit types.  

---

## 11. Example Configuration

### Unit Types
| Name | Starting Units | Growth | Type |
|------|----------------|---------|------|
| Chargers | 100 | +10%/yr | percentage |
| Stations | 10 | +1/yr | fixed |

### Modules
| Module | Unit Type | Pricing | Rate |
|---------|------------|----------|------|
| Analytics | Chargers | ₹500/unit | Per-unit |
| Support | Stations | ₹5,000/unit | Flat |

Projection (Month 1): ₹50,000 + ₹50,000 = ₹100,000.

---

**End of Updated Specification (v4)**
