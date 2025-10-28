import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { CreateModelData, SUPPORTED_CURRENCIES } from '@/types';

const modelSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    currency: z.string().min(1, 'Currency is required'),
    platform_fee_in_p0: z.boolean().optional(),
});

interface ModelFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateModelData) => void;
    initialData?: CreateModelData;
    title: string;
}

export function ModelForm({ isOpen, onClose, onSubmit, initialData, title }: ModelFormProps) {
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        trigger,
        formState: { errors, isSubmitting }
    } = useForm<CreateModelData>({
        resolver: zodResolver(modelSchema),
        defaultValues: initialData || {
            name: '',
            description: '',
            currency: 'USD',
            platform_fee_in_p0: true,
        }
    });

    React.useEffect(() => {
        if (initialData) {
            reset(initialData);
        } else {
            reset({
                name: '',
                description: '',
                currency: 'USD',
                platform_fee_in_p0: true,
            });
        }
    }, [initialData, reset]);

    const handleFormSubmit = async (data: CreateModelData) => {
        try {
            console.log('Submitting model data:', data);
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

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Model Name *</Label>
                        <Input
                            id="name"
                            {...register('name')}
                            placeholder="Enter model name"
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            {...register('description')}
                            placeholder="Enter description (optional)"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="currency">Currency *</Label>
                        <Select
                            value={watch('currency')}
                            onValueChange={(value) => {
                                setValue('currency', value);
                                trigger('currency');
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                                {SUPPORTED_CURRENCIES.map((currency) => (
                                    <SelectItem key={currency.code} value={currency.code}>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{currency.symbol}</span>
                                            <span>{currency.name}</span>
                                            <span className="text-muted-foreground">({currency.code})</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.currency && (
                            <p className="text-sm text-destructive">{errors.currency.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="platform-fee-p0"
                                checked={watch('platform_fee_in_p0')}
                                onCheckedChange={(checked) => {
                                    setValue('platform_fee_in_p0', checked as boolean);
                                }}
                            />
                            <Label htmlFor="platform-fee-p0" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Charge platform fee in P0 (month 0)
                            </Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            When enabled, the platform fee will be charged in the first month (P0). When disabled, it will only be charged from P1 onwards.
                        </p>
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
