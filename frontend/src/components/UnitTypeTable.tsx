import React from 'react';
import { ModelUnitType } from '@/types';
import { formatNumber } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UnitTypeTableProps {
    unitTypes: ModelUnitType[];
    onEdit: (unitType: ModelUnitType) => void;
    onDelete: (unitType: ModelUnitType) => void;
}

export function UnitTypeTable({ unitTypes, onEdit, onDelete }: UnitTypeTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Starting Units</TableHead>
                        <TableHead>Growth Type</TableHead>
                        <TableHead>Growth Value</TableHead>
                        <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {unitTypes.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                No unit types found. Add your first unit type to get started.
                            </TableCell>
                        </TableRow>
                    ) : (
                        unitTypes.map((unitType) => (
                            <TableRow key={unitType.id}>
                                <TableCell className="font-medium">
                                    {unitType.name}
                                </TableCell>
                                <TableCell>{formatNumber(unitType.starting_units)}</TableCell>
                                <TableCell>
                                    <Badge variant={unitType.growth_type === 'percentage' ? 'default' : 'secondary'}>
                                        {unitType.growth_type}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {unitType.growth_type === 'percentage'
                                        ? `${unitType.growth_value}%`
                                        : formatNumber(unitType.growth_value)
                                    }
                                </TableCell>
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEdit(unitType)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => onDelete(unitType)}
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

            {unitTypes.length > 0 && (
                <div className="px-4 py-2 text-sm text-muted-foreground border-t bg-muted/30">
                    💡 Each unit type can have independent growth patterns for projections
                </div>
            )}
        </div>
    );
}
