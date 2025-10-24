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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2, Calculator, TrendingUp, Package, Settings, Settings2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface DynamicModelPlaygroundProps {
    model: Model;
    onBack: () => void;
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

    // Auto-save function
    const saveToDatabase = async (updatedModel: Model) => {
        if (isSaving) return; // Prevent multiple simultaneous saves

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

    // Generate initial projection
    useEffect(() => {
        generateInitialProjection();
    }, [currentModel]);

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
                        const moduleFee = calculateModuleFee(units, module);
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

    const handleUnitChange = (rowIndex: number, newUnits: number) => {
        if (rowIndex === 0) return; // Don't allow editing first period

        const updatedResults = [...projectionResults];
        updatedResults[rowIndex].units = newUnits;

        // Recalculate fees for this period
        const recalculatedFee = calculateTotalFeeForPeriod(updatedResults[rowIndex].units, currentModel, rowIndex);
        updatedResults[rowIndex].total_fee = recalculatedFee.total;
        updatedResults[rowIndex].breakdown = recalculatedFee.breakdown;

        // Recalculate subsequent periods based on growth
        for (let i = rowIndex + 1; i < updatedResults.length; i++) {
            const growthFactor = calculateGrowthFactor(currentModel.unit_types[0], i - rowIndex);
            const newUnits = Math.round(updatedResults[rowIndex].units * growthFactor);
            updatedResults[i].units = newUnits;

            const recalculatedFee = calculateTotalFeeForPeriod(newUnits, currentModel, i);
            updatedResults[i].total_fee = recalculatedFee.total;
            updatedResults[i].breakdown = recalculatedFee.breakdown;
        }

        setProjectionResults(updatedResults);
    };

    const calculateGrowthFactor = (unitType: ModelUnitType, periods: number): number => {
        if (unitType.growth_type === 'fixed') {
            return 1 + (unitType.growth_value * periods) / unitType.starting_units;
        } else {
            return Math.pow(1 + unitType.growth_value / 100, periods);
        }
    };

    const calculateTotalFeeForPeriod = (units: number, model: Model, periodIndex: number) => {
        let totalFee = 0;
        const moduleFees: Array<{ module_name: string; fee: number }> = [];

        // Calculate module fees
        for (const module of model.modules) {
            const moduleFee = calculateModuleFee(units, module);
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

    const handleCellSave = () => {
        if (!editingCell) return;

        const { row, field } = editingCell;
        const newValue = parseFloat(tempValue);

        if (field === 'units') {
            handleUnitChange(row, newValue);
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
        <div className="h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Models
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold flex items-center gap-2">
                                    <Calculator className="h-6 w-6" />
                                    {currentModel.name} - Dynamic Playground
                                </h1>
                                <p className="text-muted-foreground">{currentModel.description}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
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
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="min-h-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                    {/* Left Panel - Configuration */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Model Configuration */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    Model Configuration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="minimum-fee">Minimum Fee</Label>
                                        <NumberInput
                                            id="minimum-fee"
                                            value={currentModel.minimum_fee}
                                            onChange={(value) => {
                                                const updatedModel = { ...currentModel, minimum_fee: value };
                                                setCurrentModel(updatedModel);
                                                saveToDatabase(updatedModel);
                                            }}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="implementation-fee">Implementation Fee</Label>
                                        <NumberInput
                                            id="implementation-fee"
                                            value={currentModel.implementation_fee}
                                            onChange={(value) => setCurrentModel(prev => ({ ...prev, implementation_fee: value }))}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>


                        {/* Modules */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Modules
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {currentModel.modules.map((module, index) => (
                                        <div key={module.id} className="p-3 border rounded-lg space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium">Module Configuration</h4>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        const updatedModules = currentModel.modules.filter((_, i) => i !== index);
                                                        setCurrentModel(prev => ({ ...prev, modules: updatedModules }));
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            {/* Module Name - First Field */}
                                            <div>
                                                <Label>Module Name</Label>
                                                <Input
                                                    value={module.module_name}
                                                    onChange={(e) => {
                                                        const updatedModules = [...currentModel.modules];
                                                        updatedModules[index] = { ...module, module_name: e.target.value };
                                                        setCurrentModel(prev => ({ ...prev, modules: updatedModules }));
                                                        saveToDatabase({ ...currentModel, modules: updatedModules });
                                                    }}
                                                    placeholder="e.g., Basic Support"
                                                />
                                            </div>

                                            {/* Pricing Type - Second Field */}
                                            <div>
                                                <Label>Pricing Type</Label>
                                                <Select
                                                    value={module.pricing_type}
                                                    onValueChange={(value: PricingType) => {
                                                        const updatedModules = [...currentModel.modules];
                                                        updatedModules[index] = { ...module, pricing_type: value };
                                                        setCurrentModel(prev => ({ ...prev, modules: updatedModules }));
                                                        saveToDatabase({ ...currentModel, modules: updatedModules });
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
                                            {(module.pricing_type === 'per_unit' || module.pricing_type === 'slab') && (
                                                <div>
                                                    <Label>Unit Type</Label>
                                                    <Select
                                                        value={module.unit_type_id}
                                                        onValueChange={(value: string) => {
                                                            const updatedModules = [...currentModel.modules];
                                                            updatedModules[index] = { ...module, unit_type_id: value };
                                                            setCurrentModel(prev => ({ ...prev, modules: updatedModules }));
                                                            saveToDatabase({ ...currentModel, modules: updatedModules });
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
                                                            <div className="border-t border-border">
                                                                <Button
                                                                    variant="ghost"
                                                                    className="w-full justify-start h-8 px-2"
                                                                    onClick={() => setIsUnitTypesOpen(true)}
                                                                >
                                                                    <Plus className="h-4 w-4 mr-2" />
                                                                    Add Unit Type
                                                                </Button>
                                                            </div>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}

                                            {/* Fee Configuration based on pricing type */}
                                            {module.pricing_type === 'flat' && (
                                                <div>
                                                    <Label>Monthly Fee</Label>
                                                    <NumberInput
                                                        value={module.monthly_fee || 0}
                                                        onChange={(value) => {
                                                            const updatedModules = [...currentModel.modules];
                                                            updatedModules[index] = { ...module, monthly_fee: value };
                                                            setCurrentModel(prev => ({ ...prev, modules: updatedModules }));
                                                            saveToDatabase({ ...currentModel, modules: updatedModules });
                                                        }}
                                                        placeholder="e.g., 100"
                                                    />
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Fixed monthly fee for this module
                                                    </p>
                                                </div>
                                            )}

                                            {module.pricing_type === 'per_unit' && (
                                                <div>
                                                    <Label>Rate per Unit</Label>
                                                    <NumberInput
                                                        value={module.monthly_fee || 0}
                                                        onChange={(value) => {
                                                            const updatedModules = [...currentModel.modules];
                                                            updatedModules[index] = { ...module, monthly_fee: value };
                                                            setCurrentModel(prev => ({ ...prev, modules: updatedModules }));
                                                            saveToDatabase({ ...currentModel, modules: updatedModules });
                                                        }}
                                                        placeholder="e.g., 2.50"
                                                    />
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Rate charged per unit consumed
                                                    </p>
                                                </div>
                                            )}

                                            {/* Optional minimum fee for usage-based modules */}
                                            {(module.pricing_type === 'per_unit' || module.pricing_type === 'slab') && (
                                                <div>
                                                    <Label>Minimum Monthly Fee (Optional)</Label>
                                                    <NumberInput
                                                        value={module.module_minimum_fee || 0}
                                                        onChange={(value) => {
                                                            const updatedModules = [...currentModel.modules];
                                                            updatedModules[index] = { ...module, module_minimum_fee: value };
                                                            setCurrentModel(prev => ({ ...prev, modules: updatedModules }));
                                                            saveToDatabase({ ...currentModel, modules: updatedModules });
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
                                                    value={module.one_time_fee || 0}
                                                    onChange={(value) => {
                                                        const updatedModules = [...currentModel.modules];
                                                        updatedModules[index] = { ...module, one_time_fee: value };
                                                        setCurrentModel(prev => ({ ...prev, modules: updatedModules }));
                                                        saveToDatabase({ ...currentModel, modules: updatedModules });
                                                    }}
                                                    placeholder="e.g., 500"
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Charged once during implementation
                                                </p>
                                            </div>


                                            {/* Slab Configuration */}
                                            {module.pricing_type === 'slab' && (
                                                <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                                                    <Label className="text-sm font-medium">Pricing Slabs</Label>
                                                    <div className="space-y-2">
                                                        {module.slabs && module.slabs.length > 0 ? (
                                                            module.slabs.map((slab, slabIndex) => {
                                                                const isLastSlab = slabIndex === module.slabs.length - 1;
                                                                return (
                                                                    <div key={slabIndex} className="flex items-center gap-2 p-2 border rounded">
                                                                        <NumberInput
                                                                            value={slab.from_units}
                                                                            onChange={(value) => {
                                                                                const updatedModules = [...currentModel.modules];
                                                                                const updatedSlabs = [...(updatedModules[index].slabs || [])];
                                                                                updatedSlabs[slabIndex] = { ...slab, from_units: value };
                                                                                updatedModules[index] = { ...updatedModules[index], slabs: updatedSlabs };
                                                                                setCurrentModel(prev => ({ ...prev, modules: updatedModules }));
                                                                            }}
                                                                            placeholder="From"
                                                                            className="w-20"
                                                                        />
                                                                        <span className="text-muted-foreground whitespace-nowrap">
                                                                            {isLastSlab ? "and above" : "to"}
                                                                        </span>
                                                                        {!isLastSlab && (
                                                                            <NumberInput
                                                                                value={slab.to_units || 0}
                                                                                onChange={(value) => {
                                                                                    const updatedModules = [...currentModel.modules];
                                                                                    const updatedSlabs = [...(updatedModules[index].slabs || [])];
                                                                                    updatedSlabs[slabIndex] = { ...slab, to_units: value };
                                                                                    updatedModules[index] = { ...updatedModules[index], slabs: updatedSlabs };
                                                                                    setCurrentModel(prev => ({ ...prev, modules: updatedModules }));
                                                                                }}
                                                                                placeholder="To"
                                                                                className="w-20"
                                                                            />
                                                                        )}
                                                                        {isLastSlab && (
                                                                            <div className="w-20 text-sm text-muted-foreground flex items-center justify-center flex-shrink-0">
                                                                                ∞
                                                                            </div>
                                                                        )}
                                                                        <NumberInput
                                                                            value={slab.rate_per_unit}
                                                                            onChange={(value) => {
                                                                                const updatedModules = [...currentModel.modules];
                                                                                const updatedSlabs = [...(updatedModules[index].slabs || [])];
                                                                                updatedSlabs[slabIndex] = { ...slab, rate_per_unit: value };
                                                                                updatedModules[index] = { ...updatedModules[index], slabs: updatedSlabs };
                                                                                setCurrentModel(prev => ({ ...prev, modules: updatedModules }));
                                                                            }}
                                                                            placeholder="Rate"
                                                                            className="w-24"
                                                                        />
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                const updatedModules = [...currentModel.modules];
                                                                                const updatedSlabs = updatedModules[index].slabs?.filter((_, i) => i !== slabIndex) || [];
                                                                                updatedModules[index] = { ...updatedModules[index], slabs: updatedSlabs };
                                                                                setCurrentModel(prev => ({ ...prev, modules: updatedModules }));
                                                                            }}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            <div className="text-sm text-muted-foreground p-2 border rounded">
                                                                No slabs configured. Click "Add Slab" to create pricing tiers.
                                                            </div>
                                                        )}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                const updatedModules = [...currentModel.modules];
                                                                const existingSlabs = updatedModules[index].slabs || [];
                                                                const lastSlab = existingSlabs[existingSlabs.length - 1];

                                                                // If there are existing slabs, start the new one from where the last one ended
                                                                const fromUnits = lastSlab ? (lastSlab.to_units || 0) + 1 : 0;

                                                                const newSlab = {
                                                                    id: `slab-${Date.now()}`,
                                                                    from_units: fromUnits,
                                                                    to_units: existingSlabs.length === 0 ? 100 : undefined, // Only set to_units for non-last slabs
                                                                    rate_per_unit: 0,
                                                                    fee_type: 'monthly' as const,
                                                                    parent_type: 'module' as const,
                                                                    parent_id: module.id
                                                                };
                                                                const updatedSlabs = [...existingSlabs, newSlab];
                                                                updatedModules[index] = { ...updatedModules[index], slabs: updatedSlabs };
                                                                setCurrentModel(prev => ({ ...prev, modules: updatedModules }));
                                                            }}
                                                        >
                                                            <Plus className="h-4 w-4 mr-1" />
                                                            Add Slab
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => {
                                            const newModule: ModelModule = {
                                                id: `module-${Date.now()}`,
                                                model_id: currentModel.id,
                                                module_name: 'New Module',
                                                pricing_type: 'flat',
                                                monthly_fee: 0,
                                                one_time_fee: 0,
                                                module_minimum_fee: 0,
                                                unit_type_id: currentModel.unit_types?.[0]?.id || '',
                                                slabs: [],
                                                order: currentModel.modules.length
                                            };
                                            setCurrentModel(prev => ({ ...prev, modules: [...prev.modules, newModule] }));
                                        }}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Module
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Panel - Projection Table */}
                    <div className="lg:col-span-2">
                        <Card className="min-h-[600px]">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calculator className="h-5 w-5" />
                                            Dynamic Revenue Projection
                                        </CardTitle>
                                        <CardDescription>
                                            Edit any unit count to see real-time calculations
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-4">
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
                                                <span className="font-semibold ml-1">{formatCurrency(totalRevenue)}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Avg {projectionConfig.interval === 'monthly' ? 'Monthly' : 'Yearly'}:</span>
                                                <span className="font-semibold ml-1">{formatCurrency(averageMonthlyRevenue)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {projectionResults.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                        <h3 className="text-lg font-semibold mb-2">No Projections Available</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Add unit types and modules to see automatic revenue projections.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-auto max-h-[600px]">
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-white">
                                                <TableRow>
                                                    <TableHead>Period</TableHead>
                                                    <TableHead>{projectionConfig.interval === 'monthly' ? 'Month' : 'Year'}</TableHead>
                                                    <TableHead>Units</TableHead>
                                                    <TableHead>Total Fee</TableHead>
                                                    <TableHead>Module Fees</TableHead>
                                                    <TableHead>Min Fee</TableHead>
                                                    <TableHead>Impl Fee</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {projectionResults.map((result, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">{result.period}</TableCell>
                                                        <TableCell>
                                                            {projectionConfig.interval === 'monthly'
                                                                ? new Date(result.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                                                : new Date(result.date).getFullYear().toString()
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            {editingCell?.row === index && editingCell?.field === 'units' ? (
                                                                <Input
                                                                    value={tempValue}
                                                                    onChange={(e) => setTempValue(e.target.value)}
                                                                    onKeyDown={handleKeyPress}
                                                                    onBlur={handleCellSave}
                                                                    autoFocus
                                                                    className="w-20"
                                                                />
                                                            ) : (
                                                                <div
                                                                    className={`cursor-pointer hover:bg-muted p-1 rounded ${result.isEditable ? 'hover:border' : ''}`}
                                                                    onClick={() => result.isEditable && handleCellEdit(index, 'units', result.units)}
                                                                >
                                                                    {formatNumber(result.units)}
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="font-semibold">
                                                            {formatCurrency(result.total_fee)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="space-y-1">
                                                                {result.breakdown.module_fees.map((fee, feeIndex) => (
                                                                    <div key={feeIndex} className="text-xs">
                                                                        {fee.module_name}: {formatCurrency(fee.fee)}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{formatCurrency(result.breakdown.minimum_fee)}</TableCell>
                                                        <TableCell>{formatCurrency(result.breakdown.implementation_fee)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
