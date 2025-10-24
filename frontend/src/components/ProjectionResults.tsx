import React, { useState } from 'react';
import { ProjectionResult, Model, ModelUnitType } from '@/types';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';
import { Download, TrendingUp, TrendingDown, ChevronDown, ChevronRight, Package } from 'lucide-react';

interface ProjectionResultsProps {
    results: ProjectionResult[];
    projectionName: string;
    modelName: string;
    model?: Model;
    onExport?: () => void;
}

export function ProjectionResults({ results, projectionName, modelName, model, onExport }: ProjectionResultsProps) {
    const [expandedUnitTypes, setExpandedUnitTypes] = useState<Set<string>>(new Set());

    // Pagination for results
    const {
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage,
        paginatedData: paginatedResults,
        goToPage,
    } = usePagination({ data: results, itemsPerPage: 20 });
    if (results.length === 0) {
        return (
            <Card>
                <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">No projection results available.</p>
                </CardContent>
            </Card>
        );
    }

    const totalRevenue = results.reduce((sum, result) => sum + result.total, 0);
    const totalUnits = results[results.length - 1]?.units || 0;
    const startingUnits = results[0]?.units || 0;
    const growthRate = startingUnits > 0 ? ((totalUnits - startingUnits) / startingUnits) * 100 : 0;

    const getGrowthIcon = () => {
        if (growthRate > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
        if (growthRate < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
        return null;
    };

    const getGrowthColor = () => {
        if (growthRate > 0) return 'text-green-600';
        if (growthRate < 0) return 'text-red-600';
        return 'text-muted-foreground';
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground">
                            Over {results.length} periods
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Final Units</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(totalUnits, model?.currency)}</div>
                        <p className="text-xs text-muted-foreground">
                            From {formatNumber(startingUnits, model?.currency)} units
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                        {getGrowthIcon()}
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${getGrowthColor()}`}>
                            {growthRate.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total growth
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Monthly</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(totalRevenue / results.length)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Average per period
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Unit Type Breakdown */}
            {model && model.unit_types && model.unit_types.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Unit Type Breakdown
                        </CardTitle>
                        <CardDescription>
                            Revenue breakdown by unit type for each period
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {model.unit_types.map((unitType) => {
                                const isExpanded = expandedUnitTypes.has(unitType.id);
                                const modulesForUnitType = model.modules.filter(m => m.unit_type_id === unitType.id);

                                return (
                                    <Collapsible
                                        key={unitType.id}
                                        open={isExpanded}
                                        onOpenChange={(open) => {
                                            const newExpanded = new Set(expandedUnitTypes);
                                            if (open) {
                                                newExpanded.add(unitType.id);
                                            } else {
                                                newExpanded.delete(unitType.id);
                                            }
                                            setExpandedUnitTypes(newExpanded);
                                        }}
                                    >
                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-left">
                                                        <div className="font-medium">{unitType.name}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {modulesForUnitType.length} module{modulesForUnitType.length !== 1 ? 's' : ''} •
                                                            Starting: {formatNumber(unitType.starting_units, model?.currency)} units
                                                        </div>
                                                    </div>
                                                </div>
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <div className="pl-4 pb-4">
                                                <div className="rounded-md border">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Period</TableHead>
                                                                <TableHead>Units</TableHead>
                                                                <TableHead>Modules</TableHead>
                                                                <TableHead className="text-right">Total Fee</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {paginatedResults.map((result, index) => {
                                                                // Calculate units for this unit type in this period
                                                                const units = Math.round(unitType.starting_units * Math.pow(1 + unitType.growth_value / 100, index));
                                                                const moduleFees = modulesForUnitType.map(module => {
                                                                    let fee = 0;
                                                                    switch (module.pricing_type) {
                                                                        case 'flat':
                                                                            fee = module.monthly_fee || 0;
                                                                            break;
                                                                        case 'per_unit':
                                                                            fee = units * (module.monthly_fee || 0);
                                                                            break;
                                                                        case 'slab':
                                                                            // Simplified slab calculation
                                                                            fee = units * (module.monthly_fee || 0);
                                                                            break;
                                                                    }
                                                                    return { name: module.module_name, fee };
                                                                });
                                                                const totalFee = moduleFees.reduce((sum, { fee }) => sum + fee, 0);

                                                                return (
                                                                    <TableRow key={`${unitType.id}-${index}`}>
                                                                        <TableCell className="font-medium">
                                                                            {formatDate(result.period)}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div className="flex items-center gap-2">
                                                                                {formatNumber(units, model?.currency)}
                                                                                {index > 0 && (
                                                                                    <Badge variant="outline" className="text-xs">
                                                                                        {units > (Math.round(unitType.starting_units * Math.pow(1 + unitType.growth_value / 100, index - 1))) ? '+' : ''}
                                                                                        {units - Math.round(unitType.starting_units * Math.pow(1 + unitType.growth_value / 100, index - 1))}
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div className="space-y-1">
                                                                                {moduleFees.map(({ name, fee }) => (
                                                                                    <div key={name} className="text-sm">
                                                                                        {name}: {formatCurrency(fee)}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className="text-right font-medium">
                                                                            {formatCurrency(totalFee)}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Results Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Projection Results: {projectionName}</CardTitle>
                            <CardDescription>
                                Detailed breakdown of units and revenue for each period
                            </CardDescription>
                        </div>
                        {onExport && (
                            <Button variant="outline" onClick={onExport}>
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Units</TableHead>
                                    <TableHead>Monthly Fee</TableHead>
                                    <TableHead>One-Time Fee</TableHead>
                                    <TableHead>Minimum Applied</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedResults.map((result, index) => (
                                    <TableRow key={result.id || index}>
                                        <TableCell className="font-medium">
                                            {formatDate(result.period)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {formatNumber(result.units, model?.currency)}
                                                {index > 0 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {result.units > results[index - 1].units ? '+' : ''}
                                                        {result.units - results[index - 1].units}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatCurrency(result.monthly_fee)}</TableCell>
                                        <TableCell>
                                            {result.one_time_fee > 0 ? formatCurrency(result.one_time_fee) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {result.minimum_applied ? (
                                                <Badge variant="secondary" className="text-xs">Yes</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-xs">No</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(result.total)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
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
