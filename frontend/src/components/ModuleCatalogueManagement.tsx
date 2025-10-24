import React, { useState } from 'react';
import { ModuleCatalogue } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { apiDataService } from '@/lib/apiDataService';
import { useApp } from '@/contexts/AppContext';

interface ModuleCatalogueManagementProps {
    onCatalogueUpdate?: (catalogue: ModuleCatalogue[]) => void;
}

export function ModuleCatalogueManagement({ onCatalogueUpdate }: ModuleCatalogueManagementProps) {
    const { moduleCatalogue, addModuleToCatalogue, updateModuleInCatalogue, removeModuleFromCatalogue } = useApp();
    const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
    const [isEditFormOpen, setIsEditFormOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<ModuleCatalogue | null>(null);
    const [deleteModule, setDeleteModule] = useState<ModuleCatalogue | null>(null);
    const [newModule, setNewModule] = useState({ name: '', product: '' });

    const handleCreateModule = async () => {
        if (!newModule.name.trim()) return;

        const createdModule = await apiDataService.addModuleToCatalogue({
            name: newModule.name.trim(),
            product: newModule.product.trim() || undefined,
        });

        if (createdModule) {
            addModuleToCatalogue(createdModule);
            if (onCatalogueUpdate) {
                onCatalogueUpdate(moduleCatalogue);
            }
        }
        setNewModule({ name: '', product: '' });
        setIsCreateFormOpen(false);
    };

    const handleEditModule = async () => {
        if (!editingModule || !editingModule.name.trim()) return;

        const updatedModule = await apiDataService.updateModuleInCatalogue(editingModule.id, {
            name: editingModule.name.trim(),
            product: editingModule.product?.trim() || undefined,
        });

        if (updatedModule) {
            updateModuleInCatalogue(editingModule.id, updatedModule);
            if (onCatalogueUpdate) {
                onCatalogueUpdate(moduleCatalogue);
            }
        }
        setEditingModule(null);
        setIsEditFormOpen(false);
    };

    const handleDeleteModule = async () => {
        if (!deleteModule) return;

        const success = await apiDataService.deleteModuleFromCatalogue(deleteModule.id);
        if (success) {
            removeModuleFromCatalogue(deleteModule.id);
            if (onCatalogueUpdate) {
                onCatalogueUpdate(moduleCatalogue);
            }
        }
        setDeleteModule(null);
    };

    const handleEdit = (module: ModuleCatalogue) => {
        setEditingModule({ ...module });
        setIsEditFormOpen(true);
    };

    const handleDelete = (module: ModuleCatalogue) => {
        setDeleteModule(module);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Module Catalogue
                            </CardTitle>
                            <CardDescription>
                                Manage the predefined modules available when creating pricing models. These modules appear in the dropdown when adding modules to models.
                            </CardDescription>
                        </div>
                        <Button onClick={() => setIsCreateFormOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Module
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {moduleCatalogue.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No modules in catalogue yet.</p>
                            <p className="text-sm">Add your first module to get started.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {moduleCatalogue.map((module) => (
                                        <TableRow key={module.id}>
                                            <TableCell className="font-medium">{module.name}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {module.product || 'No product specified'}
                                            </TableCell>
                                            <TableCell>
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
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Module Form */}
            <Dialog open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Module</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="module-name">Module Name *</Label>
                            <Input
                                id="module-name"
                                value={newModule.name}
                                onChange={(e) => setNewModule(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Analytics, Support, Storage"
                            />
                        </div>


                        <div className="space-y-2">
                            <Label htmlFor="module-product">Product</Label>
                            <Input
                                id="module-product"
                                value={newModule.product}
                                onChange={(e) => setNewModule(prev => ({ ...prev, product: e.target.value }))}
                                placeholder="Product name or category (optional)"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateFormOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateModule} disabled={!newModule.name.trim()}>
                            Add Module
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Module Form */}
            <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Module</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-module-name">Module Name *</Label>
                            <Input
                                id="edit-module-name"
                                value={editingModule?.name || ''}
                                onChange={(e) => setEditingModule(prev => prev ? { ...prev, name: e.target.value } : null)}
                                placeholder="e.g., Analytics, Support, Storage"
                            />
                        </div>


                        <div className="space-y-2">
                            <Label htmlFor="edit-module-product">Product</Label>
                            <Input
                                id="edit-module-product"
                                value={editingModule?.product || ''}
                                onChange={(e) => setEditingModule(prev => prev ? { ...prev, product: e.target.value } : null)}
                                placeholder="Product name or category (optional)"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditFormOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEditModule} disabled={!editingModule?.name.trim()}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteModule} onOpenChange={() => setDeleteModule(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Module</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deleteModule?.name}"? This will remove it from the module catalogue and it won't be available when creating new modules.
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
