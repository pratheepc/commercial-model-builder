import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

interface LoadingStateProps {
    children: React.ReactNode;
}

export function LoadingState({ children }: LoadingStateProps) {
    const { isLoading, error, lastUpdated, refreshAll, clearError } = useApp();

    if (isLoading && !lastUpdated) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Card className="w-96">
                    <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <div className="text-center">
                            <h3 className="text-lg font-semibold">Loading...</h3>
                            <p className="text-sm text-muted-foreground">
                                Fetching your pricing models and modules
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Card className="w-96">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-3 p-4 border border-destructive/20 bg-destructive/10 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                            <div className="space-y-3">
                                <p className="font-medium text-destructive">Failed to load data</p>
                                <p className="text-sm text-muted-foreground">{error}</p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={refreshAll}
                                        className="flex items-center gap-2"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Retry
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearError}
                                    >
                                        Dismiss
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return <>{children}</>;
}

export function ConnectionStatus() {
    const { lastUpdated, refreshAll } = useApp();
    const [isOnline, setIsOnline] = React.useState(true); // Default to true for SSR

    React.useEffect(() => {
        // Set initial online status
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOnline) {
        return (
            <div className="flex items-center gap-3 p-4 border border-destructive/20 bg-destructive/10 rounded-lg mb-4">
                <WifiOff className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">
                    You're offline. Some features may not work properly.
                </p>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wifi className="h-4 w-4 text-green-500" />
                <span>Connected</span>
                {lastUpdated && (
                    <span>• Last updated: {lastUpdated.toLocaleTimeString()}</span>
                )}
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={refreshAll}
                className="flex items-center gap-2"
            >
                <RefreshCw className="h-4 w-4" />
                Refresh
            </Button>
        </div>
    );
}
