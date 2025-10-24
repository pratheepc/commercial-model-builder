import React, { useState, useEffect, useMemo } from 'react';
import { Model, ModelModule, ModelUnitType, PricingType } from '@/types';
import { generateProjection, calculateModuleFee } from '@/lib/calculations';
import { apiDataService } from '@/lib/apiDataService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Trash2, TrendingUp, Package, Settings, Settings2, ChevronDown, ChevronRight, Edit } from 'lucide-react';
import { formatCurrency, formatNumber, getCurrencySymbol } from '@/lib/utils';
import { SUPPORTED_CURRENCIES } from '@/types';

interface DynamicModelPlaygroundProps {
    model: Model;
    onBack?: () => void;
}

interface EditableProjectionRow {
    period: number;
    date: string;
    units: number;
    total_fee: number;
    breakdown: {
        module_fees: Array<{ module_name: string; fee: number }>;
        minimum_fee: number;
        implementation_fee: number;
    };
    isEditable?: boolean;
}

export function DynamicModelPlayground({ model, onBack }: DynamicModelPlaygroundProps) {
    const [currentModel, setCurrentModel] = useState<Model>(model);
    const [projectionResults, setProjectionResults] = useState<EditableProjectionRow[]>([]);
    const [editingCell, setEditingCell] = useState<{ row: number; field: string } | null>(null);
    const [tempValue, setTempValue] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [projectionConfig, setProjectionConfig] = useState({
        periods: 12,
        interval: 'monthly' as 'monthly' | 'yearly',
        startDate: new Date().toISOString().split('T')[0]
    });
    const [isProjectionSettingsOpen, setIsProjectionSettingsOpen] = useState(false);
    const [isUnitTypesOpen, setIsUnitTypesOpen] = useState(false);
    const [moduleCatalogue, setModuleCatalogue] = useState<any[]>([]);
    const [isModelConfigOpen, setIsModelConfigOpen] = useState(true);
    const [isModulesOpen, setIsModulesOpen] = useState(true);
    const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
    const [editedUnits, setEditedUnits] = useState<{ [key: string]: number }>({});
    const [editingUnit, setEditingUnit] = useState<{ unitTypeId: string; period: number } | null>(null);
    const [editingUnitTypeName, setEditingUnitTypeName] = useState<{ unitTypeId: string } | null>(null);
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<ModelModule | null>(null);
    const [isEditingModule, setIsEditingModule] = useState(false);

    // Auto-save function
    const saveToDatabase = async (updatedModel: Model) => {
        if (isSaving) return; // Prevent multiple simultaneous saves

        // Validate that all modules have valid unit types
        const invalidModules = updatedModel.modules.filter(module =>
            (module.pricing_type === 'per_unit' || module.pricing_type === 'slab') &&
            (!module.unit_type_id || module.unit_type_id === '' || module.unit_type_id === 'default')
        );

        if (invalidModules.length > 0) {
            console.warn('Cannot save modules without valid unit types');
            return;
        }

        setIsSaving(true);
        try {
            await apiDataService.updateModel(updatedModel.id, {
                minimum_fee: updatedModel.minimum_fee,
                implementation_fee: updatedModel.implementation_fee,
            });

            // Save unit types
            for (const unitType of updatedModel.unit_types || []) {
                if (unitType.id.startsWith('unit-type-')) {
                    // New unit type - create it
                    await apiDataService.createUnitType(updatedModel.id, {
                        name: unitType.name,
                        starting_units: unitType.starting_units,
                        growth_type: unitType.growth_type,
                        growth_value: unitType.growth_value
                    });
                } else {
                    // Existing unit type - update it
                    await apiDataService.updateUnitType(unitType.id, {
                        name: unitType.name,
                        starting_units: unitType.starting_units,
                        growth_type: unitType.growth_type,
                        growth_value: unitType.growth_value
                    });
                }
            }

            // Save modules
            for (const module of updatedModel.modules || []) {
                if (module.id.startsWith('module-')) {
                    // New module - create it
                    await apiDataService.addModuleToModel(updatedModel.id, {
                        module_name: module.module_name,
                        pricing_type: module.pricing_type,
                        monthly_fee: module.monthly_fee,
                        one_time_fee: module.one_time_fee,
                        module_minimum_fee: module.module_minimum_fee,
                        unit_type_id: module.unit_type_id,
                        slabs: module.slabs
                    });
                } else {
                    // Existing module - update it
                    await apiDataService.updateModuleInModel(currentModel.id, module.id, {
                        module_name: module.module_name,
                        pricing_type: module.pricing_type,
                        monthly_fee: module.monthly_fee,
                        one_time_fee: module.one_time_fee,
                        module_minimum_fee: module.module_minimum_fee,
                        unit_type_id: module.unit_type_id,
                        slabs: module.slabs
                    });
                }
            }
        } catch (error) {
            console.error('Error saving to database:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Load module catalogue
    useEffect(() => {
        const loadModuleCatalogue = async () => {
            try {
                // This would fetch from the actual module catalogue API
                // For now, using mock data
                setModuleCatalogue([
                    { id: '1', name: 'Basic Support', product_id: '' },
                    { id: '2', name: 'Premium Analytics', product_id: '' },
                    { id: '3', name: 'API Access', product_id: '' },
                    { id: '4', name: 'Custom Integration', product_id: '' },
                    { id: '5', name: 'Advanced Reporting', product_id: '' }
                ]);
            } catch (error) {
                console.error('Error loading module catalogue:', error);
            }
        };
        loadModuleCatalogue();
    }, []);

    // Generate initial projection
    useEffect(() => {
        generateInitialProjection();
    }, [currentModel]);

    // Ensure at least one unit type exists
    useEffect(() => {
        if (!currentModel.unit_types || currentModel.unit_types.length === 0) {
            const defaultUnitType: ModelUnitType = {
                id: `unit-type-${Date.now()}`,
                model_id: currentModel.id,
                name: 'Default Units',
                starting_units: 100,
                growth_type: 'percentage',
                growth_value: 10,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            setCurrentModel(prev => ({
                ...prev,
                unit_types: [defaultUnitType]
            }));
        }
    }, [currentModel.id]);

    const generateInitialProjection = async () => {
        if (!currentModel.unit_types || currentModel.unit_types.length === 0) {
            setProjectionResults([]);
            return;
        }

        try {
            const results = generateProjection(
                currentModel,
                projectionConfig.startDate,
                projectionConfig.periods,
                projectionConfig.interval
            );

            const editableResults: EditableProjectionRow[] = results.map((result, index) => {
                const startDate = new Date(projectionConfig.startDate);
                const currentDate = new Date(startDate);

                if (projectionConfig.interval === 'monthly') {
                    currentDate.setMonth(startDate.getMonth() + index);
                } else {
                    currentDate.setFullYear(startDate.getFullYear() + index);
                }

                // Month 0 always has 0 units
                const units = index === 0 ? 0 : result.units;

                // Calculate module fees for this period
                const moduleFees: Array<{ module_name: string; fee: number }> = [];
                let totalModuleFees = 0;

                for (const module of currentModel.modules) {
                    // Get the unit type for this module and calculate units
                    const moduleUnitType = currentModel.unit_types?.find(ut => ut.id === module.unit_type_id);
                    const moduleUnits = moduleUnitType ? calculateUnitTypeUnits(moduleUnitType, index, projectionConfig.startDate, projectionConfig.interval) : 0;

                    const moduleFee = calculateModuleFee(moduleUnits, module);
                    totalModuleFees += moduleFee;
                    moduleFees.push({
                        module_name: module.module_name,
                        fee: moduleFee
                    });
                }

                // Apply minimum fee
                const finalFee = Math.max(totalModuleFees, currentModel.minimum_fee);

                // Implementation fee applies to both month 0 and month 1
                const hasImplementationFee = index === 0 || index === 1;

                return {
                    period: index + 1,
                    date: currentDate.toISOString(),
                    units: units,
                    total_fee: finalFee + (hasImplementationFee ? currentModel.implementation_fee : 0),
                    breakdown: {
                        module_fees: moduleFees,
                        minimum_fee: currentModel.minimum_fee,
                        implementation_fee: hasImplementationFee ? currentModel.implementation_fee : 0
                    },
                    isEditable: index > 0, // First period is not editable (starting units)
                };
            });

            setProjectionResults(editableResults);
        } catch (error) {
            console.error('Error generating projection:', error);
            setProjectionResults([]);
        }
    };

    const handleUnitChange = (rowIndex: number, newUnits: number, unitTypeId?: string) => {
        if (rowIndex === 0) return; // Don't allow editing first period

        // Store the edited unit value
        if (unitTypeId) {
            const key = `${unitTypeId}-${rowIndex}`;
            setEditedUnits(prev => ({ ...prev, [key]: newUnits }));
        }

        // Recalculate projections from this point forward
        recalculateProjectionsFromPeriod(rowIndex, newUnits, unitTypeId);
    };

    const recalculateProjectionsFromPeriod = (fromPeriod: number, newUnits: number | undefined, unitTypeId?: string) => {
        if (!unitTypeId) return;

        // Update the projection results from the edited period onwards
        setProjectionResults(prev => {
            return prev.map((result, index) => {
                if (index < fromPeriod) return result; // Keep previous periods unchanged

                // For the edited period, use the new units if provided
                if (index === fromPeriod && newUnits !== undefined) {
                    // Recalculate fees for this period with the new units
                    const recalculatedFees = calculateTotalFeeForPeriod(currentModel, index, unitTypeId, newUnits);
                    return {
                        ...result,
                        total_fee: recalculatedFees.total,
                        breakdown: recalculatedFees.breakdown
                    };
                }

                // For future periods, calculate units based on growth from the edited period
                if (index > fromPeriod && newUnits !== undefined) {
                    // Get the unit type to calculate growth
                    const unitType = currentModel.unit_types?.find(ut => ut.id === unitTypeId);
                    if (unitType) {
                        // Calculate growth factor from the edited period to this period
                        const periodsFromEdit = index - fromPeriod;
                        const growthFactor = calculateGrowthFactor(unitType, periodsFromEdit);
                        const calculatedUnits = Math.round(newUnits * growthFactor);

                        // Update edited units for this period
                        const key = `${unitTypeId}-${index}`;
                        setEditedUnits(prev => ({ ...prev, [key]: calculatedUnits }));

                        // Recalculate fees with the new units
                        const recalculatedFees = calculateTotalFeeForPeriod(currentModel, index, unitTypeId, calculatedUnits);
                        return {
                            ...result,
                            total_fee: recalculatedFees.total,
                            breakdown: recalculatedFees.breakdown
                        };
                    }
                }

                // For other cases, use original calculation
                const recalculatedFees = calculateTotalFeeForPeriod(currentModel, index, unitTypeId);
                return {
                    ...result,
                    total_fee: recalculatedFees.total,
                    breakdown: recalculatedFees.breakdown
                };
            });
        });
    };

    const calculateGrowthFactor = (unitType: ModelUnitType, periods: number): number => {
        if (unitType.growth_type === 'fixed') {
            return 1 + (unitType.growth_value * periods) / unitType.starting_units;
        } else {
            return Math.pow(1 + unitType.growth_value / 100, periods);
        }
    };

    const calculateUnitTypeUnits = (unitType: ModelUnitType, periodIndex: number, startDate: string, interval: string): number => {
        if (periodIndex === 0) return 0; // Month 0 always has 0 units

        const growthFactor = calculateGrowthFactor(unitType, periodIndex);
        return Math.round(unitType.starting_units * growthFactor);
    };

    const calculateTotalFeeForPeriod = (model: Model, periodIndex: number, editedUnitTypeId?: string, editedUnits?: number) => {
        let totalFee = 0;
        const moduleFees: Array<{ module_name: string; fee: number }> = [];

        // Calculate module fees using the correct unit type for each module
        for (const module of model.modules) {
            // Get the unit type for this module and calculate units
            const moduleUnitType = model.unit_types?.find(ut => ut.id === module.unit_type_id);
            let moduleUnits = 0;

            // Use edited units if this is the edited unit type and period
            if (editedUnitTypeId && module.unit_type_id === editedUnitTypeId && editedUnits !== undefined) {
                moduleUnits = editedUnits;
            } else if (moduleUnitType) {
                moduleUnits = calculateUnitTypeUnits(moduleUnitType, periodIndex, projectionConfig.startDate, projectionConfig.interval);
            }

            const moduleFee = calculateModuleFee(moduleUnits, module);
            totalFee += moduleFee;
            moduleFees.push({
                module_name: module.module_name,
                fee: moduleFee
            });
        }

        // Add minimum fee
        const minimumFee = model.minimum_fee;
        totalFee = Math.max(totalFee, minimumFee);

        // Implementation fee applies to both month 0 and month 1
        const hasImplementationFee = periodIndex === 0 || periodIndex === 1;
        const implementationFee = hasImplementationFee ? model.implementation_fee : 0;

        return {
            total: totalFee + implementationFee,
            breakdown: {
                module_fees: moduleFees,
                minimum_fee: minimumFee,
                implementation_fee: implementationFee
            }
        };
    };

    const handleCellEdit = (rowIndex: number, field: string, currentValue: number) => {
        setEditingCell({ row: rowIndex, field });
        setTempValue(currentValue.toString());
    };

    const handleUnitEdit = (unitTypeId: string, period: number, currentValue: number) => {
        setEditingUnit({ unitTypeId, period });
        setTempValue(currentValue.toString());
    };

    const handleUnitSave = () => {
        if (!editingUnit) return;

        const { unitTypeId, period } = editingUnit;
        const newValue = parseFloat(tempValue);

        if (!isNaN(newValue)) {
            handleUnitChange(period, newValue, unitTypeId);
        }

        setEditingUnit(null);
        setTempValue('');
    };

    const handleUnitCancel = () => {
        setEditingUnit(null);
        setTempValue('');
    };

    const handleRemoveEdit = (unitTypeId: string, period: number) => {
        const key = `${unitTypeId}-${period}`;
        setEditedUnits(prev => {
            const newEditedUnits = { ...prev };
            delete newEditedUnits[key];
            return newEditedUnits;
        });

        // Recalculate projections from this period onwards with original values
        recalculateProjectionsFromPeriod(period, undefined, unitTypeId);
    };

    const handleResetAllEdits = () => {
        setEditedUnits({});
        // Regenerate the entire projection with original values
        generateInitialProjection();
    };

    const handleUnitTypeNameEdit = (unitTypeId: string, currentName: string) => {
        setEditingUnitTypeName({ unitTypeId });
        setTempValue(currentName);
    };

    const handleUnitTypeNameSave = async () => {
        if (!editingUnitTypeName) return;

        const { unitTypeId } = editingUnitTypeName;
        const newName = tempValue.trim();

        if (newName && newName !== '') {
            // Update the unit type name in the model
            const updatedModel = {
                ...currentModel,
                unit_types: currentModel.unit_types?.map(ut =>
                    ut.id === unitTypeId ? { ...ut, name: newName } : ut
                ) || []
            };
            setCurrentModel(updatedModel);

            // Save to database
            try {
                await apiDataService.updateUnitType(unitTypeId, { name: newName });
            } catch (error) {
                console.error('Error updating unit type name:', error);
            }
        }

        setEditingUnitTypeName(null);
        setTempValue('');
    };

    const handleUnitTypeNameCancel = () => {
        setEditingUnitTypeName(null);
        setTempValue('');
    };

    const handleAddModule = () => {
        // Create a new module object for the modal
        const newModule: ModelModule = {
            id: `module-${Date.now()}`,
            model_id: currentModel.id,
            module_name: '',
            pricing_type: 'flat',
            monthly_fee: 0,
            one_time_fee: 0,
            module_minimum_fee: 0,
            unit_type_id: currentModel.unit_types?.[0]?.id || '',
            slabs: [],
            order: currentModel.modules.length
        };
        setEditingModule(newModule);
        setIsEditingModule(false);
        setIsModuleModalOpen(true);
    };

    const handleEditModule = (module: ModelModule) => {
        setEditingModule(module);
        setIsEditingModule(true);
        setIsModuleModalOpen(true);
    };

    const handleModuleModalClose = () => {
        setIsModuleModalOpen(false);
        setEditingModule(null);
        setIsEditingModule(false);
    };

    const handleCellSave = () => {
        if (!editingCell) return;

        const { row, field } = editingCell;
        const newValue = parseFloat(tempValue);

        if (field.startsWith('units-')) {
            const unitTypeId = field.replace('units-', '');
            handleUnitChange(row, newValue, unitTypeId);
        }

        setEditingCell(null);
        setTempValue('');
    };

    const handleCellCancel = () => {
        setEditingCell(null);
        setTempValue('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleCellSave();
        } else if (e.key === 'Escape') {
            handleCellCancel();
        }
    };

    const totalRevenue = useMemo(() => {
        return projectionResults.reduce((sum, result) => sum + result.total_fee, 0);
    }, [projectionResults]);

    const averageMonthlyRevenue = useMemo(() => {
        return projectionResults.length > 0 ? totalRevenue / projectionResults.length : 0;
    }, [totalRevenue, projectionResults.length]);

    return (
        <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
            {/* Breadcrumb */}
            <div className="py-2 text-sm text-muted-foreground border-b">
                <div className="flex items-center gap-2">
                    {onBack ? (
                        <button
                            onClick={onBack}
                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                            Models
                        </button>
                    ) : (
                        <span>Models</span>
                    )}
                    <span>/</span>
                    <span className="text-foreground font-medium">{currentModel.name}</span>
                </div>
            </div>

            {/* Header */}
            <div className="py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">
                                {currentModel.name}
                            </h1>
                            <p className="text-muted-foreground">{currentModel.description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
                            className="flex items-center gap-2"
                        >
                            {isLeftPanelOpen ? (
                                <ChevronRight className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>
                        <Dialog open={isUnitTypesOpen} onOpenChange={setIsUnitTypesOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Unit Types ({currentModel.unit_types?.length || 0})
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                    <DialogTitle>Unit Types Configuration</DialogTitle>
                                    <DialogDescription>
                                        Configure the unit types and their growth parameters for your pricing model.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4 max-h-[500px] overflow-y-auto">
                                    {currentModel.unit_types?.map((unitType, index) => (
                                        <div key={unitType.id} className="space-y-3 p-4 border rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm font-medium">Unit Type {index + 1}</Label>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        const updatedUnitTypes = currentModel.unit_types?.filter((_, i) => i !== index) || [];
                                                        setCurrentModel(prev => ({ ...prev, unit_types: updatedUnitTypes }));
                                                        saveToDatabase({ ...currentModel, unit_types: updatedUnitTypes });
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label htmlFor={`unit-name-${index}`}>Name</Label>
                                                    <Input
                                                        id={`unit-name-${index}`}
                                                        value={unitType.name}
                                                        onChange={(e) => {
                                                            const updatedUnitTypes = [...(currentModel.unit_types || [])];
                                                            updatedUnitTypes[index] = { ...unitType, name: e.target.value };
                                                            setCurrentModel(prev => ({ ...prev, unit_types: updatedUnitTypes }));
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor={`starting-units-${index}`}>Starting Units</Label>
                                                    <NumberInput
                                                        id={`starting-units-${index}`}
                                                        value={unitType.starting_units}
                                                        currency={currentModel.currency}
                                                        onChange={(value) => {
                                                            const updatedUnitTypes = [...(currentModel.unit_types || [])];
                                                            updatedUnitTypes[index] = { ...unitType, starting_units: value };
                                                            setCurrentModel(prev => ({ ...prev, unit_types: updatedUnitTypes }));
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label htmlFor={`growth-type-${index}`}>Growth Type</Label>
                                                    <Select
                                                        value={unitType.growth_type}
                                                        onValueChange={(value: 'percentage' | 'fixed') => {
                                                            const updatedUnitTypes = [...(currentModel.unit_types || [])];
                                                            updatedUnitTypes[index] = { ...unitType, growth_type: value };
                                                            setCurrentModel(prev => ({ ...prev, unit_types: updatedUnitTypes }));
                                                        }}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="percentage">Percentage</SelectItem>
                                                            <SelectItem value="fixed">Fixed Units</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor={`growth-value-${index}`}>Growth Value</Label>
                                                    <NumberInput
                                                        id={`growth-value-${index}`}
                                                        value={unitType.growth_value}
                                                        currency={currentModel.currency}
                                                        onChange={(value) => {
                                                            const updatedUnitTypes = [...(currentModel.unit_types || [])];
                                                            updatedUnitTypes[index] = { ...unitType, growth_value: value };
                                                            setCurrentModel(prev => ({ ...prev, unit_types: updatedUnitTypes }));
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <Button
                                        variant="outline"
                                        className="w-full flex items-center gap-2"
                                        onClick={() => {
                                            const newUnitType: ModelUnitType = {
                                                id: `unit-type-${Date.now()}`,
                                                model_id: currentModel.id,
                                                name: 'New Unit Type',
                                                starting_units: 100,
                                                growth_type: 'percentage',
                                                growth_value: 10,
                                                created_at: new Date().toISOString(),
                                                updated_at: new Date().toISOString()
                                            };
                                            setCurrentModel(prev => ({
                                                ...prev,
                                                unit_types: [...(prev.unit_types || []), newUnitType]
                                            }));
                                        }}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Unit Type
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {isSaving && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                                Saving...
                            </div>
                        )}
                        <Badge variant={currentModel.status === 'active' ? 'default' : 'secondary'}>
                            {currentModel.status}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden max-h-[calc(100vh-120px)]">
                <div className={`h-full grid grid-cols-1 gap-6 transition-all duration-300 ${isLeftPanelOpen ? 'lg:grid-cols-4' : 'lg:grid-cols-1'}`}>
                    {/* Left Panel - Projection Table */}
                    <div className={`${isLeftPanelOpen ? 'lg:col-span-3' : 'lg:col-span-1'}`}>
                        <Card className="max-h-[calc(100vh-200px)] flex flex-col">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>
                                            Projections
                                        </CardTitle>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {Object.keys(editedUnits).length > 0 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleResetAllEdits}
                                                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <span className="text-xs">↶</span>
                                                Reset All Edits
                                            </Button>
                                        )}
                                        <Dialog open={isProjectionSettingsOpen} onOpenChange={setIsProjectionSettingsOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" className="flex items-center gap-2">
                                                    <Settings2 className="h-4 w-4" />
                                                    Projection Settings
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle>Projection Settings</DialogTitle>
                                                    <DialogDescription>
                                                        Configure the time period and parameters for your revenue projections.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label htmlFor="modal-start-date">Start Date</Label>
                                                            <Input
                                                                id="modal-start-date"
                                                                type="date"
                                                                value={projectionConfig.startDate}
                                                                onChange={(e) => {
                                                                    const newConfig = { ...projectionConfig, startDate: e.target.value };
                                                                    setProjectionConfig(newConfig);
                                                                    generateInitialProjection();
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="modal-periods">Number of Periods</Label>
                                                            <NumberInput
                                                                id="modal-periods"
                                                                value={projectionConfig.periods}
                                                                currency={currentModel.currency}
                                                                onChange={(value) => {
                                                                    const newConfig = { ...projectionConfig, periods: value };
                                                                    setProjectionConfig(newConfig);
                                                                    generateInitialProjection();
                                                                }}
                                                                min={1}
                                                                max={60}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="modal-interval">Time Interval</Label>
                                                        <Select
                                                            value={projectionConfig.interval}
                                                            onValueChange={(value: 'monthly' | 'yearly') => {
                                                                const newConfig = { ...projectionConfig, interval: value };
                                                                setProjectionConfig(newConfig);
                                                                generateInitialProjection();
                                                            }}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="monthly">Monthly</SelectItem>
                                                                <SelectItem value="yearly">Yearly</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                        <div className="flex items-center gap-4 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Total Revenue:</span>
                                                <span className="font-semibold ml-1">{formatCurrency(totalRevenue, currentModel.currency)}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Avg {projectionConfig.interval === 'monthly' ? 'Monthly' : 'Yearly'}:</span>
                                                <span className="font-semibold ml-1">{formatCurrency(averageMonthlyRevenue, currentModel.currency)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 flex flex-col max-h-[calc(100vh-300px)]">
                                {projectionResults.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <h3 className="text-lg font-semibold mb-2">No Projections Available</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Add unit types and modules to see automatic revenue projections.
                                        </p>
                                    </div>
                                ) : !currentModel.modules.some(module => {
                                    return (module.pricing_type === 'flat' && module.monthly_fee && module.monthly_fee > 0) ||
                                        (module.pricing_type === 'per_unit' && module.monthly_fee && module.monthly_fee > 0) ||
                                        (module.pricing_type === 'slab' && module.slabs && module.slabs.length > 0) ||
                                        (module.module_minimum_fee && module.module_minimum_fee > 0) ||
                                        (module.one_time_fee && module.one_time_fee > 0);
                                }) && !(currentModel.minimum_fee > 0 || currentModel.implementation_fee > 0) ? (
                                    <div className="p-8 text-center">
                                        <h3 className="text-lg font-semibold mb-2">No Fees Configured</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Configure platform fees or module fees to see revenue projections.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex-1 overflow-auto max-h-[calc(100vh-350px)]">
                                        <div className="min-w-full">
                                            <Table className="h-full">
                                                <TableHeader className="sticky top-0 bg-white z-30">
                                                    <TableRow>
                                                        <TableHead className="sticky left-0 bg-white z-30 min-w-[180px]">Module</TableHead>
                                                        {projectionResults.map((result, index) => (
                                                            <TableHead key={index} className="text-left min-w-[100px]">
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-sm">
                                                                        {projectionConfig.interval === 'monthly'
                                                                            ? new Date(result.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                                                            : new Date(result.date).getFullYear().toString()
                                                                        }
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        P{result.period}
                                                                    </span>
                                                                </div>
                                                            </TableHead>
                                                        ))}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody className="h-full">
                                                    {/* Unit Types - Separate rows for each unit type */}
                                                    {currentModel.unit_types?.map((unitType) => (
                                                        <TableRow key={unitType.id}>
                                                            <TableCell className="sticky left-0 bg-white z-10 font-medium text-left">
                                                                {editingUnitTypeName?.unitTypeId === unitType.id ? (
                                                                    <Input
                                                                        value={tempValue}
                                                                        onChange={(e) => setTempValue(e.target.value)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                handleUnitTypeNameSave();
                                                                            } else if (e.key === 'Escape') {
                                                                                handleUnitTypeNameCancel();
                                                                            }
                                                                        }}
                                                                        onBlur={handleUnitTypeNameSave}
                                                                        autoFocus
                                                                        className="w-full text-sm font-medium"
                                                                    />
                                                                ) : (
                                                                    <div
                                                                        className="cursor-pointer hover:bg-muted p-1 rounded text-sm"
                                                                        onClick={() => handleUnitTypeNameEdit(unitType.id, unitType.name)}
                                                                        title="Click to edit unit type name"
                                                                    >
                                                                        {unitType.name}
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                            {projectionResults.map((result, index) => {
                                                                // Check if this unit value has been edited
                                                                const editedKey = `${unitType.id}-${index}`;
                                                                const isEdited = editedUnits[editedKey] !== undefined;
                                                                const displayUnits = isEdited ? editedUnits[editedKey] : calculateUnitTypeUnits(
                                                                    unitType,
                                                                    index,
                                                                    projectionConfig.startDate,
                                                                    projectionConfig.interval
                                                                );

                                                                return (
                                                                    <TableCell key={index} className="text-right">
                                                                        {editingUnit?.unitTypeId === unitType.id && editingUnit?.period === index ? (
                                                                            <Input
                                                                                value={tempValue}
                                                                                onChange={(e) => setTempValue(e.target.value)}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Enter') {
                                                                                        handleUnitSave();
                                                                                    } else if (e.key === 'Escape') {
                                                                                        handleUnitCancel();
                                                                                    }
                                                                                }}
                                                                                onBlur={handleUnitSave}
                                                                                autoFocus
                                                                                className="w-20 text-right text-sm"
                                                                            />
                                                                        ) : (
                                                                            <div className="flex justify-end">
                                                                                <div
                                                                                    className={`cursor-pointer hover:bg-muted p-1 rounded text-sm ${index > 0 ? 'hover:border' : ''} ${isEdited ? 'bg-blue-50 border border-blue-200 font-semibold text-blue-700' : ''
                                                                                        }`}
                                                                                    onClick={() => index > 0 && handleUnitEdit(unitType.id, index, displayUnits)}
                                                                                    title={isEdited ? 'Edited value' : 'Click to edit'}
                                                                                >
                                                                                    <div className="flex items-center">
                                                                                        {isEdited && index > 0 && (
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    handleRemoveEdit(unitType.id, index);
                                                                                                }}
                                                                                                className="text-red-500 hover:text-red-700 text-xs mr-2 p-1 rounded hover:bg-red-50"
                                                                                                title="Remove edit"
                                                                                            >
                                                                                                ✕
                                                                                            </button>
                                                                                        )}
                                                                                        <span>{formatNumber(displayUnits, currentModel.currency)}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </TableCell>
                                                                );
                                                            })}
                                                        </TableRow>
                                                    ))}

                                                    {/* Platform Fee Row */}
                                                    <TableRow>
                                                        <TableCell className="sticky left-0 bg-white z-10 font-medium text-sm text-left">
                                                            Platform Fee
                                                        </TableCell>
                                                        {projectionResults.map((result, index) => (
                                                            <TableCell key={index} className="text-right">
                                                                <div className="text-sm">
                                                                    {formatCurrency(result.breakdown.minimum_fee, currentModel.currency)}
                                                                </div>
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>

                                                    {/* Implementation Fee Row */}
                                                    <TableRow>
                                                        <TableCell className="sticky left-0 bg-white z-10 font-medium text-sm text-left">
                                                            Implementation Fee
                                                        </TableCell>
                                                        {projectionResults.map((result, index) => (
                                                            <TableCell key={index} className="text-right">
                                                                <div className="text-sm">
                                                                    {formatCurrency(result.breakdown.implementation_fee, currentModel.currency)}
                                                                </div>
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>

                                                    {/* Module Groups */}
                                                    {currentModel.modules.map((module) => {
                                                        // Only show module if it has fees configured
                                                        const hasFees = (module.pricing_type === 'flat' && module.monthly_fee && module.monthly_fee > 0) ||
                                                            (module.pricing_type === 'per_unit' && module.monthly_fee && module.monthly_fee > 0) ||
                                                            (module.pricing_type === 'slab' && module.slabs && module.slabs.length > 0) ||
                                                            (module.module_minimum_fee && module.module_minimum_fee > 0) ||
                                                            (module.one_time_fee && module.one_time_fee > 0);

                                                        if (!hasFees) return null;

                                                        return (
                                                            <React.Fragment key={module.id}>
                                                                {/* Module Header */}
                                                                <TableRow className="bg-muted/30">
                                                                    <TableCell className="sticky left-0 bg-muted/30 z-10 font-bold text-primary text-sm text-left">
                                                                        {module.module_name}
                                                                    </TableCell>
                                                                    {projectionResults.map((_, index) => (
                                                                        <TableCell key={index} className="text-right font-bold text-primary text-sm">
                                                                            —
                                                                        </TableCell>
                                                                    ))}
                                                                </TableRow>

                                                                {/* Module Monthly Fee */}
                                                                {module.pricing_type === 'flat' && (module.monthly_fee || 0) > 0 && (
                                                                    <TableRow>
                                                                        <TableCell className="sticky left-0 bg-white z-10 pl-6 text-sm text-left">
                                                                            Monthly Fee
                                                                        </TableCell>
                                                                        {projectionResults.map((_, index) => (
                                                                            <TableCell key={index} className="text-right">
                                                                                <div className="text-sm">
                                                                                    {formatCurrency(module.monthly_fee || 0, currentModel.currency)}
                                                                                </div>
                                                                            </TableCell>
                                                                        ))}
                                                                    </TableRow>
                                                                )}

                                                                {/* Module Per-Unit Fee */}
                                                                {module.pricing_type === 'per_unit' && (module.monthly_fee || 0) > 0 && (
                                                                    <TableRow>
                                                                        <TableCell className="sticky left-0 bg-white z-10 pl-6 text-sm text-left">
                                                                            Rate per Unit
                                                                        </TableCell>
                                                                        {projectionResults.map((result, index) => {
                                                                            // Get the unit type for this module
                                                                            const moduleUnitType = currentModel.unit_types?.find(ut => ut.id === module.unit_type_id);
                                                                            const units = moduleUnitType ? calculateUnitTypeUnits(moduleUnitType, index, projectionConfig.startDate, projectionConfig.interval) : 0;

                                                                            return (
                                                                                <TableCell key={index} className="text-right">
                                                                                    <div className="text-sm">
                                                                                        {formatCurrency(module.monthly_fee || 0, currentModel.currency)} × {formatNumber(units, currentModel.currency)}
                                                                                    </div>
                                                                                </TableCell>
                                                                            );
                                                                        })}
                                                                    </TableRow>
                                                                )}

                                                                {/* Module Slab Fees */}
                                                                {module.pricing_type === 'slab' && module.slabs && module.slabs.length > 0 && (
                                                                    module.slabs.map((slab, slabIndex) => (
                                                                        <TableRow key={slabIndex}>
                                                                            <TableCell className="sticky left-0 bg-white z-10 pl-6 text-sm text-left">
                                                                                Slab {slabIndex + 1} ({slab.from_units}-{slab.to_units || '∞'})
                                                                            </TableCell>
                                                                            {projectionResults.map((result, index) => {
                                                                                // Get the unit type for this module
                                                                                const moduleUnitType = currentModel.unit_types?.find(ut => ut.id === module.unit_type_id);
                                                                                const units = moduleUnitType ? calculateUnitTypeUnits(moduleUnitType, index, projectionConfig.startDate, projectionConfig.interval) : 0;

                                                                                // Calculate fee for this specific slab
                                                                                const slabStart = slab.from_units;
                                                                                const slabEnd = slab.to_units || units;
                                                                                const slabRate = slab.rate_per_unit;

                                                                                let slabFee = 0;
                                                                                if (units > slabStart) {
                                                                                    const unitsInSlab = Math.min(units, slabEnd) - Math.max(slabStart, 0);
                                                                                    slabFee = unitsInSlab * slabRate;
                                                                                }

                                                                                return (
                                                                                    <TableCell key={index} className="text-right">
                                                                                        <div className="text-sm">
                                                                                            {formatCurrency(slabFee, currentModel.currency)}
                                                                                        </div>
                                                                                    </TableCell>
                                                                                );
                                                                            })}
                                                                        </TableRow>
                                                                    ))
                                                                )}

                                                                {/* Module Minimum Fee */}
                                                                {(module.module_minimum_fee || 0) > 0 && (
                                                                    <TableRow>
                                                                        <TableCell className="sticky left-0 bg-white z-10 pl-6 text-sm text-left">
                                                                            Module Min Fee
                                                                        </TableCell>
                                                                        {projectionResults.map((_, index) => (
                                                                            <TableCell key={index} className="text-right">
                                                                                <div className="text-sm">
                                                                                    {formatCurrency(module.module_minimum_fee || 0, currentModel.currency)}
                                                                                </div>
                                                                            </TableCell>
                                                                        ))}
                                                                    </TableRow>
                                                                )}

                                                                {/* Module One-time Fee */}
                                                                {(module.one_time_fee || 0) > 0 && (
                                                                    <TableRow>
                                                                        <TableCell className="sticky left-0 bg-white z-10 pl-6 text-sm text-left">
                                                                            Setup Fee
                                                                        </TableCell>
                                                                        {projectionResults.map((_, index) => (
                                                                            <TableCell key={index} className="text-right">
                                                                                <div className="text-sm">
                                                                                    {index === 0 ? formatCurrency(module.one_time_fee || 0, currentModel.currency) : '—'}
                                                                                </div>
                                                                            </TableCell>
                                                                        ))}
                                                                    </TableRow>
                                                                )}

                                                                {/* Module Total - Only show if module has fees */}
                                                                {((module.pricing_type === 'flat' && module.monthly_fee && module.monthly_fee > 0) ||
                                                                    (module.pricing_type === 'per_unit' && module.monthly_fee && module.monthly_fee > 0) ||
                                                                    (module.pricing_type === 'slab' && module.slabs && module.slabs.length > 0) ||
                                                                    (module.module_minimum_fee && module.module_minimum_fee > 0) ||
                                                                    (module.one_time_fee && module.one_time_fee > 0)) && (
                                                                        <TableRow className="border-b border-muted">
                                                                            <TableCell className="sticky left-0 bg-white z-10 font-semibold pl-4 text-sm text-left">
                                                                                {module.module_name} Total
                                                                            </TableCell>
                                                                            {projectionResults.map((result, index) => {
                                                                                const moduleFee = result.breakdown.module_fees.find(mf => mf.module_name === module.module_name);
                                                                                return (
                                                                                    <TableCell key={index} className="text-right font-semibold">
                                                                                        <div className="text-sm">
                                                                                            {moduleFee && moduleFee.fee > 0 ? formatCurrency(moduleFee.fee, currentModel.currency) : '—'}
                                                                                        </div>
                                                                                    </TableCell>
                                                                                );
                                                                            })}
                                                                        </TableRow>
                                                                    )}
                                                            </React.Fragment>
                                                        );
                                                    })}

                                                    {/* Grand Total Row - Show if there are modules with fees OR model-level fees */}
                                                    {(currentModel.modules.some(module => {
                                                        return (module.pricing_type === 'flat' && module.monthly_fee && module.monthly_fee > 0) ||
                                                            (module.pricing_type === 'per_unit' && module.monthly_fee && module.monthly_fee > 0) ||
                                                            (module.pricing_type === 'slab' && module.slabs && module.slabs.length > 0) ||
                                                            (module.module_minimum_fee && module.module_minimum_fee > 0) ||
                                                            (module.one_time_fee && module.one_time_fee > 0);
                                                    }) || currentModel.minimum_fee > 0 || currentModel.implementation_fee > 0) && (
                                                            <TableRow className="border-t-2 border-primary bg-slate-100">
                                                                <TableCell className="sticky left-0 bg-slate-100 z-20 font-bold text-sm text-left">
                                                                    Grand Total
                                                                </TableCell>
                                                                {projectionResults.map((result, index) => (
                                                                    <TableCell key={index} className="text-right font-bold bg-slate-100">
                                                                        <div className="text-sm">
                                                                            {formatCurrency(result.total_fee, currentModel.currency)}
                                                                        </div>
                                                                    </TableCell>
                                                                ))}
                                                            </TableRow>
                                                        )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Panel - Configuration */}
                    {isLeftPanelOpen && (
                        <div className="lg:col-span-1 space-y-6 h-full overflow-auto">

                            {/* Model Configuration */}
                            <Collapsible open={isModelConfigOpen} onOpenChange={setIsModelConfigOpen}>
                                <Card>
                                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                        <CollapsibleTrigger asChild>
                                            <div className="flex items-center gap-2 w-full">
                                                <Settings className="h-5 w-5" />
                                                <span className="font-semibold">Model Configuration</span>
                                                {isModelConfigOpen ? (
                                                    <ChevronDown className="h-4 w-4 ml-auto" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 ml-auto" />
                                                )}
                                            </div>
                                        </CollapsibleTrigger>
                                    </CardHeader>
                                    <CollapsibleContent>
                                        <CardContent className="space-y-4">
                                            <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">Currency:</span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {SUPPORTED_CURRENCIES.find(c => c.code === currentModel.currency)?.name || currentModel.currency}
                                                        <span className="ml-1">({getCurrencySymbol(currentModel.currency)})</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="minimum-fee">Platform Fee</Label>
                                                    <NumberInput
                                                        id="minimum-fee"
                                                        value={currentModel.minimum_fee}
                                                        currency={currentModel.currency}
                                                        onChange={(value) => {
                                                            const updatedModel = { ...currentModel, minimum_fee: value };
                                                            setCurrentModel(updatedModel);
                                                            saveToDatabase(updatedModel);
                                                        }}
                                                    // placeholder="0"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="implementation-fee">Implementation Fee</Label>
                                                    <NumberInput
                                                        id="implementation-fee"
                                                        value={currentModel.implementation_fee}
                                                        currency={currentModel.currency}
                                                        onChange={(value) => setCurrentModel(prev => ({ ...prev, implementation_fee: value }))}
                                                    // placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </CollapsibleContent>
                                </Card>
                            </Collapsible>


                            {/* Modules */}
                            <Collapsible open={isModulesOpen} onOpenChange={setIsModulesOpen}>
                                <Card>
                                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                        <CollapsibleTrigger asChild>
                                            <div className="flex items-center gap-2 w-full">
                                                <Package className="h-5 w-5" />
                                                <span className="font-semibold">Modules</span>
                                                {isModulesOpen ? (
                                                    <ChevronDown className="h-4 w-4 ml-auto" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 ml-auto" />
                                                )}
                                            </div>
                                        </CollapsibleTrigger>
                                    </CardHeader>
                                    <CollapsibleContent>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {currentModel.modules.map((module, index) => (
                                                    <Card key={module.id} className="p-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <h4 className="font-medium text-sm">{module.module_name || 'Unnamed Module'}</h4>
                                                                <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                                                    <div>Type: {module.pricing_type === 'flat' ? 'Flat Rate' : module.pricing_type === 'per_unit' ? 'Per Unit' : 'Slab Pricing'}</div>
                                                                    {module.unit_type_id && (
                                                                        <div>Unit: {currentModel.unit_types?.find(ut => ut.id === module.unit_type_id)?.name || 'Unknown'}</div>
                                                                    )}
                                                                    {(module.monthly_fee || 0) > 0 && (
                                                                        <div>Rate: {formatCurrency(module.monthly_fee || 0, currentModel.currency)} {module.pricing_type === 'flat' ? '/month' : '/unit'}</div>
                                                                    )}
                                                                    {(module.module_minimum_fee || 0) > 0 && (
                                                                        <div>Min Fee: {formatCurrency(module.module_minimum_fee || 0, currentModel.currency)}/month</div>
                                                                    )}
                                                                    {(module.one_time_fee || 0) > 0 && (
                                                                        <div>Setup: {formatCurrency(module.one_time_fee || 0, currentModel.currency)}</div>
                                                                    )}
                                                                    {module.slabs && module.slabs.length > 0 && (
                                                                        <div>Slabs: {module.slabs.length} tier(s)</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleEditModule(module)}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const updatedModules = currentModel.modules.filter((_, i) => i !== index);
                                                                        setCurrentModel(prev => ({ ...prev, modules: updatedModules }));
                                                                        saveToDatabase({ ...currentModel, modules: updatedModules });
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                ))}

                                                <Button
                                                    variant="outline"
                                                    className="w-full"
                                                    onClick={handleAddModule}
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Add Module
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </CollapsibleContent>
                                </Card>
                            </Collapsible>
                        </div>
                    )}

                </div>
            </div>

            {/* Module Modal */}
            <Dialog open={isModuleModalOpen} onOpenChange={setIsModuleModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingModule ? 'Edit Module' : 'Add Module'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Module Selection */}
                        <div>
                            <Label>Select Module</Label>
                            <Select
                                value={editingModule?.module_name?.trim() || ''}
                                onValueChange={(value) => {
                                    if (editingModule) {
                                        setEditingModule(prev => prev ? { ...prev, module_name: value.trim() } : null);
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a module" />
                                </SelectTrigger>
                                <SelectContent>
                                    {moduleCatalogue.map((catalogueModule) => (
                                        <SelectItem key={catalogueModule.id} value={catalogueModule.name.trim()}>
                                            {catalogueModule.name.trim()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Pricing Type */}
                        <div>
                            <Label>Pricing Type</Label>
                            <Select
                                value={editingModule?.pricing_type || 'flat'}
                                onValueChange={(value: PricingType) => {
                                    if (editingModule) {
                                        setEditingModule(prev => prev ? { ...prev, pricing_type: value } : null);
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="flat">Flat Rate</SelectItem>
                                    <SelectItem value="per_unit">Per Unit</SelectItem>
                                    <SelectItem value="slab">Slab Pricing</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Unit Type - Only for usage-based modules */}
                        {(editingModule?.pricing_type === 'per_unit' || editingModule?.pricing_type === 'slab') && (
                            <div>
                                <Label>Unit Type</Label>
                                <Select
                                    value={editingModule?.unit_type_id || ''}
                                    onValueChange={(value: string) => {
                                        if (editingModule) {
                                            setEditingModule(prev => prev ? { ...prev, unit_type_id: value } : null);
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Unit Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currentModel.unit_types?.map((unitType) => (
                                            <SelectItem key={unitType.id} value={unitType.id}>
                                                {unitType.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Fee Configuration based on pricing type */}
                        {editingModule?.pricing_type === 'flat' && (
                            <div>
                                <Label>Monthly Fee</Label>
                                <NumberInput
                                    value={editingModule?.monthly_fee || 0}
                                    currency={currentModel.currency}
                                    onChange={(value) => {
                                        if (editingModule) {
                                            setEditingModule(prev => prev ? { ...prev, monthly_fee: value } : null);
                                        }
                                    }}
                                    placeholder="e.g., 100"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Fixed monthly fee for this module
                                </p>
                            </div>
                        )}

                        {editingModule?.pricing_type === 'per_unit' && (
                            <div>
                                <Label>Rate per Unit</Label>
                                <NumberInput
                                    value={editingModule?.monthly_fee || 0}
                                    currency={currentModel.currency}
                                    onChange={(value) => {
                                        if (editingModule) {
                                            setEditingModule(prev => prev ? { ...prev, monthly_fee: value } : null);
                                        }
                                    }}
                                    placeholder="e.g., 2.50"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Rate charged per unit consumed
                                </p>
                            </div>
                        )}

                        {/* Optional minimum fee for usage-based modules */}
                        {(editingModule?.pricing_type === 'per_unit' || editingModule?.pricing_type === 'slab') && (
                            <div>
                                <Label>Minimum Monthly Fee (Optional)</Label>
                                <NumberInput
                                    value={editingModule?.module_minimum_fee || 0}
                                    currency={currentModel.currency}
                                    onChange={(value) => {
                                        if (editingModule) {
                                            setEditingModule(prev => prev ? { ...prev, module_minimum_fee: value } : null);
                                        }
                                    }}
                                    placeholder="e.g., 25"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Ensures minimum revenue even with low usage
                                </p>
                            </div>
                        )}

                        {/* One-time setup fee */}
                        <div>
                            <Label>One-time Setup Fee (Optional)</Label>
                            <NumberInput
                                value={editingModule?.one_time_fee || 0}
                                currency={currentModel.currency}
                                onChange={(value) => {
                                    if (editingModule) {
                                        setEditingModule(prev => prev ? { ...prev, one_time_fee: value } : null);
                                    }
                                }}
                                placeholder="e.g., 500"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Charged once during implementation
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleModuleModalClose}>
                            Cancel
                        </Button>
                        <Button onClick={async () => {
                            if (editingModule) {
                                if (!isEditingModule) {
                                    // New module - add it to the model
                                    const updatedModel = {
                                        ...currentModel,
                                        modules: [...currentModel.modules, editingModule]
                                    };
                                    setCurrentModel(prev => ({
                                        ...prev,
                                        modules: [...prev.modules, editingModule]
                                    }));
                                    await saveToDatabase(updatedModel);
                                } else {
                                    // Existing module - update it
                                    const updatedModules = currentModel.modules.map(m =>
                                        m.id === editingModule.id ? editingModule : m
                                    );
                                    const updatedModel = { ...currentModel, modules: updatedModules };
                                    setCurrentModel(prev => ({ ...prev, modules: updatedModules }));
                                    await saveToDatabase(updatedModel);
                                }
                            }
                            handleModuleModalClose();
                        }}>
                            {isEditingModule ? 'Update Module' : 'Add Module'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
