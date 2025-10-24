import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CreateUnitTypeData, UnitGrowthType } from '@/types';

const unitTypeSchema = z.object({
    name: z.string().min(1, 'Unit type name is required'),
    starting_units: z.number().min(0, 'Starting units must be 0 or greater'),
    growth_type: z.enum(['fixed', 'percentage']),
    growth_value: z.number().min(0, 'Growth value must be 0 or greater'),
});

interface UnitTypeFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateUnitTypeData) => void;
    initialData?: CreateUnitTypeData;
    title: string;
}

export function UnitTypeForm({ isOpen, onClose, onSubmit, initialData, title }: UnitTypeFormProps) {
    const [growthType, setGrowthType] = React.useState<UnitGrowthType>('percentage');

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isSubmitting }
    } = useForm<CreateUnitTypeData>({
        resolver: zodResolver(unitTypeSchema),
        defaultValues: initialData || {
            name: '',
            starting_units: 0,
            growth_type: 'percentage',
            growth_value: 0,
        }
    });

    const watchedGrowthType = watch('growth_type');

    React.useEffect(() => {
        setGrowthType(watchedGrowthType);
    }, [watchedGrowthType]);

    React.useEffect(() => {
        if (initialData) {
            reset(initialData);
            setGrowthType(initialData.growth_type);
        } else {
            reset({
                name: '',
                starting_units: 0,
                growth_type: 'percentage',
                growth_value: 0,
            });
            setGrowthType('percentage');
        }
    }, [initialData, reset]);

    const handleFormSubmit = async (data: CreateUnitTypeData) => {
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Unit Type Name</Label>
                        <input
                            id="name"
                            {...register('name')}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="e.g., Chargers, Stations, Technicians"
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="starting_units">Starting Units</Label>
                        <NumberInput
                            id="starting_units"
                            value={watch('starting_units') || 0}
                            onChange={(value) => setValue('starting_units', value)}
                            placeholder="0"
                            min={0}
                        />
                        {errors.starting_units && (
                            <p className="text-sm text-destructive">{errors.starting_units.message}</p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="growth_type">Growth Type</Label>
                        <Select
                            onValueChange={(value: UnitGrowthType) => setValue('growth_type', value)}
                            defaultValue={initialData?.growth_type || 'percentage'}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select growth type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="percentage">Percentage</SelectItem>
                                <SelectItem value="fixed">Fixed</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.growth_type && (
                            <p className="text-sm text-destructive">{errors.growth_type.message}</p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="growth_value">
                            Growth Value {growthType === 'percentage' ? '(%)' : '(units)'}
                        </Label>
                        <NumberInput
                            id="growth_value"
                            value={watch('growth_value') || 0}
                            onChange={(value) => setValue('growth_value', value)}
                            placeholder={growthType === 'percentage' ? '10' : '100'}
                            step={growthType === 'percentage' ? '0.1' : '1'}
                            min={0}
                        />
                        {errors.growth_value && (
                            <p className="text-sm text-destructive">{errors.growth_value.message}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            Save Unit Type
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
