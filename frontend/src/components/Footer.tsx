import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

export function Footer() {
    const { lastUpdated, refreshAll } = useApp();
    const [isOnline, setIsOnline] = React.useState(true);

    React.useEffect(() => {
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

    return (
        <footer className="bg-slate-50/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="px-6 py-3">
                <div className="flex items-center justify-between">
                    {/* Left side - App info */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Ready to replace Excel sheets</span>
                        {lastUpdated && (
                            <span>• Last updated: {lastUpdated.toLocaleTimeString()}</span>
                        )}
                    </div>

                    {/* Right side - Connection status */}
                    <div className="flex items-center gap-2">
                        {!isOnline ? (
                            <div className="flex items-center gap-2 text-xs text-destructive">
                                <WifiOff className="h-3 w-3" />
                                <span>Offline</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Wifi className="h-3 w-3 text-green-500" />
                                <span>Connected</span>
                            </div>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={refreshAll}
                            className="h-6 px-2 text-xs hover:bg-muted"
                        >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>
        </footer>
    );
}
