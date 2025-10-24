import React, { useState, useEffect } from 'react';
import { Product, ModuleCatalogue } from '@/types';
import { apiDataService } from '@/lib/apiDataService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';
import { Plus, Edit, Trash2, Package, Box } from 'lucide-react';

interface ProductModuleManagementProps {
    onCatalogueUpdate?: (catalogue: ModuleCatalogue[]) => void;
}

export function ProductModuleManagement({ onCatalogueUpdate }: ProductModuleManagementProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [modules, setModules] = useState<ModuleCatalogue[]>([]);
    const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
    const [isCreateModuleOpen, setIsCreateModuleOpen] = useState(false);
    const [isEditProductOpen, setIsEditProductOpen] = useState(false);
    const [isEditModuleOpen, setIsEditModuleOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editingModule, setEditingModule] = useState<ModuleCatalogue | null>(null);
    const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
    const [deleteModule, setDeleteModule] = useState<ModuleCatalogue | null>(null);
    const [newProduct, setNewProduct] = useState({ name: '', description: '' });
    const [newModule, setNewModule] = useState({ name: '', description: '', product_id: '' });
    const [refreshKey, setRefreshKey] = useState(0);

    // Pagination for products
    const {
        currentPage: productsCurrentPage,
        totalPages: productsTotalPages,
        totalItems: productsTotalItems,
        itemsPerPage: productsItemsPerPage,
        paginatedData: paginatedProducts,
        goToPage: goToProductsPage,
    } = usePagination({ data: products, itemsPerPage: 5 });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            console.log('🔄 Loading data...');
            const [productsData, modulesData] = await Promise.all([
                apiDataService.getAllProducts(),
                apiDataService.getModuleCatalogue()
            ]);
            console.log('📦 Products loaded:', productsData.length);
            console.log('📦 Modules loaded:', modulesData.length);
            setProducts(productsData);
            setModules(modulesData);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const handleCreateProduct = async () => {
        if (!newProduct.name.trim()) return;

        const createdProduct = await apiDataService.createProduct({
            name: newProduct.name.trim(),
            description: newProduct.description.trim() || undefined,
        });

        if (createdProduct) {
            await loadData();
        }
        setNewProduct({ name: '', description: '' });
        setIsCreateProductOpen(false);
    };

    const handleCreateModule = async () => {
        if (!newModule.name.trim() || !newModule.product_id) return;

        console.log('➕ Creating module:', newModule.name);
        const createdModule = await apiDataService.addModuleToCatalogue({
            name: newModule.name.trim(),
            description: newModule.description.trim() || undefined,
            product_id: newModule.product_id,
        });

        if (createdModule) {
            console.log('✅ Module created, refreshing data...');
            await loadData();
        }
        setNewModule({ name: '', description: '', product_id: '' });
        setIsCreateModuleOpen(false);
    };

    const handleEditProduct = async () => {
        if (!editingProduct || !editingProduct.name.trim()) return;

        const updatedProduct = await apiDataService.updateProduct(editingProduct.id, {
            name: editingProduct.name.trim(),
            description: editingProduct.description?.trim() || undefined,
        });

        if (updatedProduct) {
            await loadData();
        }
        setEditingProduct(null);
        setIsEditProductOpen(false);
    };

    const handleEditModule = async () => {
        if (!editingModule || !editingModule.name.trim()) return;

        const updatedModule = await apiDataService.updateModuleInCatalogue(editingModule.id, {
            name: editingModule.name.trim(),
            description: editingModule.description?.trim() || undefined,
            product_id: editingModule.product_id,
        });

        if (updatedModule) {
            await loadData();
        }
        setEditingModule(null);
        setIsEditModuleOpen(false);
    };

    const handleDeleteProduct = async () => {
        if (!deleteProduct) return;

        const success = await apiDataService.deleteProduct(deleteProduct.id);
        if (success) {
            // Refresh the data to ensure UI is in sync
            await loadData();
        }
        setDeleteProduct(null);
    };

    const handleDeleteModule = async () => {
        if (!deleteModule) return;

        console.log('🗑️ Deleting module:', deleteModule.name);
        const success = await apiDataService.deleteModuleFromCatalogue(deleteModule.id);
        console.log('✅ Delete success:', success);

        if (success) {
            // Refresh the data to ensure UI is in sync
            console.log('🔄 Refreshing data after delete...');
            await loadData();

            // Force component re-render
            setRefreshKey(prev => prev + 1);

            // Also call the callback if provided
            if (onCatalogueUpdate) {
                console.log('📞 Calling onCatalogueUpdate callback');
                const updatedModules = await apiDataService.getModuleCatalogue();
                onCatalogueUpdate(updatedModules);
            }
        }
        setDeleteModule(null);
    };

    const getModulesForProduct = (productId: string) => {
        return modules.filter(module => module.product_id === productId);
    };

    const getModulesWithoutProduct = () => {
        return modules.filter(module => !module.product_id);
    };

    return (
        <div key={refreshKey} className="space-y-6">
            {/* Products Section */}
            <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Box className="h-5 w-5" />
                                Products
                            </CardTitle>
                            <CardDescription>
                                Manage products first, then add modules under each product.
                            </CardDescription>
                        </div>
                        <Button onClick={() => setIsCreateProductOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {products.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Box className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No products yet.</p>
                            <p className="text-sm">Add your first product to get started.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {paginatedProducts.map((product) => {
                                const productModules = getModulesForProduct(product.id);
                                return (
                                    <Card key={product.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border-0">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="text-lg">{product.name}</CardTitle>
                                                    {product.description && (
                                                        <CardDescription>{product.description}</CardDescription>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEditingProduct(product);
                                                            setIsEditProductOpen(true);
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setDeleteProduct(product)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-medium">Modules ({productModules.length})</h4>
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        setNewModule(prev => ({ ...prev, product_id: product.id }));
                                                        setIsCreateModuleOpen(true);
                                                    }}
                                                >
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Add Module
                                                </Button>
                                            </div>

                                            {productModules.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">No modules for this product yet.</p>
                                            ) : (
                                                <div className="rounded-lg bg-white/60 shadow-sm">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Name</TableHead>
                                                                <TableHead>Description</TableHead>
                                                                <TableHead className="w-[100px]">Actions</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {productModules.map((module) => (
                                                                <TableRow key={module.id}>
                                                                    <TableCell className="font-medium">{module.name}</TableCell>
                                                                    <TableCell className="text-muted-foreground">
                                                                        {module.description || 'No description'}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <div className="flex items-center gap-2">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    setEditingModule(module);
                                                                                    setIsEditModuleOpen(true);
                                                                                }}
                                                                            >
                                                                                <Edit className="h-4 w-4" />
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => setDeleteModule(module)}
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
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Products Pagination */}
            {productsTotalPages > 1 && (
                <Pagination
                    currentPage={productsCurrentPage}
                    totalPages={productsTotalPages}
                    onPageChange={goToProductsPage}
                    itemsPerPage={productsItemsPerPage}
                    totalItems={productsTotalItems}
                />
            )}

            {/* Orphaned Modules Section */}
            {getModulesWithoutProduct().length > 0 && (
                <Card className="bg-gradient-to-r from-orange-50 to-amber-50 shadow-sm border-0">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-700">
                            <Package className="h-5 w-5" />
                            Orphaned Modules
                        </CardTitle>
                        <CardDescription>
                            These modules don't belong to any product. Assign them to a product or delete them.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg bg-white/60 shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="w-[200px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {getModulesWithoutProduct().map((module) => (
                                        <TableRow key={module.id}>
                                            <TableCell className="font-medium">{module.name}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {module.description || 'No description'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEditingModule(module);
                                                            setIsEditModuleOpen(true);
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                        Assign to Product
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setDeleteModule(module)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Create Product Form */}
            <Dialog open={isCreateProductOpen} onOpenChange={setIsCreateProductOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Product</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="product-name">Product Name *</Label>
                            <Input
                                id="product-name"
                                value={newProduct.name}
                                onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Analytics Platform, Support Suite"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="product-description">Description</Label>
                            <Input
                                id="product-description"
                                value={newProduct.description}
                                onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Brief description of the product (optional)"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateProductOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateProduct} disabled={!newProduct.name.trim()}>
                            Add Product
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Module Form */}
            <Dialog open={isCreateModuleOpen} onOpenChange={setIsCreateModuleOpen}>
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
                            <Label htmlFor="module-description">Description</Label>
                            <Input
                                id="module-description"
                                value={newModule.description}
                                onChange={(e) => setNewModule(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Brief description of the module (optional)"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="module-product">Product *</Label>
                            <Select
                                value={newModule.product_id}
                                onValueChange={(value) => setNewModule(prev => ({ ...prev, product_id: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a product" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map((product) => (
                                        <SelectItem key={product.id} value={product.id}>
                                            {product.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateModuleOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateModule} disabled={!newModule.name.trim() || !newModule.product_id}>
                            Add Module
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Product Form */}
            <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-product-name">Product Name *</Label>
                            <Input
                                id="edit-product-name"
                                value={editingProduct?.name || ''}
                                onChange={(e) => setEditingProduct(prev => prev ? { ...prev, name: e.target.value } : null)}
                                placeholder="e.g., Analytics Platform, Support Suite"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-product-description">Description</Label>
                            <Input
                                id="edit-product-description"
                                value={editingProduct?.description || ''}
                                onChange={(e) => setEditingProduct(prev => prev ? { ...prev, description: e.target.value } : null)}
                                placeholder="Brief description of the product (optional)"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditProductOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEditProduct} disabled={!editingProduct?.name.trim()}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Module Form */}
            <Dialog open={isEditModuleOpen} onOpenChange={setIsEditModuleOpen}>
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
                            <Label htmlFor="edit-module-description">Description</Label>
                            <Input
                                id="edit-module-description"
                                value={editingModule?.description || ''}
                                onChange={(e) => setEditingModule(prev => prev ? { ...prev, description: e.target.value } : null)}
                                placeholder="Brief description of the module (optional)"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-module-product">Product *</Label>
                            <Select
                                value={editingModule?.product_id || ''}
                                onValueChange={(value) => setEditingModule(prev => prev ? { ...prev, product_id: value } : null)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a product" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map((product) => (
                                        <SelectItem key={product.id} value={product.id}>
                                            {product.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModuleOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEditModule} disabled={!editingModule?.name.trim() || !editingModule?.product_id}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Product Confirmation */}
            <Dialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Product</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deleteProduct?.name}"? This will also delete all modules associated with this product.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteProduct(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteProduct}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Module Confirmation */}
            <Dialog open={!!deleteModule} onOpenChange={() => setDeleteModule(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Module</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deleteModule?.name}"? This will remove it from the module catalogue.
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
