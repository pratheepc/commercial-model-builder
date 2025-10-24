import React, { useState } from 'react';
import { Model, CreateModelData } from '@/types';
import { apiDataService } from '@/lib/apiDataService';
import { useApp } from '@/contexts/AppContext';
import { ModelTable } from './ModelTable';
import { ModelForm } from './ModelForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface ModelManagementProps {
    onViewModel?: (model: Model) => void;
}

export function ModelManagement({ onViewModel }: ModelManagementProps) {
    const { models, addModel, updateModel, removeModel } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
    const [isEditFormOpen, setIsEditFormOpen] = useState(false);
    const [editingModel, setEditingModel] = useState<Model | null>(null);
    const [deleteModel, setDeleteModel] = useState<Model | null>(null);

    const handleCreateModel = async (data: CreateModelData) => {
        try {
            console.log('Creating model with data:', data);
            const newModel = await apiDataService.createModel(data);
            console.log('Created model:', newModel);
            if (newModel) {
                addModel(newModel);
                // Automatically navigate to the new model
                if (onViewModel) {
                    onViewModel(newModel);
                }
            }
        } catch (error) {
            console.error('Error creating model:', error);
            throw error;
        }
    };

    const handleEditModel = async (data: CreateModelData) => {
        if (!editingModel) return;

        try {
            const updatedModel = await apiDataService.updateModel(editingModel.id, data);
            if (updatedModel) {
                updateModel(editingModel.id, updatedModel);
            }
        } catch (error) {
            console.error('Error updating model:', error);
            throw error;
        }
    };

    const handleDuplicateModel = async (model: Model) => {
        try {
            const duplicatedModel = await apiDataService.duplicateModel(model.id);
            if (duplicatedModel) {
                addModel(duplicatedModel);
            }
        } catch (error) {
            console.error('Error duplicating model:', error);
        }
    };

    const handleDeleteModel = async () => {
        if (!deleteModel) return;

        try {
            const success = await apiDataService.deleteModel(deleteModel.id);
            if (success) {
                removeModel(deleteModel.id);
            }
        } catch (error) {
            console.error('Error deleting model:', error);
        } finally {
            setDeleteModel(null);
        }
    };

    const handleEdit = (model: Model) => {
        setEditingModel(model);
        setIsEditFormOpen(true);
    };

    const handleDelete = (model: Model) => {
        setDeleteModel(model);
    };

    const handleView = (model: Model) => {
        if (onViewModel) {
            onViewModel(model);
        }
    };

    // Filter models based on search term
    const filteredModels = models.filter(model =>
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (model.description && model.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Pricing Models</CardTitle>
                    <CardDescription>
                        Create and manage pricing models for your SaaS products. Each model can contain multiple modules with different pricing structures.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-6">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Search models..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button onClick={() => setIsCreateFormOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Model
                        </Button>
                    </div>

                    <ModelTable
                        models={filteredModels}
                        onEdit={handleEdit}
                        onDuplicate={handleDuplicateModel}
                        onDelete={handleDelete}
                        onView={handleView}
                    />
                </CardContent>
            </Card>

            {/* Create Model Form */}
            <ModelForm
                isOpen={isCreateFormOpen}
                onClose={() => setIsCreateFormOpen(false)}
                onSubmit={handleCreateModel}
                title="Create New Pricing Model"
            />

            {/* Edit Model Form */}
            <ModelForm
                isOpen={isEditFormOpen}
                onClose={() => {
                    setIsEditFormOpen(false);
                    setEditingModel(null);
                }}
                onSubmit={handleEditModel}
                initialData={editingModel ? {
                    name: editingModel.name,
                    description: editingModel.description,
                } : undefined}
                title="Edit Pricing Model"
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteModel} onOpenChange={() => setDeleteModel(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Model</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deleteModel?.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteModel(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteModel}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
