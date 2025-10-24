import React from 'react';
import { Model } from '@/types';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';
import { MoreHorizontal, Edit, Copy, Trash2, Eye } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ModelTableProps {
    models: Model[];
    onEdit: (model: Model) => void;
    onDuplicate: (model: Model) => void;
    onDelete: (model: Model) => void;
    onView: (model: Model) => void;
}

export function ModelTable({ models, onEdit, onDuplicate, onDelete, onView }: ModelTableProps) {
    const {
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage,
        paginatedData,
        goToPage,
    } = usePagination({ data: models, itemsPerPage: 10 });

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Starting Units</TableHead>
                            <TableHead>Minimum Fee</TableHead>
                            <TableHead>Implementation Fee</TableHead>
                            <TableHead>Modules</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Updated</TableHead>
                            <TableHead className="w-[50px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {models.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    No models found. Create your first pricing model to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedData.map((model) => (
                                <TableRow
                                    key={model.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => onView(model)}
                                >
                                    <TableCell className="font-medium">
                                        <div>
                                            <div className="font-semibold">{model.name}</div>
                                            {model.description && (
                                                <div className="text-sm text-muted-foreground">{model.description}</div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{model.unit_types?.length || 0}</TableCell>
                                    <TableCell>{formatCurrency(model.minimum_fee)}</TableCell>
                                    <TableCell>{formatCurrency(model.implementation_fee)}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {model.modules.length} module{model.modules.length !== 1 ? 's' : ''}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={model.status === 'active' ? 'default' : 'secondary'}>
                                            {model.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDate(model.updated_at)}
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onView(model)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onEdit(model)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onDuplicate(model)}>
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    Duplicate
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => onDelete(model)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalItems}
                />
            )}
        </div>
    );
}
