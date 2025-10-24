import React, { useState } from 'react';
import { Model, ModelModule, CreateModuleData } from '@/types';
import { apiDataService } from '@/lib/apiDataService';
import { ModuleForm } from './ModuleForm';
import { SlabPricing } from './SlabPricing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface ModuleManagementProps {
    model: Model;
    onModelUpdate: (updatedModel: Model) => void;
}

export function ModuleManagement({ model, onModelUpdate }: ModuleManagementProps) {
    const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
    const [isEditFormOpen, setIsEditFormOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<ModelModule | null>(null);
    const [deleteModule, setDeleteModule] = useState<ModelModule | null>(null);

    // Pagination for modules
    const {
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage,
        paginatedData: paginatedModules,
        goToPage,
    } = usePagination({ data: model.modules, itemsPerPage: 10 });

    const handleCreateModule = async (data: CreateModuleData) => {
        try {
            const newModule = await apiDataService.addModuleToModel(model.id, data);
            if (newModule) {
                const updatedModel = await apiDataService.getModel(model.id);
                if (updatedModel) {
                    onModelUpdate(updatedModel);
                }
            }
        } catch (error) {
            console.error('Error creating module:', error);
            throw error;
        }
    };

    const handleEditModule = async (data: CreateModuleData) => {
        if (!editingModule) return;

        try {
            const updatedModule = await apiDataService.updateModuleInModel(model.id, editingModule.id, data);
            if (updatedModule) {
                const updatedModel = await apiDataService.getModel(model.id);
                if (updatedModel) {
                    onModelUpdate(updatedModel);
                }
            }
        } catch (error) {
            console.error('Error updating module:', error);
            throw error;
        }
    };

    const handleDeleteModule = async () => {
        if (!deleteModule) return;

        try {
            const success = await apiDataService.deleteModuleFromModel(model.id, deleteModule.id);
            if (success) {
                const updatedModel = await apiDataService.getModel(model.id);
                if (updatedModel) {
                    onModelUpdate(updatedModel);
                }
            }
        } catch (error) {
            console.error('Error deleting module:', error);
        } finally {
            setDeleteModule(null);
        }
    };

    const handleSlabsChange = async (moduleId: string, slabs: any[]) => {
        try {
            const updatedModule = await apiDataService.updateModuleInModel(model.id, moduleId, { slabs });
            if (updatedModule) {
                const updatedModel = await apiDataService.getModel(model.id);
                if (updatedModel) {
                    onModelUpdate(updatedModel);
                }
            }
        } catch (error) {
            console.error('Error updating slabs:', error);
        }
    };

    const handleEdit = (module: ModelModule) => {
        setEditingModule(module);
        setIsEditFormOpen(true);
    };

    const handleDelete = (module: ModelModule) => {
        setDeleteModule(module);
    };

    const getPricingTypeLabel = (type: string) => {
        switch (type) {
            case 'flat': return 'Flat Fee';
            case 'per_unit': return 'Per Unit';
            case 'slab': return 'Slab-Based';
            default: return type;
        }
    };

    const getPricingTypeColor = (type: string) => {
        switch (type) {
            case 'flat': return 'default';
            case 'per_unit': return 'secondary';
            case 'slab': return 'outline';
            default: return 'default';
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Modules</CardTitle>
                            <CardDescription>
                                Configure pricing modules for {model.name}. Each module can have different pricing structures.
                            </CardDescription>
                        </div>
                        <Button onClick={() => setIsCreateFormOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Module
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {model.modules.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No modules configured yet.</p>
                            <p className="text-sm">Add your first module to start building the pricing structure.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {paginatedModules.map((module) => (
                                <Card key={module.id} className="border-l-4 border-l-primary">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <CardTitle className="text-lg">{module.module_name}</CardTitle>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant={getPricingTypeColor(module.pricing_type)}>
                                                            {getPricingTypeLabel(module.pricing_type)}
                                                        </Badge>
                                                        {module.module_minimum_fee && module.module_minimum_fee > 0 && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Min: {formatCurrency(module.module_minimum_fee)}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(module)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(module)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Pricing Details */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            {module.monthly_fee !== undefined && module.monthly_fee > 0 && (
                                                <div>
                                                    <div className="text-muted-foreground">Monthly Fee</div>
                                                    <div className="font-medium">
                                                        {module.pricing_type === 'per_unit'
                                                            ? `${formatCurrency(module.monthly_fee)}/unit`
                                                            : formatCurrency(module.monthly_fee)
                                                        }
                                                    </div>
                                                </div>
                                            )}
                                            {module.one_time_fee !== undefined && module.one_time_fee > 0 && (
                                                <div>
                                                    <div className="text-muted-foreground">One-Time Fee</div>
                                                    <div className="font-medium">{formatCurrency(module.one_time_fee)}</div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Slab Pricing */}
                                        {module.pricing_type === 'slab' && (
                                            <SlabPricing
                                                slabs={module.slabs}
                                                onSlabsChange={(slabs) => handleSlabsChange(module.id, slabs)}
                                                moduleId={module.id}
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modules Pagination */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalItems}
                />
            )}

            {/* Create Module Form */}
            <ModuleForm
                isOpen={isCreateFormOpen}
                onClose={() => setIsCreateFormOpen(false)}
                onSubmit={handleCreateModule}
                title="Add Module"
                modelId={model.id}
            />

            {/* Edit Module Form */}
            <ModuleForm
                isOpen={isEditFormOpen}
                onClose={() => {
                    setIsEditFormOpen(false);
                    setEditingModule(null);
                }}
                onSubmit={handleEditModule}
                initialData={editingModule ? {
                    unit_type_id: editingModule.unit_type_id,
                    module_name: editingModule.module_name,
                    pricing_type: editingModule.pricing_type,
                    monthly_fee: editingModule.monthly_fee,
                    one_time_fee: editingModule.one_time_fee,
                    module_minimum_fee: editingModule.module_minimum_fee,
                    slabs: editingModule.slabs,
                } : undefined}
                title="Edit Module"
                modelId={model.id}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteModule} onOpenChange={() => setDeleteModule(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Module</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the "{deleteModule?.module_name}" module? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteModule(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteModule}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
