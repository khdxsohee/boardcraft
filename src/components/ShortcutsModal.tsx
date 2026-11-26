import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUT_GROUPS = [
  {
    title: 'Drawing & Creation Tools',
    items: [
      ['Select & Move', 'V'],
      ['Hand Pan', 'H'],
      ['Pen', 'P'],
      ['Highlighter', 'M'],
      ['Eraser', 'E'],
      ['Rectangle', 'R'],
      ['Circle / Ellipse', 'O'],
      ['Diamond', 'D'],
      ['Line', 'L'],
      ['Arrow', 'A'],
      ['Text', 'T'],
      ['Sticky Note', 'S'],
      ['Frame', 'F'],
      ['Laser Pointer', 'K'],
    ],
  },
  {
    title: 'Canvas & Editing',
    items: [
      ['Pan Anywhere', 'Space + Drag'],
      ['Zoom In / Out', 'Ctrl / Cmd + Scroll'],
      ['Undo / Redo', 'Ctrl+Z / Ctrl+Y'],
      ['Duplicate Selected', 'Ctrl+D'],
      ['Delete Selected', 'Delete / Backspace'],
      ['Paste Image', 'Ctrl+V'],
      ['Select All', 'Ctrl+A'],
      ['Edit Text / Note', 'Double-click'],
    ],
  },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Keyboard className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="space-y-2.5">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {group.title}
              </h3>
              <div className="space-y-1.5">
                {group.items.map(([label, key]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-1 text-xs border-b border-slate-100 dark:border-slate-800/70"
                  >
                    <span className="text-slate-700 dark:text-slate-300">{label}</span>
                    <kbd className="font-mono-tabular px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
