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
import { CreateProjectionData, ProjectionInterval } from '@/types';

const projectionSchema = z.object({
    name: z.string().min(1, 'Projection name is required'),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().optional(),
    periods: z.number().min(1, 'Number of periods must be at least 1').optional(),
    interval: z.enum(['monthly', 'yearly']),
}).refine((data) => {
    return data.end_date || data.periods;
}, {
    message: "Either end date or number of periods must be specified",
    path: ["end_date"]
});

interface ProjectionFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateProjectionData) => void;
    initialData?: CreateProjectionData;
    title: string;
}

export function ProjectionForm({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    title
}: ProjectionFormProps) {

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isSubmitting }
    } = useForm<CreateProjectionData>({
        resolver: zodResolver(projectionSchema),
        defaultValues: initialData || {
            name: '',
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            periods: 12,
            interval: 'monthly',
        }
    });


    React.useEffect(() => {
        if (initialData) {
            reset(initialData);
        } else {
            reset({
                name: '',
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                periods: 12,
                interval: 'monthly',
            });
        }
    }, [initialData, reset]);

    const handleFormSubmit = async (data: CreateProjectionData) => {
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
                        <Label htmlFor="name">Projection Name *</Label>
                        <Input
                            id="name"
                            {...register('name')}
                            placeholder="Enter projection name"
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Start Date *</Label>
                            <Input
                                id="start_date"
                                type="date"
                                {...register('start_date')}
                            />
                            {errors.start_date && (
                                <p className="text-sm text-destructive">{errors.start_date.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="interval">Interval *</Label>
                            <Select
                                value={watch('interval')}
                                onValueChange={(value: ProjectionInterval) => setValue('interval', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select interval" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.interval && (
                                <p className="text-sm text-destructive">{errors.interval.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="end_date">End Date</Label>
                            <Input
                                id="end_date"
                                type="date"
                                {...register('end_date')}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="periods">Number of Periods</Label>
                            <NumberInput
                                id="periods"
                                value={watch('periods') || 12}
                                onChange={(value) => setValue('periods', value)}
                                placeholder="12"
                                min={1}
                            />
                        </div>
                    </div>


                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        <p><strong>Note:</strong> Either specify an end date or number of periods. If both are provided, the end date will be used.</p>
                        <p><strong>Growth:</strong> Unit growth is controlled by the unit types defined in your model. Each unit type has its own growth parameters.</p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Projection'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
