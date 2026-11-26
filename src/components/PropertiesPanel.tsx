import React from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Bold,
  Copy,
  Italic,
  Lock,
  Trash2,
  Unlock,
} from 'lucide-react';
import {
  BoardElement,
  FontFamily,
  StrokeStyle,
  TextAlign,
  ToolStyleConfig,
  ToolType,
} from '../types/whiteboard';

interface PropertiesPanelProps {
  activeTool: ToolType;
  selectedElements: BoardElement[];
  toolStyle: ToolStyleConfig;
  onUpdateToolStyle: (patch: Partial<ToolStyleConfig>) => void;
  onUpdateSelected: (patch: Partial<BoardElement>) => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onToggleLock: () => void;
  isDark: boolean;
}

const STROKE_COLORS = [
  '#0F172A',
  '#475569',
  '#DC2626',
  '#EA580C',
  '#D97706',
  '#16A34A',
  '#0891B2',
  '#2563EB',
  '#7C3AED',
  '#FFFFFF',
];

const FILL_COLORS = [
  'transparent',
  '#FFFFFF',
  '#F1F5F9',
  '#FEE2E2',
  '#FEF3C7',
  '#DCFCE7',
  '#DBEAFE',
  '#EDE9FE',
  '#1E293B',
];

const STICKY_COLORS = [
  { name: 'Butter', value: '#FEF08A' },
  { name: 'Mint', value: '#BBF7D0' },
  { name: 'Sky', value: '#BFDBFE' },
  { name: 'Rose', value: '#FECDD3' },
  { name: 'Lavender', value: '#DDD6FE' },
  { name: 'Peach', value: '#FED7AA' },
];

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  activeTool,
  selectedElements,
  toolStyle,
  onUpdateToolStyle,
  onUpdateSelected,
  onDeleteSelected,
  onDuplicateSelected,
  onBringForward,
  onSendBackward,
  onToggleLock,
}) => {
  const hasSelection = selectedElements.length > 0;
  const firstSel = selectedElements[0];

  const showDrawingTools = ['pen', 'highlighter', 'rectangle', 'ellipse', 'diamond', 'triangle', 'star', 'line', 'arrow', 'text', 'sticky', 'frame'].includes(activeTool);

  if (!hasSelection && !showDrawingTools) {
    return null;
  }

  const effectiveType = hasSelection ? firstSel.type : activeTool;

  const currentStrokeColor = hasSelection ? firstSel.strokeColor : toolStyle.strokeColor;
  const currentFillColor = hasSelection ? firstSel.fillColor : toolStyle.fillColor;
  const currentStrokeWidth = hasSelection ? firstSel.strokeWidth : toolStyle.strokeWidth;
  const currentStrokeStyle = hasSelection ? firstSel.strokeStyle : toolStyle.strokeStyle;
  const currentOpacity = hasSelection ? firstSel.opacity : toolStyle.opacity;
  const currentFontFamily = (hasSelection ? firstSel.fontFamily : toolStyle.fontFamily) || 'sans';
  const currentFontSize = (hasSelection ? firstSel.fontSize : toolStyle.fontSize) || 18;
  const currentTextAlign = (hasSelection ? firstSel.textAlign : toolStyle.textAlign) || 'left';
  const currentBold = (hasSelection ? firstSel.bold : toolStyle.bold) || false;
  const currentItalic = (hasSelection ? firstSel.italic : toolStyle.italic) || false;
  const currentStickyColor = (hasSelection ? firstSel.stickyColor : toolStyle.stickyColor) || '#FEF08A';
  const currentDoubleArrow = (hasSelection ? firstSel.doubleArrow : toolStyle.doubleArrow) || false;

  const applyChange = (patch: Partial<BoardElement> & Partial<ToolStyleConfig>) => {
    onUpdateToolStyle(patch);
    if (hasSelection) {
      onUpdateSelected(patch);
    }
  };

  const showStrokeSection = !['sticky', 'image'].includes(effectiveType);
  const showFillSection = ['rectangle', 'ellipse', 'diamond', 'triangle', 'star', 'frame'].includes(effectiveType);
  const showStrokeWeight = !['text', 'sticky', 'image'].includes(effectiveType);
  const showStickyColors = effectiveType === 'sticky';
  const showTypography = ['text', 'sticky', 'rectangle', 'ellipse', 'diamond', 'triangle', 'star'].includes(effectiveType);
  const showArrowOption = effectiveType === 'arrow';

  const allLocked = hasSelection && selectedElements.every((e) => e.locked);

  return (
    <aside
      aria-label="Properties Inspector"
      className="fixed right-3 top-18 z-20 w-60 max-h-[calc(100vh-140px)] overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-md space-y-3.5"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 capitalize">
          {hasSelection
            ? selectedElements.length > 1
              ? `${selectedElements.length} Selected`
              : `${firstSel.type} Properties`
            : `${activeTool} Settings`}
        </span>
        {hasSelection && (
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleLock}
              title={allLocked ? 'Unlock' : 'Lock'}
              aria-label={allLocked ? 'Unlock' : 'Lock'}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                allLocked
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {allLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* Sticky Note Colors */}
      {showStickyColors && (
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Note Paper</div>
          <div className="grid grid-cols-6 gap-1.5">
            {STICKY_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => applyChange({ stickyColor: c.value })}
                title={c.name}
                aria-label={c.name}
                className={`w-7 h-7 rounded-md border transition-transform cursor-pointer ${
                  currentStickyColor === c.value
                    ? 'border-blue-600 ring-2 ring-blue-500/30 scale-105'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stroke Color */}
      {showStrokeSection && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>{effectiveType === 'text' ? 'Text Color' : 'Stroke'}</span>
            <input
              type="color"
              value={currentStrokeColor}
              onChange={(e) => applyChange({ strokeColor: e.target.value })}
              aria-label="Custom stroke color"
              className="w-5 h-5 rounded border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent p-0"
            />
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {STROKE_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => applyChange({ strokeColor: c })}
                aria-label={`Color ${c}`}
                className={`w-7 h-7 rounded-md border transition-transform cursor-pointer ${
                  currentStrokeColor.toLowerCase() === c.toLowerCase()
                    ? 'border-blue-600 ring-2 ring-blue-500/30 scale-105'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fill Color */}
      {showFillSection && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Fill</span>
            <input
              type="color"
              value={currentFillColor === 'transparent' ? '#ffffff' : currentFillColor}
              onChange={(e) => applyChange({ fillColor: e.target.value })}
              aria-label="Custom fill color"
              className="w-5 h-5 rounded border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent p-0"
            />
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {FILL_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => applyChange({ fillColor: c })}
                aria-label={`Fill ${c}`}
                className={`w-7 h-7 rounded-md border transition-transform relative overflow-hidden cursor-pointer ${
                  currentFillColor.toLowerCase() === c.toLowerCase()
                    ? 'border-blue-600 ring-2 ring-blue-500/30 scale-105'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
                style={{ backgroundColor: c === 'transparent' ? 'transparent' : c }}
              >
                {c === 'transparent' && (
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-slate-400">
                    /
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stroke Width & Style */}
      {showStrokeWeight && (
        <div className="space-y-2.5">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Stroke Width</span>
              <span className="font-mono-tabular text-slate-700 dark:text-slate-300">
                {currentStrokeWidth}px
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[2, 4, 8, 16].map((w) => (
                <button
                  key={w}
                  onClick={() => applyChange({ strokeWidth: w })}
                  className={`py-1.5 rounded-md text-xs font-mono-tabular transition-colors cursor-pointer ${
                    currentStrokeWidth === w
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {w}px
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Stroke Style</div>
            <div className="grid grid-cols-3 gap-1">
              {(['solid', 'dashed', 'dotted'] as StrokeStyle[]).map((style) => (
                <button
                  key={style}
                  onClick={() => applyChange({ strokeStyle: style })}
                  className={`py-1.5 rounded-md text-xs font-medium capitalize transition-colors cursor-pointer ${
                    currentStrokeStyle === style
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Double Arrow Option */}
      {showArrowOption && (
        <button
          onClick={() => applyChange({ doubleArrow: !currentDoubleArrow })}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
            currentDoubleArrow
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
              : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Double-Headed Arrow
          </span>
          <span>{currentDoubleArrow ? 'On' : 'Off'}</span>
        </button>
      )}

      {/* Typography Controls */}
      {showTypography && (
        <div className="space-y-2 pt-1 border-t border-slate-200/80 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Typography</div>
          <div className="grid grid-cols-3 gap-1">
            {(
              [
                { id: 'sans', label: 'Sans' },
                { id: 'hand', label: 'Hand' },
                { id: 'mono', label: 'Mono' },
              ] as { id: FontFamily; label: string }[]
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => applyChange({ fontFamily: f.id })}
                className={`py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  currentFontFamily === f.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1">
              <button
                onClick={() => applyChange({ bold: !currentBold })}
                aria-label="Bold"
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  currentBold
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => applyChange({ italic: !currentItalic })}
                aria-label="Italic"
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  currentItalic
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              {(
                [
                  { id: 'left', icon: <AlignLeft className="w-3.5 h-3.5" /> },
                  { id: 'center', icon: <AlignCenter className="w-3.5 h-3.5" /> },
                  { id: 'right', icon: <AlignRight className="w-3.5 h-3.5" /> },
                ] as { id: TextAlign; icon: React.ReactNode }[]
              ).map((a) => (
                <button
                  key={a.id}
                  onClick={() => applyChange({ textAlign: a.id })}
                  aria-label={`Align ${a.id}`}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    currentTextAlign === a.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {a.icon}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Size</span>
            <input
              type="range"
              min={12}
              max={48}
              step={2}
              value={currentFontSize}
              onChange={(e) => applyChange({ fontSize: Number(e.target.value) })}
              className="w-28 accent-blue-600 cursor-pointer"
            />
            <span className="font-mono-tabular text-slate-700 dark:text-slate-300 w-7 text-right">
              {currentFontSize}
            </span>
          </div>
        </div>
      )}

      {/* Opacity */}
      <div className="space-y-1 pt-1 border-t border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Opacity</span>
          <span className="font-mono-tabular text-slate-700 dark:text-slate-300">
            {Math.round(currentOpacity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0.15}
          max={1}
          step={0.05}
          value={currentOpacity}
          onChange={(e) => applyChange({ opacity: Number(e.target.value) })}
          className="w-full accent-blue-600 cursor-pointer"
        />
      </div>

      {/* Layer & Element Actions */}
      {hasSelection && (
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Arrange & Edit</div>
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={onBringForward}
              title="Bring Forward"
              aria-label="Bring Forward"
              className="py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onSendBackward}
              title="Send Backward"
              aria-label="Send Backward"
              className="py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDuplicateSelected}
              title="Duplicate (Ctrl+D)"
              aria-label="Duplicate"
              className="py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDeleteSelected}
              title="Delete (Del)"
              aria-label="Delete"
              className="py-1.5 rounded-md bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
