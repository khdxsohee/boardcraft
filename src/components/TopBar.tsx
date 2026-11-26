import React, { useRef, useState } from 'react';
import {
  Download,
  FileJson,
  Image as ImageIcon,
  LayoutTemplate,
  Moon,
  Presentation,
  Redo2,
  Share2,
  Sun,
  Trash2,
  Undo2,
  Upload,
} from 'lucide-react';
import { Collaborator } from '../types/whiteboard';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  boardTitle: string;
  onTitleChange: (title: string) => void;
  elementCount: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenTemplates: () => void;
  onExportPNG: () => void;
  onExportSVG: () => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;
  onClearBoard: () => void;
  onOpenShare: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  isPresenting: boolean;
  onTogglePresent: () => void;
  roomId: string | null;
  connected: boolean;
  participants: Collaborator[];
}

export const TopBar: React.FC<TopBarProps> = ({
  boardTitle,
  onTitleChange,
  elementCount,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenTemplates,
  onExportPNG,
  onExportSVG,
  onExportJSON,
  onImportJSON,
  onClearBoard,
  onOpenShare,
  isDark,
  onToggleTheme,
  isPresenting,
  onTogglePresent,
  roomId,
  connected,
  participants,
}) => {
  const [exportOpen, setExportOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isPresenting) {
    return (
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 px-1 whitespace-nowrap">
          Presentation Mode
        </span>
        <button
          onClick={onTogglePresent}
          className="px-3 py-1.5 text-xs font-medium bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
        >
          Exit Presentation
        </button>
      </div>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-14 px-4 flex items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/90">
      {/* Zone 1: Brand & Board Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <img
            src="/logo.png"
            alt="BoardCraft logo"
            className="w-7 h-7 rounded-lg object-contain shrink-0"
          />
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 hidden sm:inline">
            BoardCraft
          </span>
        </div>

        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline" aria-hidden="true">
          /
        </span>

        <input
          type="text"
          value={boardTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          aria-label="Board title"
          className="text-sm font-medium text-slate-800 dark:text-slate-100 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 focus:outline-none rounded-md px-2 py-1 max-w-[160px] sm:max-w-[220px] truncate transition-colors"
        />

        <span className="hidden lg:inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono-tabular whitespace-nowrap">
          <span>{elementCount} items</span>
          <span aria-hidden="true">·</span>
          <span>Auto-saved</span>
        </span>
      </div>

      {/* Zone 2: Core Document Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="Load Templates"
        >
          <LayoutTemplate className="w-4 h-4" />
          <span className="hidden md:inline">Templates</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setExportOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Export or Import Board"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Export</span>
          </button>

          {exportOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setExportOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1.5">
                <button
                  onClick={() => {
                    onExportPNG();
                    setExportOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                  Export as PNG Image
                </button>
                <button
                  onClick={() => {
                    onExportSVG();
                    setExportOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  Export as SVG Vector
                </button>
                <button
                  onClick={() => {
                    onExportJSON();
                    setExportOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer"
                >
                  <FileJson className="w-3.5 h-3.5 text-slate-500" />
                  Save Board File (.json)
                </button>
                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setExportOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  Import Board (.json)
                </button>
              </div>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onImportJSON(file);
                e.target.value = '';
              }
            }}
          />
        </div>

        <div className="relative">
          {confirmClear ? (
            <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg px-2 py-1">
              <button
                onClick={() => {
                  onClearBoard();
                  setConfirmClear(false);
                }}
                className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline whitespace-nowrap cursor-pointer"
              >
                Confirm Clear
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-1 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              disabled={elementCount === 0}
              title="Clear Board"
              aria-label="Clear Board"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Zone 3: Present, Theme, & Live Collaboration */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onTogglePresent}
          title="Presentation Mode"
          aria-label="Presentation Mode"
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer hidden sm:flex"
        >
          <Presentation className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleTheme}
          title={isDark ? 'Switch to Light Board' : 'Switch to Dark Board'}
          aria-label="Toggle theme"
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <PWAInstallButton />

        <button
          onClick={onOpenShare}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>
            {roomId
              ? connected
                ? `Live (${participants.length + 1})`
                : 'Connecting...'
              : 'Share'}
          </span>
        </button>
      </div>
    </header>
  );
};
