import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CreateModuleData, PricingType, ModelUnitType } from '@/types';
import { apiDataService } from '@/lib/apiDataService';

const moduleSchema = z.object({
    unit_type_id: z.string().min(1, 'Unit type is required'),
    module_name: z.string().min(1, 'Module name is required'),
    pricing_type: z.enum(['flat', 'per_unit', 'slab']),
    monthly_fee: z.number().min(0, 'Monthly fee must be 0 or greater').optional(),
    annual_fee: z.number().min(0, 'Annual fee must be 0 or greater').optional(),
    one_time_fee: z.number().min(0, 'One-time fee must be 0 or greater').optional(),
    module_minimum_fee: z.number().min(0, 'Module minimum fee must be 0 or greater').optional(),
    module_implementation_fee: z.number().min(0, 'Module implementation fee must be 0 or greater').optional(),
}).refine((data) => {
    if (data.pricing_type === 'flat' || data.pricing_type === 'per_unit') {
        return data.monthly_fee !== undefined && data.monthly_fee >= 0;
    }
    return true;
}, {
    message: "Monthly fee is required for flat and per-unit pricing",
    path: ["monthly_fee"]
});

interface ModuleFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateModuleData) => void;
    initialData?: CreateModuleData;
    title: string;
    modelId: string;
}

export function ModuleForm({ isOpen, onClose, onSubmit, initialData, title, modelId }: ModuleFormProps) {
    const [pricingType, setPricingType] = React.useState<PricingType>('flat');
    const [moduleCatalogue, setModuleCatalogue] = React.useState<any[]>([]);
    const [unitTypes, setUnitTypes] = React.useState<ModelUnitType[]>([]);

    React.useEffect(() => {
        const loadData = async () => {
            try {
                const [catalogue, unitTypesData] = await Promise.all([
                    apiDataService.getModuleCatalogue(),
                    apiDataService.getUnitTypesByModel(modelId)
                ]);
                setModuleCatalogue(catalogue);
                setUnitTypes(unitTypesData);
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };
        loadData();
    }, [modelId]);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isSubmitting }
    } = useForm<CreateModuleData>({
        resolver: zodResolver(moduleSchema),
        defaultValues: initialData || {
            unit_type_id: '',
            module_name: '',
            pricing_type: 'flat',
            monthly_fee: 0,
            annual_fee: 0,
            one_time_fee: 0,
            module_minimum_fee: 0,
            module_implementation_fee: 0,
        }
    });

    const watchedPricingType = watch('pricing_type');

    React.useEffect(() => {
        setPricingType(watchedPricingType);
    }, [watchedPricingType]);

    React.useEffect(() => {
        if (initialData) {
            reset(initialData);
            setPricingType(initialData.pricing_type);
        } else {
            reset({
                module_name: '',
                pricing_type: 'flat',
                monthly_fee: 0,
                annual_fee: 0,
                one_time_fee: 0,
                module_minimum_fee: 0,
                module_implementation_fee: 0,
            });
            setPricingType('flat');
        }
    }, [initialData, reset]);

    const handleFormSubmit = async (data: CreateModuleData) => {
        try {
            await onSubmit(data);
            reset();
            onClose();
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="unit_type_id">Unit Type *</Label>
                        <Select
                            value={watch('unit_type_id')}
                            onValueChange={(value) => setValue('unit_type_id', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a unit type" />
                            </SelectTrigger>
                            <SelectContent>
                                {unitTypes.map((unitType) => (
                                    <SelectItem key={unitType.id} value={unitType.id}>
                                        <div>
                                            <div className="font-medium">{unitType.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                Starting: {unitType.starting_units} units
                                            </div>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.unit_type_id && (
                            <p className="text-sm text-destructive">{errors.unit_type_id.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="module_name">Module *</Label>
                        <Select
                            value={watch('module_name')}
                            onValueChange={(value) => setValue('module_name', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a module" />
                            </SelectTrigger>
                            <SelectContent>
                                {moduleCatalogue.map((module) => (
                                    <SelectItem key={module.id} value={module.name}>
                                        <div>
                                            <div className="font-medium">{module.name}</div>
                                            {module.description && (
                                                <div className="text-sm text-muted-foreground">{module.description}</div>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.module_name && (
                            <p className="text-sm text-destructive">{errors.module_name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="pricing_type">Pricing Type *</Label>
                        <Select
                            value={watch('pricing_type')}
                            onValueChange={(value: PricingType) => setValue('pricing_type', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select pricing type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="flat">Flat Fee</SelectItem>
                                <SelectItem value="per_unit">Per Unit</SelectItem>
                                <SelectItem value="slab">Slab-Based</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.pricing_type && (
                            <p className="text-sm text-destructive">{errors.pricing_type.message}</p>
                        )}
                    </div>

                    {(pricingType === 'flat' || pricingType === 'per_unit') && (
                        <div className="space-y-2">
                            <Label htmlFor="monthly_fee">
                                Monthly Fee (₹) {pricingType === 'per_unit' ? 'per unit' : ''} *
                            </Label>
                            <NumberInput
                                id="monthly_fee"
                                value={watch('monthly_fee') || 0}
                                onChange={(value) => setValue('monthly_fee', value)}
                                placeholder="0.00"
                                step="0.01"
                                min={0}
                            />
                            {errors.monthly_fee && (
                                <p className="text-sm text-destructive">{errors.monthly_fee.message}</p>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="annual_fee">Annual Fee (₹)</Label>
                        <NumberInput
                            id="annual_fee"
                            value={watch('annual_fee') || 0}
                            onChange={(value) => setValue('annual_fee', value)}
                            placeholder="0.00"
                            step="0.01"
                            min={0}
                        />
                        {errors.annual_fee && (
                            <p className="text-sm text-destructive">{errors.annual_fee.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="one_time_fee">One-Time Fee (₹)</Label>
                        <NumberInput
                            id="one_time_fee"
                            value={watch('one_time_fee') || 0}
                            onChange={(value) => setValue('one_time_fee', value)}
                            placeholder="0.00"
                            step="0.01"
                            min={0}
                        />
                        {errors.one_time_fee && (
                            <p className="text-sm text-destructive">{errors.one_time_fee.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="module_minimum_fee">Module Minimum Fee (₹)</Label>
                        <NumberInput
                            id="module_minimum_fee"
                            value={watch('module_minimum_fee') || 0}
                            onChange={(value) => setValue('module_minimum_fee', value)}
                            placeholder="0.00"
                            step="0.01"
                            min={0}
                        />
                        {errors.module_minimum_fee && (
                            <p className="text-sm text-destructive">{errors.module_minimum_fee.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="module_implementation_fee">Module Implementation Fee (₹)</Label>
                        <NumberInput
                            id="module_implementation_fee"
                            value={watch('module_implementation_fee') || 0}
                            onChange={(value) => setValue('module_implementation_fee', value)}
                            placeholder="0.00"
                            step="0.01"
                            min={0}
                        />
                        {errors.module_implementation_fee && (
                            <p className="text-sm text-destructive">{errors.module_implementation_fee.message}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
