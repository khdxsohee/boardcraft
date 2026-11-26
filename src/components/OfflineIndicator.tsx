import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-amber-500/95 dark:bg-amber-600/95 backdrop-blur-md px-3.5 py-1.5 text-xs font-medium text-white shadow-md whitespace-nowrap"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Offline Mode — Changes are saved locally</span>
    </div>
  );
};
