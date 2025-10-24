import React, { useState, useEffect } from 'react';
import { Model, ModelUnitType, CreateUnitTypeData } from '@/types';
import { apiDataService } from '@/lib/apiDataService';
import { UnitTypeTable } from './UnitTypeTable';
import { UnitTypeForm } from './UnitTypeForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';
import { Plus, Package } from 'lucide-react';

interface UnitTypeManagementProps {
    model: Model;
    onModelUpdate: (updatedModel: Model) => void;
}

export function UnitTypeManagement({ model, onModelUpdate }: UnitTypeManagementProps) {
    const [unitTypes, setUnitTypes] = useState<ModelUnitType[]>([]);
    const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
    const [isEditFormOpen, setIsEditFormOpen] = useState(false);
    const [editingUnitType, setEditingUnitType] = useState<ModelUnitType | null>(null);
    const [deleteUnitType, setDeleteUnitType] = useState<ModelUnitType | null>(null);

    // Pagination for unit types
    const {
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage,
        paginatedData: paginatedUnitTypes,
        goToPage,
    } = usePagination({ data: unitTypes, itemsPerPage: 10 });

    // Load unit types when component mounts or model changes
    useEffect(() => {
        loadUnitTypes();
    }, [model.id]);

    const loadUnitTypes = async () => {
        try {
            const fetchedUnitTypes = await apiDataService.getUnitTypesByModel(model.id);
            setUnitTypes(fetchedUnitTypes);
        } catch (error) {
            console.error('Error loading unit types:', error);
        }
    };

    const handleCreateUnitType = async (data: CreateUnitTypeData) => {
        try {
            const newUnitType = await apiDataService.createUnitType(model.id, data);
            if (newUnitType) {
                setUnitTypes(prev => [...prev, newUnitType]);
                // Update the model with the new unit type
                const updatedModel = await apiDataService.getModel(model.id);
                if (updatedModel) {
                    onModelUpdate(updatedModel);
                }
            }
        } catch (error) {
            console.error('Error creating unit type:', error);
            throw error;
        }
    };

    const handleEditUnitType = async (data: CreateUnitTypeData) => {
        if (!editingUnitType) return;

        try {
            const updatedUnitType = await apiDataService.updateUnitType(editingUnitType.id, data);
            if (updatedUnitType) {
                setUnitTypes(prev => prev.map(ut => ut.id === editingUnitType.id ? updatedUnitType : ut));
                // Update the model with the updated unit type
                const updatedModel = await apiDataService.getModel(model.id);
                if (updatedModel) {
                    onModelUpdate(updatedModel);
                }
            }
        } catch (error) {
            console.error('Error updating unit type:', error);
            throw error;
        }
    };

    const handleDeleteUnitType = async () => {
        if (!deleteUnitType) return;

        try {
            const success = await apiDataService.deleteUnitType(deleteUnitType.id);
            if (success) {
                setUnitTypes(prev => prev.filter(ut => ut.id !== deleteUnitType.id));
                // Update the model
                const updatedModel = await apiDataService.getModel(model.id);
                if (updatedModel) {
                    onModelUpdate(updatedModel);
                }
            }
        } catch (error) {
            console.error('Error deleting unit type:', error);
        } finally {
            setDeleteUnitType(null);
        }
    };

    const handleEdit = (unitType: ModelUnitType) => {
        setEditingUnitType(unitType);
        setIsEditFormOpen(true);
    };

    const handleDelete = (unitType: ModelUnitType) => {
        setDeleteUnitType(unitType);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Unit Types
                    </CardTitle>
                    <CardDescription>
                        Define different unit types for your pricing model. Each unit type can have independent growth patterns.
                        Modules will be assigned to specific unit types for accurate projections.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-6">
                        <div className="text-sm text-muted-foreground">
                            {unitTypes.length} unit type{unitTypes.length !== 1 ? 's' : ''} defined
                        </div>
                        <Button onClick={() => setIsCreateFormOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Unit Type
                        </Button>
                    </div>

                    <UnitTypeTable
                        unitTypes={paginatedUnitTypes}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </CardContent>
            </Card>

            {/* Unit Types Pagination */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalItems}
                />
            )}

            {/* Create Unit Type Form */}
            <UnitTypeForm
                isOpen={isCreateFormOpen}
                onClose={() => setIsCreateFormOpen(false)}
                onSubmit={handleCreateUnitType}
                title="Create New Unit Type"
            />

            {/* Edit Unit Type Form */}
            <UnitTypeForm
                isOpen={isEditFormOpen}
                onClose={() => {
                    setIsEditFormOpen(false);
                    setEditingUnitType(null);
                }}
                onSubmit={handleEditUnitType}
                initialData={editingUnitType ? {
                    name: editingUnitType.name,
                    starting_units: editingUnitType.starting_units,
                    growth_type: editingUnitType.growth_type,
                    growth_value: editingUnitType.growth_value,
                } : undefined}
                title="Edit Unit Type"
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteUnitType} onOpenChange={() => setDeleteUnitType(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Unit Type</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deleteUnitType?.name}"? This action cannot be undone.
                            Make sure no modules are using this unit type before deleting.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteUnitType(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteUnitType}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
