import React from 'react';
import {
  Grid3X3,
  HelpCircle,
  Magnet,
  Maximize2,
  Minus,
  Plus,
} from 'lucide-react';
import { GridMode } from '../types/whiteboard';

interface BottomControlsProps {
  gridMode: GridMode;
  onChangeGridMode: (mode: GridMode) => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToContent: () => void;
  onOpenShortcuts: () => void;
  isPresenting: boolean;
}

const GRID_MODES: { id: GridMode; label: string }[] = [
  { id: 'dots', label: 'Dots' },
  { id: 'grid', label: 'Grid' },
  { id: 'lines', label: 'Lines' },
  { id: 'none', label: 'Blank' },
];

export const BottomControls: React.FC<BottomControlsProps> = ({
  gridMode,
  onChangeGridMode,
  snapToGrid,
  onToggleSnap,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToContent,
  onOpenShortcuts,
  isPresenting,
}) => {
  return (
    <>
      {/* Bottom-Left: Grid & Snap & Help */}
      {!isPresenting && (
        <div className="fixed bottom-3 left-3 z-20 flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-md">
          <div className="flex items-center gap-0.5 pl-1">
            <Grid3X3 className="w-3.5 h-3.5 text-slate-400 mr-1 hidden sm:block" />
            {GRID_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => onChangeGridMode(m.id)}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  gridMode === m.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

          <button
            onClick={onToggleSnap}
            title="Snap to Grid (20px)"
            aria-label="Snap to Grid"
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              snapToGrid
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Magnet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Snap</span>
          </button>

          <button
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts (?)"
            aria-label="Keyboard Shortcuts"
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom-Right: Zoom Controls */}
      <div className="fixed bottom-3 right-3 z-20 flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-md">
        <button
          onClick={onZoomOut}
          title="Zoom Out"
          aria-label="Zoom Out"
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>

        <button
          onClick={onResetZoom}
          title="Reset Zoom to 100%"
          className="px-2 py-1 rounded-lg text-xs font-mono-tabular font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 min-w-[54px] text-center cursor-pointer"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          onClick={onZoomIn}
          title="Zoom In"
          aria-label="Zoom In"
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

        <button
          onClick={onFitToContent}
          title="Fit All Content to Screen"
          aria-label="Fit to Content"
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </>
  );
};
