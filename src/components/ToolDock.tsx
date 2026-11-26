import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronRight,
  Circle,
  Diamond,
  Eraser,
  Frame,
  Hand,
  Highlighter,
  ImagePlus,
  Minus,
  MousePointer2,
  Pen,
  Sparkles,
  Square,
  Star,
  StickyNote,
  Triangle,
  Type,
  Wand2,
} from 'lucide-react';
import { ToolType } from '../types/whiteboard';

interface ToolDockProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  onInsertImage: (file: File) => void;
  isPresenting?: boolean;
}

const SHAPE_TOOLS: { id: ToolType; label: string; shortcut: string; icon: React.ReactNode }[] = [
  { id: 'rectangle', label: 'Rectangle', shortcut: 'R', icon: <Square className="w-4 h-4" /> },
  { id: 'ellipse', label: 'Circle / Ellipse', shortcut: 'O', icon: <Circle className="w-4 h-4" /> },
  { id: 'diamond', label: 'Diamond', shortcut: 'D', icon: <Diamond className="w-4 h-4" /> },
  { id: 'triangle', label: 'Triangle', shortcut: 'G', icon: <Triangle className="w-4 h-4" /> },
  { id: 'star', label: 'Star', shortcut: 'U', icon: <Star className="w-4 h-4" /> },
];

export const ToolDock: React.FC<ToolDockProps> = ({
  activeTool,
  onSelectTool,
  onInsertImage,
  isPresenting = false,
}) => {
  const [shapesOpen, setShapesOpen] = useState(false);
  const [lastShape, setLastShape] = useState<ToolType>('rectangle');
  const imageInputRef = useRef<HTMLInputElement>(null);

  const isShapeActive = SHAPE_TOOLS.some((s) => s.id === activeTool);
  const activeShapeMeta = SHAPE_TOOLS.find((s) => s.id === (isShapeActive ? activeTool : lastShape)) || SHAPE_TOOLS[0];

  const primaryTools: { id: ToolType; label: string; shortcut: string; icon: React.ReactNode }[] = isPresenting
    ? [
        { id: 'hand', label: 'Pan Board', shortcut: 'H', icon: <Hand className="w-4 h-4" /> },
        { id: 'laser', label: 'Laser Pointer', shortcut: 'K', icon: <Wand2 className="w-4 h-4" /> },
      ]
    : [
        { id: 'select', label: 'Select & Move', shortcut: 'V', icon: <MousePointer2 className="w-4 h-4" /> },
        { id: 'hand', label: 'Hand Pan', shortcut: 'H', icon: <Hand className="w-4 h-4" /> },
        { id: 'pen', label: 'Pen', shortcut: 'P', icon: <Pen className="w-4 h-4" /> },
        { id: 'highlighter', label: 'Highlighter', shortcut: 'M', icon: <Highlighter className="w-4 h-4" /> },
        { id: 'eraser', label: 'Object Eraser', shortcut: 'E', icon: <Eraser className="w-4 h-4" /> },
      ];

  const secondaryTools: { id: ToolType; label: string; shortcut: string; icon: React.ReactNode }[] = isPresenting
    ? []
    : [
        { id: 'line', label: 'Line', shortcut: 'L', icon: <Minus className="w-4 h-4 -rotate-45" /> },
        { id: 'arrow', label: 'Arrow Connector', shortcut: 'A', icon: <ArrowRight className="w-4 h-4 -rotate-45" /> },
        { id: 'text', label: 'Text', shortcut: 'T', icon: <Type className="w-4 h-4" /> },
        { id: 'sticky', label: 'Sticky Note', shortcut: 'S', icon: <StickyNote className="w-4 h-4" /> },
        { id: 'frame', label: 'Frame / Section', shortcut: 'F', icon: <Frame className="w-4 h-4" /> },
        { id: 'laser', label: 'Laser Pointer', shortcut: 'K', icon: <Sparkles className="w-4 h-4" /> },
      ];

  return (
    <aside
      aria-label="Whiteboard Tools"
      className="fixed left-3 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1 p-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-md max-h-[calc(100vh-88px)] overflow-visible"
    >
      {primaryTools.map((tool) => {
        const active = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => {
              onSelectTool(tool.id);
              setShapesOpen(false);
            }}
            title={`${tool.label} (${tool.shortcut})`}
            aria-label={tool.label}
            className={`relative group w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              active
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tool.icon}
          </button>
        );
      })}

      {!isPresenting && (
        <>
          <div className="h-px bg-slate-200 dark:bg-slate-800 my-0.5" />

          {/* Shapes Flyout Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                if (isShapeActive) {
                  setShapesOpen((prev) => !prev);
                } else {
                  onSelectTool(lastShape);
                  setShapesOpen(true);
                }
              }}
              title={`Shapes (${activeShapeMeta.shortcut})`}
              aria-label="Shapes"
              className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                isShapeActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {activeShapeMeta.icon}
              <ChevronRight className="w-2.5 h-2.5 absolute right-0.5 bottom-0.5 opacity-75" />
            </button>

            {shapesOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShapesOpen(false)}
                />
                <div className="absolute left-12 top-0 z-30 flex items-center gap-1 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg">
                  {SHAPE_TOOLS.map((shape) => {
                    const active = activeTool === shape.id;
                    return (
                      <button
                        key={shape.id}
                        onClick={() => {
                          setLastShape(shape.id);
                          onSelectTool(shape.id);
                          setShapesOpen(false);
                        }}
                        title={`${shape.label} (${shape.shortcut})`}
                        aria-label={shape.label}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                          active
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {shape.icon}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {secondaryTools.map((tool) => {
            const active = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  onSelectTool(tool.id);
                  setShapesOpen(false);
                }}
                title={`${tool.label} (${tool.shortcut})`}
                aria-label={tool.label}
                className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tool.icon}
              </button>
            );
          })}

          <div className="h-px bg-slate-200 dark:bg-slate-800 my-0.5" />

          {/* Image Upload */}
          <button
            onClick={() => imageInputRef.current?.click()}
            title="Insert Image (or Ctrl+V / Drag & Drop)"
            aria-label="Insert Image"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ImagePlus className="w-4 h-4" />
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onInsertImage(file);
                e.target.value = '';
              }
            }}
          />
        </>
      )}
    </aside>
  );
};
