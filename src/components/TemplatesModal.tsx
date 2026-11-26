import React from 'react';
import { LayoutTemplate, X } from 'lucide-react';
import { BOARD_TEMPLATES, BoardTemplate } from '../utils/templates';

interface TemplatesModalProps {
  open: boolean;
  onClose: () => void;
  onApplyTemplate: (template: BoardTemplate, mode: 'replace' | 'append') => void;
  hasExistingElements: boolean;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  open,
  onClose,
  onApplyTemplate,
  hasExistingElements,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <LayoutTemplate className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Whiteboard Templates
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

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[70vh] overflow-y-auto">
          {BOARD_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              className="flex flex-col justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 space-y-3"
            >
              <div>
                <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                  {tpl.category}
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {tpl.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {tpl.description}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    onApplyTemplate(tpl, 'append');
                    onClose();
                  }}
                  className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  Add to Board
                </button>
                {hasExistingElements && (
                  <button
                    onClick={() => {
                      onApplyTemplate(tpl, 'replace');
                      onClose();
                    }}
                    className="py-1.5 px-3 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Replace All
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
