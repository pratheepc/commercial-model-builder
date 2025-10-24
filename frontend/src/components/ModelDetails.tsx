import { useState } from 'react';
import { Model, CreateProjectionData } from '@/types';
import { generateProjection } from '@/lib/calculations';
import { apiDataService } from '@/lib/apiDataService';
import { ModuleManagement } from './ModuleManagement';
import { UnitTypeManagement } from './UnitTypeManagement';
import { ProjectionForm } from './ProjectionForm';
import { ProjectionResults } from './ProjectionResults';
import { DynamicModelPlayground } from './DynamicModelPlayground';
import { Button } from '@/components/ui/button';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Calculator, Settings, Save, Play } from 'lucide-react';

interface ModelDetailsProps {
    model: Model;
    onBack: () => void;
}

export function ModelDetails({ model, onBack }: ModelDetailsProps) {
    const [isProjectionFormOpen, setIsProjectionFormOpen] = useState(false);
    const [projectionResults, setProjectionResults] = useState<any[]>([]);
    const [projectionName, setProjectionName] = useState('');
    const [currentModel, setCurrentModel] = useState<Model>(model);
    const [isEditingConfig, setIsEditingConfig] = useState(false);
    const [configData, setConfigData] = useState({
        starting_unit_count: model.unit_types?.[0]?.starting_units || 0,
        minimum_fee: model.minimum_fee,
        implementation_fee: model.implementation_fee,
    });
    const [viewMode, setViewMode] = useState<'traditional' | 'playground'>('traditional');

    const handleCreateProjection = async (data: CreateProjectionData) => {
        try {
            // Calculate number of periods if not provided
            let periods = data.periods;
            if (!periods && data.end_date) {
                const startDate = new Date(data.start_date);
                const endDate = new Date(data.end_date);
                const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
                periods = data.interval === 'yearly' ? Math.ceil(diffMonths / 12) : diffMonths;
            }

            if (!periods) {
                throw new Error('Unable to determine number of periods');
            }

            const results = generateProjection(
                currentModel,
                data.start_date,
                periods,
                data.interval
            );

            setProjectionResults(results);
            setProjectionName(data.name);
        } catch (error) {
            console.error('Error creating projection:', error);
            throw error;
        }
    };

    const handleSaveConfig = async () => {
        try {
            const updatedModel = await apiDataService.updateModel(currentModel.id, configData);
            if (updatedModel) {
                setCurrentModel(updatedModel);
                setIsEditingConfig(false);
            }
        } catch (error) {
            console.error('Error saving configuration:', error);
        }
    };

    const handleExport = () => {
        // Create CSV content
        const headers = ['Period', 'Units', 'Monthly Fee', 'One-Time Fee', 'Minimum Applied', 'Total'];
        const csvContent = [
            headers.join(','),
            ...projectionResults.map(result => [
                result.period,
                result.units,
                result.monthly_fee,
                result.one_time_fee,
                result.minimum_applied ? 'Yes' : 'No',
                result.total
            ].join(','))
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentModel.name}-projection-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    // If playground mode, render the dynamic playground
    if (viewMode === 'playground') {
        return <DynamicModelPlayground model={currentModel} onBack={onBack} />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">{currentModel.name}</h1>
                        {currentModel.description && (
                            <p className="text-muted-foreground">{currentModel.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={viewMode === 'playground' ? 'default' : 'outline'}
                        onClick={() => setViewMode('playground')}
                        className="flex items-center gap-2"
                    >
                        <Play className="h-4 w-4" />
                        Dynamic Playground
                    </Button>
                    <Button
                        variant={viewMode === 'traditional' ? 'default' : 'outline'}
                        onClick={() => setViewMode('traditional')}
                        className="flex items-center gap-2"
                    >
                        <Settings className="h-4 w-4" />
                        Traditional View
                    </Button>
                    <Badge variant={currentModel.status === 'active' ? 'default' : 'secondary'}>
                        {currentModel.status}
                    </Badge>
                </div>
            </div>


            {/* Tabs */}
            <Tabs defaultValue="config" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="config">Configuration</TabsTrigger>
                    <TabsTrigger value="unit-types">Unit Types</TabsTrigger>
                    <TabsTrigger value="modules">Modules</TabsTrigger>
                    <TabsTrigger value="projections">Projections</TabsTrigger>
                </TabsList>

                <TabsContent value="config" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Settings className="h-5 w-5" />
                                        Model Configuration
                                    </CardTitle>
                                    <CardDescription>
                                        Configure the basic settings for this pricing model
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isEditingConfig ? (
                                        <>
                                            <Button variant="outline" onClick={() => setIsEditingConfig(false)}>
                                                Cancel
                                            </Button>
                                            <Button onClick={handleSaveConfig}>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save
                                            </Button>
                                        </>
                                    ) : (
                                        <Button onClick={() => setIsEditingConfig(true)}>
                                            <Settings className="mr-2 h-4 w-4" />
                                            Edit
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                <div className="space-y-2">
                                    <Label htmlFor="minimum_fee">Minimum Fee (₹)</Label>
                                    <NumberInput
                                        id="minimum_fee"
                                        value={configData.minimum_fee}
                                        onChange={(value) => setConfigData(prev => ({ ...prev, minimum_fee: value }))}
                                        disabled={!isEditingConfig}
                                        placeholder="0.00"
                                        step="0.01"
                                        min={0}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Guaranteed minimum revenue per billing period
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="implementation_fee">Implementation Fee (₹)</Label>
                                    <NumberInput
                                        id="implementation_fee"
                                        value={configData.implementation_fee}
                                        onChange={(value) => setConfigData(prev => ({ ...prev, implementation_fee: value }))}
                                        disabled={!isEditingConfig}
                                        placeholder="0.00"
                                        step="0.01"
                                        min={0}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        One-time setup fee charged in first period
                                    </p>
                                </div>
                            </div>

                            {!isEditingConfig && (
                                <div className="p-4 bg-muted/50 rounded-lg">
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Tip:</strong> These settings affect how your pricing model calculates fees and projections.
                                        The minimum fee ensures a baseline revenue, while the implementation fee is a one-time charge.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="unit-types" className="space-y-4">
                    <UnitTypeManagement
                        model={currentModel}
                        onModelUpdate={(updatedModel) => {
                            setCurrentModel(updatedModel);
                        }}
                    />
                </TabsContent>

                <TabsContent value="modules" className="space-y-4">
                    <ModuleManagement
                        model={currentModel}
                        onModelUpdate={(updatedModel) => {
                            setCurrentModel(updatedModel);
                        }}
                    />
                </TabsContent>

                <TabsContent value="projections" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Revenue Projections</CardTitle>
                                    <CardDescription>
                                        Create and analyze revenue projections based on unit growth
                                    </CardDescription>
                                </div>
                                <Button onClick={() => setIsProjectionFormOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Projection
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {projectionResults.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No projections created yet.</p>
                                    <p className="text-sm">Create your first projection to analyze revenue growth.</p>
                                </div>
                            ) : (
                                <ProjectionResults
                                    results={projectionResults}
                                    projectionName={projectionName}
                                    modelName={currentModel.name}
                                    model={currentModel}
                                    onExport={handleExport}
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Projection Form */}
            <ProjectionForm
                isOpen={isProjectionFormOpen}
                onClose={() => setIsProjectionFormOpen(false)}
                onSubmit={handleCreateProjection}
                title="Create Revenue Projection"
            />
        </div>
    );
}
