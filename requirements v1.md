# Pricing-Model Tool — Detailed Functional Specification (v3)

## 1. Overview
The Pricing-Model Tool allows internal users to define, calculate, and project product pricing structures for modular SaaS products.  
It supports **flat, per-unit, and slab-based pricing** with **minimum and implementation fees**, and can project revenue growth using **linear progression** of units over time.

---

## 2. Objectives
- Centralise and standardise pricing model configuration.  
- Handle diverse fee structures (per-unit, slab-based, flat).  
- Ensure minimum revenue thresholds per billing period.  
- Enable what-if projections based on unit growth.  
- Provide exportable, auditable, and maintainable data for finance and product teams.  

---

## 3. Core Entities

| Entity | Description |
|--------|-------------|
| **Model** | A named configuration that groups modules and defines common pricing defaults. |
| **Module** | Individual component or feature under a Model (e.g., “Analytics”, “Support”). |
| **Pricing Slab** | Defines per-unit price tiers (e.g., 0–100 units = ₹100/unit, 101–500 = ₹75/unit). |
| **Minimum Fee** | Floor amount ensuring each billing period meets a baseline charge. |
| **Implementation Fee** | One-time setup cost, applied per model or module. |
| **Projection** | Forecast of units and fees over time based on growth factors. |

---

## 4. Functional Requirements

### 4.1 Model Management
**Purpose:** Create, edit, delete, and duplicate pricing models.

**Fields**
- `name` (required, string, unique)
- `description` (optional, text)
- `starting_unit_count` (integer, ≥0)
- `minimum_fee` (decimal, ≥0)
- `implementation_fee` (decimal, ≥0)

**Capabilities**
- View all models in a paginated table.
- Search and filter by name, status.
- Duplicate an existing model with all modules and fees.
- Archive/delete models with confirmation dialog.
- All changes logged with timestamp and user.

**UI (shadcn/ui components)**
- `Table` with Name, Starting Units, Minimum Fee, Implementation Fee, Status, Actions.
- `Button` → “+ Create Model”.
- `Dialog` → confirmation for delete.
- `Tooltip` on Minimum Fee (“Guarantees baseline revenue per billing period.”).

---

### 4.2 Module Management
**Purpose:** Define pricing details for modules within a model.

**Fields**
| Field | Type | Description |
|--------|------|-------------|
| `module_name` | Select | From catalogue (predefined modules). |
| `pricing_type` | Enum | `flat`, `per_unit`, `slab`. |
| `monthly_fee` | Decimal | Required for flat/per_unit. |
| `annual_fee` | Decimal | Optional. |
| `one_time_fee` | Decimal | Optional. |
| `module_minimum_fee` | Decimal | Optional override of model minimum. |
| `module_implementation_fee` | Decimal | Optional override. |

**Behaviour**
- Users can add multiple modules.
- Reorder modules visually (no functional impact).
- Remove module from model at any time.
- Validation: numeric ≥0, required fields based on pricing type.

---

### 4.3 Slab-Based Pricing
**Definition:**  
Rate per unit changes depending on which range (“slab”) the total unit count falls into.

**Slab Fields**
| Field | Type | Example |
|--------|------|----------|
| `from_units` | int | 0 |
| `to_units` | int (nullable) | 100 |
| `rate_per_unit` | decimal | 100 |
| `fee_type` | enum('monthly','annual','one_time') | monthly |
| `parent_type` | enum('model','module') | module |
| `parent_id` | fk | module.id |

**Rules**
- Slabs must be contiguous (no gaps or overlaps).
- First slab `from_units` = 0.
- Last slab `to_units` can be null (∞).
- Rates must be ≥ 0.
- Validation on save:
  - Sorted ascending.
  - Ranges don’t overlap.
  - At least one slab per slab-based module or model.

**UI (shadcn/ui)**
- When `pricing_type = slab`, show editable table:  
  | From Units | To Units | Rate/Unit | Fee Type | [ + Add Slab ] |
- Validation messages inline (red border + helper text).
- Tooltip: “Per-unit rate applied within this range. Remaining units use next slab.”

---

### 4.4 Fee Calculation Logic
#### a. Module Level
**Flat Fee**
```
module_total = monthly_fee
```
**Per-Unit Fee**
```
module_total = monthly_fee_per_unit * unit_count
```
**Slab-Based Fee**
```
module_total = Σ( units_in_slab × rate_per_unit )
```
**Apply Module Minimum Fee**
```
if module_minimum_fee and module_total < module_minimum_fee:
    module_total = module_minimum_fee
```

#### b. Model Level
1. Sum all module totals: `total_before_minimum = Σ(module_total)`
2. Apply model-level minimum fee:  
   `if total_before_minimum < model.minimum_fee: total = model.minimum_fee else total = total_before_minimum`
3. Add one-time implementation fee (flat or per-unit).

---

### 4.5 Minimum Fee Definition
Acts as a **floor** ensuring the business collects a guaranteed minimum per billing period.

**Levels**
- Model-Level Minimum Fee: applied to total of all modules.  
- Module-Level Minimum Fee: applied before aggregation.

**Evaluation Order**
1. Calculate each module total → apply its module minimum.  
2. Sum totals → compare with model minimum → take higher.  

**Behaviour When Units Change**
- Minimum fee triggers at low unit counts and deactivates naturally at scale.

---

### 4.6 Implementation Fee
- One-time charge, flat or per-unit.
- Charged only once, in the first projection period.
- Appears separately in breakdown.

---

### 4.7 Projection Engine (Linear Progression)
Forecast revenue as unit count grows linearly.

**Inputs**
| Field | Type | Description |
|--------|------|-------------|
| `start_date` | date | Default today |
| `end_date` or `periods` | int/date | Horizon |
| `interval` | enum('monthly','yearly') | Projection step |
| `starting_units` | int | Defaults from model |
| `growth_type` | enum('percentage','fixed') | Linear type |
| `growth_value` | decimal | e.g. +10 or +10% |

**Computation**
```
for each period:
    if growth_type == "fixed": units = prev_units + growth_value
    else: units = prev_units * (1 + growth_value/100)
    total_fee = calculate_model_total(units)
    store(period, units, total_fee)
```

**Output Table**
| Period | Units | Monthly Fee | Annual Fee | One-Time Fee | Minimum Applied | Total |

---

## 5. Data Model
**Tables:** Model, ModuleCatalogue, ModelModule, PricingSlab, Projection, ProjectionResult

---

## 6. Validation Rules
- Unique model name.  
- Fees and units ≥ 0.  
- Ordered, contiguous slab ranges.  
- Growth value > 0 unless static projection.  

---

## 7. Security & Roles
| Role | Capabilities |
|------|---------------|
| Admin | Full CRUD |
| Pricing Manager | Manage models, modules, projections |
| Viewer | Read-only |

All destructive actions require confirmation dialogs.  
Audit log every CRUD and projection event.

---

## 8. Performance Targets
| Metric | Target |
|---------|--------|
| Model list load | < 2s |
| Projection (≤60 periods) | < 1s |
| Scale | 100 models × 20 modules × 10 slabs |

---

## 9. Fee Calculation Algorithm (Python Example)
```python
def calc_module_fee(units, module):
    if module.pricing_type == "flat":
        fee = module.monthly_fee
    elif module.pricing_type == "per_unit":
        fee = units * module.monthly_fee
    elif module.pricing_type == "slab":
        fee = 0
        for slab in sorted(module.slabs, key=lambda s: s.from_units):
            if units > slab.from_units:
                upper = slab.to_units or units
                units_in_slab = min(units, upper) - slab.from_units
                fee += units_in_slab * slab.rate_per_unit
    return max(fee, module.module_minimum_fee or 0)

def calc_model_total(units, model):
    total = sum(calc_module_fee(units, m) for m in model.modules)
    total = max(total, model.minimum_fee or 0)
    if model.implementation_fee:
        total += model.implementation_fee
    return total
```

---

## 10. Acceptance Criteria
- Full CRUD for models and modules.  
- Slab validation enforced.  
- Accurate fee and projection calculations.  
- Minimum fees apply correctly.  
- Role permissions enforced.  
- Exports match UI results.  
- Responsive and accessible UI.

---

## 11. Development Stack
- **Frontend:** React + shadcn/ui + TailwindCSS  
- **Backend:** Python FastAPI or Node Express  
- **DB:** PostgreSQL  
- **Auth:** JWT / RBAC  
- **Testing:** PyTest / Jest / Playwright  
- **Version Control:** Git + migrations for schema.

---

## 12. Deliverables
- Functional UI per spec.  
- REST/GraphQL APIs for all entities.  
- Export endpoints.  
- Audit logs and validations.  
- Unit + integration tests.  

---

## 13. Timeline
| Week | Deliverable |
|------|--------------|
| 1 | Schema + API scaffold |
| 2 | Model CRUD |
| 3 | Module CRUD + fee logic |
| 4 | Slab UI + validation |
| 5 | Projection engine |
| 6 | Testing + documentation |
| 7 | UAT + release |

---
