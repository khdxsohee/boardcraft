import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BottomControls } from './components/BottomControls';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ShareModal } from './components/ShareModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { TemplatesModal } from './components/TemplatesModal';
import { ToolDock } from './components/ToolDock';
import { TopBar } from './components/TopBar';
import { WhiteboardCanvas } from './components/WhiteboardCanvas';
import { useCollaboration } from './hooks/useCollaboration';
import {
  BoardElement,
  CameraState,
  GridMode,
  LaserPoint,
  Point,
  ToolStyleConfig,
  ToolType,
} from './types/whiteboard';
import { getMultiBounds } from './utils/canvasMath';
import { exportBoardAsJSON, exportBoardAsPNG, exportBoardAsSVG } from './utils/exportUtils';
import { BoardTemplate } from './utils/templates';

const STORAGE_KEY = 'boardcraft_local_board_v1';

const DEFAULT_STYLE: ToolStyleConfig = {
  strokeColor: '#0F172A',
  fillColor: 'transparent',
  strokeWidth: 3,
  strokeStyle: 'solid',
  opacity: 1,
  fontSize: 20,
  fontFamily: 'sans',
  textAlign: 'left',
  bold: false,
  italic: false,
  stickyColor: '#FEF08A',
  doubleArrow: false,
};

function createId() {
  return `el_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('boardcraft_theme') === 'dark';
  });

  const [boardTitle, setBoardTitle] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.boardTitle === 'string') return parsed.boardTitle;
      }
    } catch {
      // ignore
    }
    return 'Untitled Whiteboard';
  });

  const [elements, setElements] = useState<BoardElement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.elements)) return parsed.elements;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [history, setHistory] = useState<BoardElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const historyInitializedRef = useRef(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState<ToolType>('pen');
  const [toolStyle, setToolStyle] = useState<ToolStyleConfig>(DEFAULT_STYLE);
  const [camera, setCamera] = useState<CameraState>({ x: 0, y: 0, zoom: 1 });
  const [gridMode, setGridMode] = useState<GridMode>('dots');
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [isPresenting, setIsPresenting] = useState<boolean>(false);
  const [laserPoints, setLaserPoints] = useState<LaserPoint[]>([]);

  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  const boardTitleRef = useRef(boardTitle);
  boardTitleRef.current = boardTitle;

  // Initialize undo history snapshot once
  useEffect(() => {
    if (!historyInitializedRef.current) {
      historyInitializedRef.current = true;
      setHistory([elements]);
      setHistoryIndex(0);
    }
  }, []);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('boardcraft_theme', 'dark');
      setToolStyle((prev) =>
        prev.strokeColor === '#0F172A' ? { ...prev, strokeColor: '#F8FAFC' } : prev
      );
    } else {
      root.classList.remove('dark');
      localStorage.setItem('boardcraft_theme', 'light');
      setToolStyle((prev) =>
        prev.strokeColor === '#F8FAFC' ? { ...prev, strokeColor: '#0F172A' } : prev
      );
    }
  }, [isDark]);

  // Persist locally
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ boardTitle, elements })
      );
    } catch {
      // Ignore quota errors on large images
    }
  }, [boardTitle, elements]);

  // Prune expired laser points periodically
  useEffect(() => {
    if (laserPoints.length === 0) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      setLaserPoints((prev) => prev.filter((p) => now - p.time < 1400));
    }, 250);
    return () => clearInterval(timer);
  }, [laserPoints.length]);

  const handleRemoteStateSync = useCallback((remoteEls: BoardElement[], remoteTitle: string) => {
    setElements(remoteEls);
    setBoardTitle(remoteTitle);
    setHistory([remoteEls]);
    setHistoryIndex(0);
  }, []);

  const handleRemoteUpsert = useCallback((incoming: BoardElement[]) => {
    setElements((prev) => {
      const map = new Map(prev.map((e) => [e.id, e]));
      for (const item of incoming) {
        map.set(item.id, item);
      }
      return Array.from(map.values());
    });
  }, []);

  const handleRemoteDelete = useCallback((ids: string[]) => {
    const delSet = new Set(ids);
    setElements((prev) => prev.filter((e) => !delSet.has(e.id)));
    setSelectedIds((prev) => prev.filter((id) => !delSet.has(id)));
  }, []);

  const handleRemoteReplace = useCallback((remoteEls: BoardElement[]) => {
    setElements(remoteEls);
    setSelectedIds([]);
  }, []);

  const handleRemoteLaserPoint = useCallback((point: LaserPoint) => {
    setLaserPoints((prev) => [...prev.slice(-180), point]);
  }, []);

  const {
    roomId,
    connected,
    participants,
    userName,
    userColor,
    startLiveRoom,
    leaveRoom,
    updateUserName,
    emitUpsert,
    emitDelete,
    emitReplace,
    emitTitle,
    emitCursor,
    emitLaser,
  } = useCollaboration({
    onRemoteStateSync: handleRemoteStateSync,
    onRemoteUpsert: handleRemoteUpsert,
    onRemoteDelete: handleRemoteDelete,
    onRemoteReplace: handleRemoteReplace,
    onRemoteTitleChange: setBoardTitle,
    onRemoteLaserPoint: handleRemoteLaserPoint,
    getCurrentElements: () => elementsRef.current,
    getCurrentTitle: () => boardTitleRef.current,
  });

  const pushHistory = useCallback((snapshot: BoardElement[]) => {
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      const next = [...sliced, snapshot].slice(-50);
      setHistoryIndex(next.length - 1);
      return next;
    });
  }, [historyIndex]);

  const handleCommitElements = useCallback(
    (
      nextElements: BoardElement[],
      changedElements?: BoardElement[],
      deletedIds?: string[],
      recordHistory = true
    ) => {
      setElements(nextElements);
      if (recordHistory) {
        pushHistory(nextElements);
      }
      if (changedElements && changedElements.length > 0) {
        emitUpsert(changedElements);
      }
      if (deletedIds && deletedIds.length > 0) {
        emitDelete(deletedIds);
      }
    },
    [pushHistory, emitUpsert, emitDelete]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    const nextIdx = historyIndex - 1;
    const snapshot = history[nextIdx];
    setHistoryIndex(nextIdx);
    setElements(snapshot);
    setSelectedIds([]);
    emitReplace(snapshot);
  }, [history, historyIndex, emitReplace]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const nextIdx = historyIndex + 1;
    const snapshot = history[nextIdx];
    setHistoryIndex(nextIdx);
    setElements(snapshot);
    setSelectedIds([]);
    emitReplace(snapshot);
  }, [history, historyIndex, emitReplace]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const delSet = new Set(
      elementsRef.current
        .filter((e) => selectedIds.includes(e.id) && !e.locked)
        .map((e) => e.id)
    );
    if (delSet.size === 0) return;
    const next = elementsRef.current.filter((e) => !delSet.has(e.id));
    setSelectedIds([]);
    handleCommitElements(next, [], Array.from(delSet), true);
  }, [selectedIds, handleCommitElements]);

  const handleDuplicateSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    let maxZ = elementsRef.current.reduce((m, e) => Math.max(m, e.zIndex), 0);
    const clones: BoardElement[] = [];
    for (const el of elementsRef.current) {
      if (!selectedIds.includes(el.id)) continue;
      maxZ += 1;
      const cloned: BoardElement = {
        ...structuredClone(el),
        id: createId(),
        locked: false,
        zIndex: maxZ,
        updatedAt: Date.now(),
      };
      if (cloned.points) {
        cloned.points = cloned.points.map((p) => ({ x: p.x + 28, y: p.y + 28 }));
      } else {
        cloned.x += 28;
        cloned.y += 28;
      }
      clones.push(cloned);
    }
    if (clones.length === 0) return;
    const next = [...elementsRef.current, ...clones];
    setSelectedIds(clones.map((c) => c.id));
    handleCommitElements(next, clones, [], true);
  }, [selectedIds, handleCommitElements]);

  const handleUpdateSelected = useCallback(
    (patch: Partial<BoardElement>) => {
      if (selectedIds.length === 0) return;
      const changed: BoardElement[] = [];
      const next = elementsRef.current.map((el) => {
        if (!selectedIds.includes(el.id)) return el;
        const updated = { ...el, ...patch, updatedAt: Date.now() };
        changed.push(updated);
        return updated;
      });
      handleCommitElements(next, changed, [], true);
    },
    [selectedIds, handleCommitElements]
  );

  const handleBringForward = useCallback(() => {
    if (selectedIds.length === 0) return;
    let maxZ = elementsRef.current.reduce((m, e) => Math.max(m, e.zIndex), 0);
    const changed: BoardElement[] = [];
    const next = elementsRef.current.map((el) => {
      if (!selectedIds.includes(el.id)) return el;
      maxZ += 1;
      const updated = { ...el, zIndex: maxZ, updatedAt: Date.now() };
      changed.push(updated);
      return updated;
    });
    handleCommitElements(next, changed, [], true);
  }, [selectedIds, handleCommitElements]);

  const handleSendBackward = useCallback(() => {
    if (selectedIds.length === 0) return;
    let minZ = elementsRef.current.reduce((m, e) => Math.min(m, e.zIndex), 0);
    const changed: BoardElement[] = [];
    const next = elementsRef.current.map((el) => {
      if (!selectedIds.includes(el.id)) return el;
      minZ -= 1;
      const updated = { ...el, zIndex: minZ, updatedAt: Date.now() };
      changed.push(updated);
      return updated;
    });
    handleCommitElements(next, changed, [], true);
  }, [selectedIds, handleCommitElements]);

  const handleToggleLock = useCallback(() => {
    if (selectedIds.length === 0) return;
    const selectedEls = elementsRef.current.filter((e) => selectedIds.includes(e.id));
    const shouldLock = !selectedEls.every((e) => e.locked);
    handleUpdateSelected({ locked: shouldLock });
  }, [selectedIds, handleUpdateSelected]);

  const handleInsertImage = useCallback(
    (file: File, dropWorldPos?: Point) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const maxDim = 420;
          let w = img.naturalWidth || 300;
          let h = img.naturalHeight || 200;
          if (w > maxDim || h > maxDim) {
            const ratio = Math.min(maxDim / w, maxDim / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }

          const centerWorld = dropWorldPos || {
            x: (window.innerWidth / 2 - camera.x) / camera.zoom,
            y: (window.innerHeight / 2 - camera.y) / camera.zoom,
          };

          const maxZ = elementsRef.current.reduce((m, e) => Math.max(m, e.zIndex), 0);
          const imageEl: BoardElement = {
            id: createId(),
            type: 'image',
            x: centerWorld.x - w / 2,
            y: centerWorld.y - h / 2,
            width: w,
            height: h,
            strokeColor: '#000000',
            fillColor: 'transparent',
            strokeWidth: 0,
            strokeStyle: 'solid',
            opacity: 1,
            imageData: dataUrl,
            zIndex: maxZ + 1,
            updatedAt: Date.now(),
          };
          const next = [...elementsRef.current, imageEl];
          setSelectedIds([imageEl.id]);
          setActiveTool('select');
          handleCommitElements(next, [imageEl], [], true);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    },
    [camera, handleCommitElements]
  );

  // Paste image from clipboard (Ctrl+V)
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleInsertImage(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [handleInsertImage]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
        return;
      }
      if (mod && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSelectedIds(elementsRef.current.map((el) => el.id));
        setActiveTool('select');
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
        return;
      }

      if (e.key === 'Escape') {
        setSelectedIds([]);
        setTemplatesOpen(false);
        setShareOpen(false);
        setShortcutsOpen(false);
        if (isPresenting) setIsPresenting(false);
        return;
      }

      if (e.key === '?') {
        setShortcutsOpen((prev) => !prev);
        return;
      }

      if (mod) return;

      const toolMap: Record<string, ToolType> = {
        v: 'select',
        h: 'hand',
        p: 'pen',
        m: 'highlighter',
        e: 'eraser',
        r: 'rectangle',
        o: 'ellipse',
        d: 'diamond',
        g: 'triangle',
        u: 'star',
        l: 'line',
        a: 'arrow',
        t: 'text',
        s: 'sticky',
        f: 'frame',
        k: 'laser',
      };

      const nextTool = toolMap[e.key.toLowerCase()];
      if (nextTool) {
        setActiveTool(nextTool);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleDuplicateSelected,
    handleDeleteSelected,
    isPresenting,
  ]);

  const handleApplyTemplate = (tpl: BoardTemplate, mode: 'replace' | 'append') => {
    const newItems = tpl.build();
    if (mode === 'replace') {
      setSelectedIds([]);
      setCamera({ x: 0, y: 0, zoom: 1 });
      setElements(newItems);
      pushHistory(newItems);
      emitReplace(newItems);
    } else {
      const maxZ = elements.reduce((m, e) => Math.max(m, e.zIndex), 0);
      const offset = elements.length > 0 ? 60 : 0;
      const adjusted = newItems.map((item, idx) => ({
        ...item,
        zIndex: maxZ + idx + 1,
        x: item.points ? item.x : item.x + offset,
        y: item.points ? item.y : item.y + offset,
        points: item.points?.map((p) => ({ x: p.x + offset, y: p.y + offset })),
      }));
      const next = [...elements, ...adjusted];
      handleCommitElements(next, adjusted, [], true);
    }
    setActiveTool('select');
  };

  const handleClearBoard = () => {
    setSelectedIds([]);
    setElements([]);
    pushHistory([]);
    emitReplace([]);
  };

  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed.elements)) {
          setElements(parsed.elements);
          if (typeof parsed.boardTitle === 'string') {
            setBoardTitle(parsed.boardTitle);
            emitTitle(parsed.boardTitle);
          }
          pushHistory(parsed.elements);
          emitReplace(parsed.elements);
        }
      } catch {
        // Invalid JSON file
      }
    };
    reader.readAsText(file);
  };

  const handleFitToContent = () => {
    const bounds = getMultiBounds(elements);
    if (!bounds) {
      setCamera({ x: 0, y: 0, zoom: 1 });
      return;
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 100;
    const zoom = Math.min(1.5, Math.max(0.2, Math.min((vw - pad * 2) / bounds.width, (vh - pad * 2) / bounds.height)));
    const x = vw / 2 - (bounds.x + bounds.width / 2) * zoom;
    const y = vh / 2 - (bounds.y + bounds.height / 2) * zoom;
    setCamera({ x, y, zoom });
  };

  const handleZoomBy = (factor: number) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = vw / 2;
    const cy = vh / 2;
    const nextZoom = Math.min(4, Math.max(0.15, camera.zoom * factor));
    const scaleChange = nextZoom / camera.zoom;
    setCamera({
      x: cx - (cx - camera.x) * scaleChange,
      y: cy - (cy - camera.y) * scaleChange,
      zoom: nextZoom,
    });
  };

  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <TopBar
        boardTitle={boardTitle}
        onTitleChange={(title) => {
          setBoardTitle(title);
          emitTitle(title);
        }}
        elementCount={elements.length}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenTemplates={() => setTemplatesOpen(true)}
        onExportPNG={() => exportBoardAsPNG(elements, isDark, gridMode, boardTitle)}
        onExportSVG={() => exportBoardAsSVG(elements, isDark, boardTitle)}
        onExportJSON={() => exportBoardAsJSON(elements, boardTitle)}
        onImportJSON={handleImportJSON}
        onClearBoard={handleClearBoard}
        onOpenShare={() => setShareOpen(true)}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        isPresenting={isPresenting}
        onTogglePresent={() => {
          setIsPresenting((p) => {
            const next = !p;
            setActiveTool(next ? 'laser' : 'select');
            return next;
          });
        }}
        roomId={roomId}
        connected={connected}
        participants={participants}
      />

      <OfflineIndicator />

      <ToolDock
        activeTool={activeTool}
        onSelectTool={(t) => {
          setActiveTool(t);
          if (t !== 'select') setSelectedIds([]);
        }}
        onInsertImage={(file) => handleInsertImage(file)}
        isPresenting={isPresenting}
      />

      {!isPresenting && (
        <PropertiesPanel
          activeTool={activeTool}
          selectedElements={selectedElements}
          toolStyle={toolStyle}
          onUpdateToolStyle={(patch) => setToolStyle((prev) => ({ ...prev, ...patch }))}
          onUpdateSelected={handleUpdateSelected}
          onDeleteSelected={handleDeleteSelected}
          onDuplicateSelected={handleDuplicateSelected}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
          onToggleLock={handleToggleLock}
          isDark={isDark}
        />
      )}

      <WhiteboardCanvas
        elements={elements}
        selectedIds={selectedIds}
        activeTool={activeTool}
        toolStyle={toolStyle}
        camera={camera}
        gridMode={gridMode}
        snapToGrid={snapToGrid}
        isDark={isDark}
        collaborators={participants}
        laserPoints={laserPoints}
        onChangeCamera={setCamera}
        onSelectIds={setSelectedIds}
        onCommitElements={handleCommitElements}
        onSelectTool={setActiveTool}
        onCursorMove={emitCursor}
        onAddLaserPoint={(pt) => {
          setLaserPoints((prev) => [...prev.slice(-180), pt]);
          emitLaser({ x: pt.x, y: pt.y, strokeId: pt.strokeId });
        }}
        onDropImageFile={handleInsertImage}
      />

      <BottomControls
        gridMode={gridMode}
        onChangeGridMode={setGridMode}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid((s) => !s)}
        zoom={camera.zoom}
        onZoomIn={() => handleZoomBy(1.2)}
        onZoomOut={() => handleZoomBy(0.83)}
        onResetZoom={() => setCamera({ x: 0, y: 0, zoom: 1 })}
        onFitToContent={handleFitToContent}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        isPresenting={isPresenting}
      />

      <TemplatesModal
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onApplyTemplate={handleApplyTemplate}
        hasExistingElements={elements.length > 0}
      />

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        roomId={roomId}
        connected={connected}
        userName={userName}
        userColor={userColor}
        participants={participants}
        onStartRoom={() => startLiveRoom()}
        onLeaveRoom={leaveRoom}
        onUpdateUserName={updateUserName}
      />

      <ShortcutsModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  );
}
