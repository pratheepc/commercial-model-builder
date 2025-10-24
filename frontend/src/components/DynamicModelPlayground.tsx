import React, { useState, useEffect, useMemo } from 'react';
import { Model, ModelModule, ModelUnitType, PricingType } from '@/types';
import { generateProjection, calculateModuleFee } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Calculator, TrendingUp, Package, Settings } from 'lucide-react';
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

    // Generate initial projection
    useEffect(() => {
        generateInitialProjection();
    }, [currentModel]);

    const generateInitialProjection = async () => {
        if (!currentModel.unit_types || currentModel.unit_types.length === 0) return;
        
        try {
            const results = generateProjection(
                currentModel,
                new Date().toISOString().split('T')[0],
                12,
                'monthly'
            );
            
            const editableResults: EditableProjectionRow[] = results.map((result, index) => ({
                period: parseInt(result.period),
                date: new Date().toISOString(), // We'll calculate this properly
                units: result.units,
                total_fee: result.total,
                breakdown: {
                    module_fees: [],
                    minimum_fee: 0,
                    implementation_fee: 0
                },
                isEditable: index > 0, // First period is not editable (starting units)
            }));
            
            setProjectionResults(editableResults);
        } catch (error) {
            console.error('Error generating projection:', error);
        }
    };

    const handleUnitChange = (rowIndex: number, newUnits: number) => {
        if (rowIndex === 0) return; // Don't allow editing first period
        
        const updatedResults = [...projectionResults];
        updatedResults[rowIndex].units = newUnits;
        
        // Recalculate fees for this period
        const recalculatedFee = calculateTotalFeeForPeriod(updatedResults[rowIndex].units, currentModel);
        updatedResults[rowIndex].total_fee = recalculatedFee.total;
        updatedResults[rowIndex].breakdown = recalculatedFee.breakdown;
        
        // Recalculate subsequent periods based on growth
        for (let i = rowIndex + 1; i < updatedResults.length; i++) {
            const growthFactor = calculateGrowthFactor(currentModel.unit_types[0], i - rowIndex);
            const newUnits = Math.round(updatedResults[rowIndex].units * growthFactor);
            updatedResults[i].units = newUnits;
            
            const recalculatedFee = calculateTotalFeeForPeriod(newUnits, currentModel);
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

    const calculateTotalFeeForPeriod = (units: number, model: Model) => {
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
        
        // Add implementation fee (only for first period)
        const implementationFee = model.implementation_fee;
        
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
                        <div className="flex items-center gap-2">
                            <Badge variant={currentModel.status === 'active' ? 'default' : 'secondary'}>
                                {currentModel.status}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
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
                                            onChange={(value) => setCurrentModel(prev => ({ ...prev, minimum_fee: value }))}
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

                        {/* Unit Types */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Unit Types
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {currentModel.unit_types?.map((unitType, index) => (
                                    <div key={unitType.id} className="space-y-3 p-3 border rounded-lg">
                                        <div>
                                            <Label>Unit Type Name</Label>
                                            <Input
                                                value={unitType.name}
                                                onChange={(e) => {
                                                    const updatedUnitTypes = [...(currentModel.unit_types || [])];
                                                    updatedUnitTypes[index] = { ...unitType, name: e.target.value };
                                                    setCurrentModel(prev => ({ ...prev, unit_types: updatedUnitTypes }));
                                                }}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label>Starting Units</Label>
                                                <NumberInput
                                                    value={unitType.starting_units}
                                                    onChange={(value) => {
                                                        const updatedUnitTypes = [...(currentModel.unit_types || [])];
                                                        updatedUnitTypes[index] = { ...unitType, starting_units: value };
                                                        setCurrentModel(prev => ({ ...prev, unit_types: updatedUnitTypes }));
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <Label>Growth Value</Label>
                                                <NumberInput
                                                    value={unitType.growth_value}
                                                    onChange={(value) => {
                                                        const updatedUnitTypes = [...(currentModel.unit_types || [])];
                                                        updatedUnitTypes[index] = { ...unitType, growth_value: value };
                                                        setCurrentModel(prev => ({ ...prev, unit_types: updatedUnitTypes }));
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Growth Type</Label>
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
                                    </div>
                                ))}
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
                                                <h4 className="font-medium">{module.module_name}</h4>
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
                                            
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label>Monthly Fee</Label>
                                                    <NumberInput
                                                        value={module.monthly_fee || 0}
                                                        onChange={(value) => {
                                                            const updatedModules = [...currentModel.modules];
                                                            updatedModules[index] = { ...module, monthly_fee: value };
                                                            setCurrentModel(prev => ({ ...prev, modules: updatedModules }));
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Annual Fee</Label>
                                                    <NumberInput
                                                        value={module.annual_fee || 0}
                                                        onChange={(value) => {
                                                            const updatedModules = [...currentModel.modules];
                                                            updatedModules[index] = { ...module, annual_fee: value };
                                                            setCurrentModel(prev => ({ ...prev, modules: updatedModules }));
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <Label>Pricing Type</Label>
                                                <Select
                                                    value={module.pricing_type}
                                                    onValueChange={(value: PricingType) => {
                                                        const updatedModules = [...currentModel.modules];
                                                        updatedModules[index] = { ...module, pricing_type: value };
                                                        setCurrentModel(prev => ({ ...prev, modules: updatedModules }));
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="flat">Flat</SelectItem>
                                                        <SelectItem value="per_unit">Per Unit</SelectItem>
                                                        <SelectItem value="slab">Slab</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
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
                                                annual_fee: 0,
                                                one_time_fee: 0,
                                                module_minimum_fee: 0,
                                                module_implementation_fee: 0,
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
                        <Card className="h-full">
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
                                    <div className="flex items-center gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Total Revenue:</span>
                                            <span className="font-semibold ml-1">{formatCurrency(totalRevenue)}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Avg Monthly:</span>
                                            <span className="font-semibold ml-1">{formatCurrency(averageMonthlyRevenue)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-auto max-h-[600px]">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-white">
                                            <TableRow>
                                                <TableHead>Period</TableHead>
                                                <TableHead>Date</TableHead>
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
                                                    <TableCell>{new Date(result.date).toLocaleDateString()}</TableCell>
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
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
