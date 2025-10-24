import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calculator, Package, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
    currentView: 'models' | 'catalogue' | 'details';
    onNavigate: (view: 'models' | 'catalogue') => void;
    selectedModel?: { name: string } | null;
}

export function Sidebar({ currentView, onNavigate, selectedModel }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(true);

    const navigationItems = [
        {
            id: 'models' as const,
            label: 'Pricing Models',
            icon: Calculator,
        },
        {
            id: 'catalogue' as const,
            label: 'Products & Modules',
            icon: Package,
        }
    ];

    return (
        <div className={cn(
            "bg-white shadow-sm h-screen flex flex-col transition-all duration-300",
            isCollapsed ? "w-16" : "w-64"
        )}>
            {/* Logo/Header */}
            <div className="p-4 bg-slate-50/50">
                <div className="flex items-center justify-between">
                    {!isCollapsed && (
                        <div className="flex items-center gap-2">
                            <Calculator className="h-6 w-6 text-primary" />
                            <div>
                                <h2 className="font-semibold text-sm">Pricing Model Builder</h2>
                                <p className="text-xs text-muted-foreground">SaaS Pricing Tool</p>
                            </div>
                        </div>
                    )}
                    {isCollapsed && (
                        <Calculator className="h-6 w-6 text-primary mx-auto" />
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        {isCollapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <ChevronLeft className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-1">
                {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;

                    return (
                        <Button
                            key={item.id}
                            variant={isActive ? "secondary" : "ghost"}
                            className={cn(
                                "w-full transition-all duration-200",
                                isCollapsed ? "h-10 px-2 justify-center" : "h-10 px-3 justify-start",
                                isActive && "bg-secondary"
                            )}
                            onClick={() => onNavigate(item.id)}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <div className={cn(
                                "flex items-center",
                                isCollapsed ? "justify-center" : "gap-3"
                            )}>
                                <Icon className="h-5 w-5 flex-shrink-0" />
                                {!isCollapsed && (
                                    <span className="font-medium text-sm">{item.label}</span>
                                )}
                            </div>
                        </Button>
                    );
                })}
            </nav>

            {/* Current Model Info (when in details view) */}
            {currentView === 'details' && selectedModel && !isCollapsed && (
                <div className="p-3 bg-slate-50/30">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <div className="text-sm font-medium">Current Model</div>
                            <div className="text-xs text-muted-foreground truncate">
                                {selectedModel.name}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            {!isCollapsed && (
                <div className="p-3 bg-slate-50/30">
                    <div className="text-xs text-muted-foreground text-center">
                        Ready to replace Excel sheets
                    </div>
                </div>
            )}
        </div>
    );
}
