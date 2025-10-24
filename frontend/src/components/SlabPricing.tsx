import React, { useState } from 'react';
import { PricingSlab, FeeType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { validateSlabs } from '@/lib/calculations';
import { formatCurrency } from '@/lib/utils';

interface SlabPricingProps {
    slabs: PricingSlab[];
    onSlabsChange: (slabs: PricingSlab[]) => void;
    moduleId: string;
}

export function SlabPricing({ slabs, onSlabsChange, moduleId }: SlabPricingProps) {
    const [newSlab, setNewSlab] = useState({
        from_units: 0,
        to_units: undefined as number | undefined,
        rate_per_unit: 0,
        fee_type: 'monthly' as FeeType,
    });

    const validation = validateSlabs(slabs);

    const addSlab = () => {
        if (newSlab.from_units < 0 || newSlab.rate_per_unit < 0) {
            return;
        }

        const slab: PricingSlab = {
            id: `slab-${Date.now()}`,
            from_units: newSlab.from_units,
            to_units: newSlab.to_units,
            rate_per_unit: newSlab.rate_per_unit,
            fee_type: newSlab.fee_type,
            parent_type: 'module',
            parent_id: moduleId,
        };

        const updatedSlabs = [...slabs, slab].sort((a, b) => a.from_units - b.from_units);
        onSlabsChange(updatedSlabs);

        // Reset form
        setNewSlab({
            from_units: 0,
            to_units: undefined,
            rate_per_unit: 0,
            fee_type: 'monthly',
        });
    };

    const updateSlab = (slabId: string, field: keyof PricingSlab, value: any) => {
        const updatedSlabs = slabs.map(slab =>
            slab.id === slabId ? { ...slab, [field]: value } : slab
        ).sort((a, b) => a.from_units - b.from_units);
        onSlabsChange(updatedSlabs);
    };

    const deleteSlab = (slabId: string) => {
        const updatedSlabs = slabs.filter(slab => slab.id !== slabId);
        onSlabsChange(updatedSlabs);
    };

    const getNextFromUnits = () => {
        if (slabs.length === 0) return 0;
        const lastSlab = slabs[slabs.length - 1];
        return lastSlab.to_units || lastSlab.from_units + 1;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    Slab-Based Pricing
                    {!validation.valid && (
                        <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Invalid
                        </Badge>
                    )}
                </CardTitle>
                <CardDescription>
                    Define pricing tiers based on unit ranges. Each slab applies a different rate per unit.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Add New Slab Form */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2">
                        <Label htmlFor="from_units">From Units</Label>
                        <NumberInput
                            id="from_units"
                            value={newSlab.from_units}
                            onChange={(value) => setNewSlab(prev => ({ ...prev, from_units: value }))}
                            placeholder="0"
                            min={0}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="to_units">To Units</Label>
                        <Input
                            id="to_units"
                            type="text"
                            value={newSlab.to_units?.toString() || ''}
                            onChange={(e) => {
                                const value = e.target.value.trim();
                                setNewSlab(prev => ({
                                    ...prev,
                                    to_units: value === '' ? undefined : parseInt(value) || undefined
                                }));
                            }}
                            placeholder="∞ (leave empty)"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="rate_per_unit">Rate/Unit (₹)</Label>
                        <NumberInput
                            id="rate_per_unit"
                            value={newSlab.rate_per_unit}
                            onChange={(value) => setNewSlab(prev => ({ ...prev, rate_per_unit: value }))}
                            placeholder="0.00"
                            step="0.01"
                            min={0}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fee_type">Fee Type</Label>
                        <Select
                            value={newSlab.fee_type}
                            onValueChange={(value: FeeType) => setNewSlab(prev => ({ ...prev, fee_type: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="annual">Annual</SelectItem>
                                <SelectItem value="one_time">One-Time</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-end">
                        <Button onClick={addSlab} className="w-full">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Slab
                        </Button>
                    </div>
                </div>

                {/* Validation Errors */}
                {!validation.valid && (
                    <div className="p-3 border border-destructive/20 bg-destructive/5 rounded-lg">
                        <div className="flex items-center gap-2 text-destructive text-sm font-medium mb-2">
                            <AlertCircle className="w-4 h-4" />
                            Validation Errors
                        </div>
                        <ul className="text-sm text-destructive space-y-1">
                            {validation.errors.map((error, index) => (
                                <li key={index}>• {error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Slabs Table */}
                {slabs.length > 0 && (
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>From Units</TableHead>
                                    <TableHead>To Units</TableHead>
                                    <TableHead>Rate/Unit</TableHead>
                                    <TableHead>Fee Type</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {slabs.map((slab, index) => (
                                    <TableRow key={slab.id}>
                                        <TableCell>
                                            <NumberInput
                                                value={slab.from_units}
                                                onChange={(value) => updateSlab(slab.id, 'from_units', value)}
                                                className="w-20"
                                                min={0}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="text"
                                                value={slab.to_units?.toString() || ''}
                                                onChange={(e) => {
                                                    const value = e.target.value.trim();
                                                    updateSlab(slab.id, 'to_units', value === '' ? undefined : parseInt(value) || undefined);
                                                }}
                                                placeholder="∞"
                                                className="w-20"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <NumberInput
                                                value={slab.rate_per_unit}
                                                onChange={(value) => updateSlab(slab.id, 'rate_per_unit', value)}
                                                className="w-24"
                                                step="0.01"
                                                min={0}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={slab.fee_type}
                                                onValueChange={(value: FeeType) => updateSlab(slab.id, 'fee_type', value)}
                                            >
                                                <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="monthly">Monthly</SelectItem>
                                                    <SelectItem value="annual">Annual</SelectItem>
                                                    <SelectItem value="one_time">One-Time</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => deleteSlab(slab.id)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Help Text */}
                <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Guidelines:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>First slab must start at 0 units</li>
                        <li>Slabs must be contiguous (no gaps or overlaps)</li>
                        <li>Last slab can have no upper limit (leave "To Units" empty)</li>
                        <li>Rates must be non-negative</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
