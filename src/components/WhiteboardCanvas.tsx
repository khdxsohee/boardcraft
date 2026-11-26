import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BoardElement,
  CameraState,
  Collaborator,
  GridMode,
  HandleType,
  LaserPoint,
  Point,
  ToolStyleConfig,
  ToolType,
} from '../types/whiteboard';
import {
  Bounds,
  doesElementIntersectRect,
  getElementBounds,
  getMultiBounds,
  hitTestElement,
  hitTestHandle,
  normalizeElement,
  screenToWorld,
  snapValue,
  worldToScreen,
} from '../utils/canvasMath';
import {
  drawCollaborators,
  drawElement,
  drawGrid,
  drawLaserTrails,
  drawSelectionOverlay,
} from '../utils/canvasRenderer';

interface WhiteboardCanvasProps {
  elements: BoardElement[];
  selectedIds: string[];
  activeTool: ToolType;
  toolStyle: ToolStyleConfig;
  camera: CameraState;
  gridMode: GridMode;
  snapToGrid: boolean;
  isDark: boolean;
  collaborators: Collaborator[];
  laserPoints: LaserPoint[];
  onChangeCamera: (cam: CameraState) => void;
  onSelectIds: (ids: string[]) => void;
  onCommitElements: (
    nextElements: BoardElement[],
    changedElements?: BoardElement[],
    deletedIds?: string[],
    recordHistory?: boolean
  ) => void;
  onSelectTool: (tool: ToolType) => void;
  onCursorMove: (worldPos: Point) => void;
  onAddLaserPoint: (point: LaserPoint) => void;
  onDropImageFile: (file: File, worldPos?: Point) => void;
}

type InteractionMode =
  | { type: 'none' }
  | { type: 'pan'; startScreen: Point; startCamera: CameraState }
  | { type: 'draw_freehand'; element: BoardElement }
  | { type: 'draw_shape'; element: BoardElement; startWorld: Point }
  | { type: 'marquee'; startWorld: Point; currentWorld: Point }
  | {
      type: 'move';
      startWorld: Point;
      initialSnapshots: Map<string, BoardElement>;
      moved: boolean;
    }
  | {
      type: 'resize';
      handle: HandleType;
      startWorld: Point;
      initialBounds: Bounds;
      initialSnapshots: Map<string, BoardElement>;
    }
  | { type: 'erase'; deletedIds: Set<string> }
  | { type: 'laser'; strokeId: string }
  | { type: 'place_text'; startWorld: Point }
  | { type: 'place_sticky'; startWorld: Point };

function createId() {
  return `el_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  elements,
  selectedIds,
  activeTool,
  toolStyle,
  camera,
  gridMode,
  snapToGrid,
  isDark,
  collaborators,
  laserPoints,
  onChangeCamera,
  onSelectIds,
  onCommitElements,
  onSelectTool,
  onCursorMove,
  onAddLaserPoint,
  onDropImageFile,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [spacePressed, setSpacePressed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [draftElement, setDraftElement] = useState<BoardElement | null>(null);
  const [marqueeRect, setMarqueeRect] = useState<Bounds | null>(null);
  const [hoverCursor, setHoverCursor] = useState<string | null>(null);

  const interactionRef = useRef<InteractionMode>({ type: 'none' });
  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;

  const renderTriggerRef = useRef(0);
  const triggerRender = useCallback(() => {
    renderTriggerRef.current += 1;
  }, []);

  // Spacebar panning listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !editingId && document.activeElement?.tagName !== 'INPUT') {
        setSpacePressed(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [editingId]);

  const editingStartedAtRef = useRef<number>(0);

  const startEditingElement = useCallback((id: string, initialText: string) => {
    editingStartedAtRef.current = performance.now();
    setEditingId(id);
    setEditingText(initialText);
  }, []);

  // Focus textarea when inline editing starts
  useEffect(() => {
    if (!editingId) return;
    const raf = requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [editingId]);

  const finishTextEditing = useCallback(() => {
    if (!editingId) return;
    const target = elementsRef.current.find((el) => el.id === editingId);
    if (target) {
      const trimmed = editingText;
      if (target.type === 'text' && !trimmed.trim()) {
        // Delete empty standalone text block
        const next = elementsRef.current.filter((e) => e.id !== editingId);
        onCommitElements(next, [], [editingId], true);
      } else if (trimmed !== (target.text || '')) {
        const lineCount = Math.max(1, trimmed.split('\n').length);
        const fontSize = target.fontSize || 20;
        const minHeight = target.type === 'text' ? Math.max(target.height, Math.ceil(lineCount * fontSize * 1.35 + 16)) : target.height;
        const updated: BoardElement = {
          ...target,
          text: trimmed,
          height: minHeight,
          updatedAt: Date.now(),
        };
        const next = elementsRef.current.map((e) => (e.id === editingId ? updated : e));
        onCommitElements(next, [updated], [], true);
      }
    }
    setEditingId(null);
    setEditingText('');
    onSelectTool('select');
  }, [editingId, editingText, onCommitElements, onSelectTool]);

  const handleTextareaBlur = useCallback(() => {
    if (performance.now() - editingStartedAtRef.current < 160) {
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
      return;
    }
    finishTextEditing();
  }, [finishTextEditing]);

  // High-DPI Canvas Render Loop
  useEffect(() => {
    let rafId = 0;

    const renderFrame = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      const targetW = Math.floor(rect.width * dpr);
      const targetH = Math.floor(rect.height * dpr);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.scale(dpr, dpr);

      drawGrid(ctx, rect.width, rect.height, camera, gridMode, isDark);

      ctx.save();
      ctx.translate(camera.x, camera.y);
      ctx.scale(camera.zoom, camera.zoom);

      const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
      for (const el of sorted) {
        drawElement(ctx, el, isDark, triggerRender, el.id === editingId);
      }

      if (draftElement) {
        drawElement(ctx, draftElement, isDark, triggerRender, false);
      }

      ctx.restore();

      const selectedElements = elements.filter((e) => selectedIds.includes(e.id));
      drawSelectionOverlay(ctx, selectedElements, camera, marqueeRect);

      const now = Date.now();
      const activeLaser = laserPoints.filter((p) => now - p.time < 1350);
      if (activeLaser.length > 0) {
        drawLaserTrails(ctx, activeLaser, camera, now);
      }

      drawCollaborators(ctx, collaborators, camera);
      ctx.restore();

      if (activeLaser.length > 0) {
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, [
    elements,
    selectedIds,
    camera,
    gridMode,
    isDark,
    draftElement,
    marqueeRect,
    editingId,
    collaborators,
    laserPoints,
    triggerRender,
  ]);

  // Wheel Zoom & Pan
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      if (e.ctrlKey || e.metaKey) {
        const pointerX = e.clientX - rect.left;
        const pointerY = e.clientY - rect.top;
        const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
        const nextZoom = Math.min(4, Math.max(0.15, camera.zoom * zoomFactor));
        const scaleChange = nextZoom / camera.zoom;
        const nextX = pointerX - (pointerX - camera.x) * scaleChange;
        const nextY = pointerY - (pointerY - camera.y) * scaleChange;
        onChangeCamera({ x: nextX, y: nextY, zoom: nextZoom });
      } else {
        onChangeCamera({
          ...camera,
          x: camera.x - e.deltaX,
          y: camera.y - e.deltaY,
        });
      }
    },
    [camera, onChangeCamera]
  );

  const getMaxZIndex = () => {
    let maxZ = 0;
    for (const el of elementsRef.current) {
      if (el.zIndex > maxZ) maxZ = el.zIndex;
    }
    return maxZ;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (editingId) {
      finishTextEditing();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    if (activeTool !== 'text' && activeTool !== 'sticky') {
      canvas.setPointerCapture(e.pointerId);
    }

    const rect = canvas.getBoundingClientRect();
    const screenPt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const worldPt = screenToWorld(screenPt.x, screenPt.y, camera);
    const snappedPt = {
      x: snapValue(worldPt.x, 20, snapToGrid),
      y: snapValue(worldPt.y, 20, snapToGrid),
    };

    // Middle mouse, spacebar, or Hand tool -> Pan
    if (e.button === 1 || spacePressed || activeTool === 'hand') {
      interactionRef.current = {
        type: 'pan',
        startScreen: screenPt,
        startCamera: { ...camera },
      };
      return;
    }

    if (e.button !== 0) return;

    if (activeTool === 'laser') {
      const strokeId = createId();
      interactionRef.current = { type: 'laser', strokeId };
      onAddLaserPoint({
        x: worldPt.x,
        y: worldPt.y,
        time: Date.now(),
        color: '#EF4444',
        strokeId,
      });
      return;
    }

    if (activeTool === 'eraser') {
      const sortedTopFirst = [...elementsRef.current].sort((a, b) => b.zIndex - a.zIndex);
      const hit = sortedTopFirst.find((el) => !el.locked && hitTestElement(el, worldPt, 10 / camera.zoom));
      const deletedSet = new Set<string>();
      if (hit) {
        deletedSet.add(hit.id);
        const next = elementsRef.current.filter((el) => el.id !== hit.id);
        onCommitElements(next, [], [hit.id], true);
      }
      interactionRef.current = { type: 'erase', deletedIds: deletedSet };
      return;
    }

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      const newEl: BoardElement = {
        id: createId(),
        type: activeTool,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        points: [worldPt],
        strokeColor: toolStyle.strokeColor,
        fillColor: 'transparent',
        strokeWidth: activeTool === 'highlighter' ? Math.max(18, toolStyle.strokeWidth * 3) : toolStyle.strokeWidth,
        strokeStyle: activeTool === 'highlighter' ? 'solid' : toolStyle.strokeStyle,
        opacity: toolStyle.opacity,
        zIndex: getMaxZIndex() + 1,
        updatedAt: Date.now(),
      };
      setDraftElement(newEl);
      interactionRef.current = { type: 'draw_freehand', element: newEl };
      return;
    }

    if (activeTool === 'text') {
      e.preventDefault();
      interactionRef.current = { type: 'place_text', startWorld: snappedPt };
      return;
    }

    if (activeTool === 'sticky') {
      e.preventDefault();
      interactionRef.current = { type: 'place_sticky', startWorld: snappedPt };
      return;
    }

    if (
      activeTool === 'rectangle' ||
      activeTool === 'ellipse' ||
      activeTool === 'diamond' ||
      activeTool === 'triangle' ||
      activeTool === 'star' ||
      activeTool === 'frame' ||
      activeTool === 'line' ||
      activeTool === 'arrow'
    ) {
      const isConnector = activeTool === 'line' || activeTool === 'arrow';
      const newEl: BoardElement = {
        id: createId(),
        type: activeTool,
        x: snappedPt.x,
        y: snappedPt.y,
        width: 0,
        height: 0,
        points: isConnector ? [snappedPt, snappedPt] : undefined,
        strokeColor:
          activeTool === 'frame'
            ? isDark
              ? '#64748B'
              : '#94A3B8'
            : toolStyle.strokeColor,
        fillColor: activeTool === 'frame' ? 'transparent' : toolStyle.fillColor,
        strokeWidth: activeTool === 'frame' ? 2 : toolStyle.strokeWidth,
        strokeStyle: activeTool === 'frame' ? 'dashed' : toolStyle.strokeStyle,
        opacity: toolStyle.opacity,
        doubleArrow: activeTool === 'arrow' ? toolStyle.doubleArrow : undefined,
        text: activeTool === 'frame' ? 'Untitled Frame' : undefined,
        fontSize: toolStyle.fontSize,
        fontFamily: toolStyle.fontFamily,
        zIndex: activeTool === 'frame' ? 0 : getMaxZIndex() + 1,
        updatedAt: Date.now(),
      };
      setDraftElement(newEl);
      interactionRef.current = {
        type: 'draw_shape',
        element: newEl,
        startWorld: snappedPt,
      };
      return;
    }

    // SELECT TOOL
    const currentSelected = elementsRef.current.filter((el) => selectedIdsRef.current.includes(el.id));

    // Check resize handles first if selection exists & unlocked
    if (currentSelected.length > 0 && !currentSelected.every((el) => el.locked)) {
      const singleLine = currentSelected.length === 1 ? currentSelected[0] : undefined;
      const bounds = getMultiBounds(currentSelected);
      if (bounds) {
        const handle = hitTestHandle(bounds, worldPt, camera.zoom, singleLine);
        if (handle) {
          const snapshots = new Map<string, BoardElement>();
          currentSelected.forEach((el) => snapshots.set(el.id, structuredClone(el)));
          interactionRef.current = {
            type: 'resize',
            handle,
            startWorld: worldPt,
            initialBounds: bounds,
            initialSnapshots: snapshots,
          };
          return;
        }
      }
    }

    // Hit test elements top-to-bottom
    const sortedTopFirst = [...elementsRef.current].sort((a, b) => b.zIndex - a.zIndex);
    const hitEl = sortedTopFirst.find((el) => hitTestElement(el, worldPt, 8 / camera.zoom));

    if (hitEl) {
      let nextSelectedIds = selectedIdsRef.current;
      if (e.shiftKey) {
        if (nextSelectedIds.includes(hitEl.id)) {
          nextSelectedIds = nextSelectedIds.filter((id) => id !== hitEl.id);
        } else {
          nextSelectedIds = [...nextSelectedIds, hitEl.id];
        }
        onSelectIds(nextSelectedIds);
      } else if (!nextSelectedIds.includes(hitEl.id)) {
        nextSelectedIds = [hitEl.id];
        onSelectIds(nextSelectedIds);
      }

      const toMove = elementsRef.current.filter((el) => nextSelectedIds.includes(el.id) && !el.locked);
      if (toMove.length > 0) {
        const snapshots = new Map<string, BoardElement>();
        toMove.forEach((el) => snapshots.set(el.id, structuredClone(el)));
        interactionRef.current = {
          type: 'move',
          startWorld: worldPt,
          initialSnapshots: snapshots,
          moved: false,
        };
      }
    } else {
      if (!e.shiftKey) {
        onSelectIds([]);
      }
      interactionRef.current = {
        type: 'marquee',
        startWorld: worldPt,
        currentWorld: worldPt,
      };
      setMarqueeRect({ x: worldPt.x, y: worldPt.y, width: 0, height: 0 });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenPt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const worldPt = screenToWorld(screenPt.x, screenPt.y, camera);
    const snappedPt = {
      x: snapValue(worldPt.x, 20, snapToGrid),
      y: snapValue(worldPt.y, 20, snapToGrid),
    };

    onCursorMove(worldPt);

    const mode = interactionRef.current;

    if (mode.type === 'none') {
      // Update hover cursor for resize handles
      if (activeTool === 'select' && selectedIdsRef.current.length > 0) {
        const selectedEls = elementsRef.current.filter((el) => selectedIdsRef.current.includes(el.id));
        const bounds = getMultiBounds(selectedEls);
        if (bounds) {
          const h = hitTestHandle(bounds, worldPt, camera.zoom, selectedEls.length === 1 ? selectedEls[0] : undefined);
          if (h) {
            const cursorMap: Record<HandleType, string> = {
              nw: 'nwse-resize',
              se: 'nwse-resize',
              ne: 'nesw-resize',
              sw: 'nesw-resize',
              n: 'ns-resize',
              s: 'ns-resize',
              e: 'ew-resize',
              w: 'ew-resize',
              start: 'grab',
              end: 'grab',
            };
            setHoverCursor(cursorMap[h]);
            return;
          }
        }
      }
      setHoverCursor(null);
      return;
    }

    if (mode.type === 'pan') {
      const dx = screenPt.x - mode.startScreen.x;
      const dy = screenPt.y - mode.startScreen.y;
      onChangeCamera({
        ...mode.startCamera,
        x: mode.startCamera.x + dx,
        y: mode.startCamera.y + dy,
      });
      return;
    }

    if (mode.type === 'laser') {
      onAddLaserPoint({
        x: worldPt.x,
        y: worldPt.y,
        time: Date.now(),
        color: '#EF4444',
        strokeId: mode.strokeId,
      });
      return;
    }

    if (mode.type === 'erase') {
      const sortedTopFirst = [...elementsRef.current].sort((a, b) => b.zIndex - a.zIndex);
      const hit = sortedTopFirst.find(
        (el) => !el.locked && !mode.deletedIds.has(el.id) && hitTestElement(el, worldPt, 10 / camera.zoom)
      );
      if (hit) {
        mode.deletedIds.add(hit.id);
        const next = elementsRef.current.filter((el) => el.id !== hit.id);
        onCommitElements(next, [], [hit.id], true);
      }
      return;
    }

    if (mode.type === 'draw_freehand') {
      const pts = mode.element.points || [];
      const last = pts[pts.length - 1];
      if (!last || Math.hypot(worldPt.x - last.x, worldPt.y - last.y) >= 2 / camera.zoom) {
        const updated = {
          ...mode.element,
          points: [...pts, worldPt],
        };
        mode.element = updated;
        setDraftElement(updated);
      }
      return;
    }

    if (mode.type === 'draw_shape') {
      let targetX = snappedPt.x;
      let targetY = snappedPt.y;

      if (mode.element.type === 'line' || mode.element.type === 'arrow') {
        if (e.shiftKey) {
          // Snap angle to 45 deg increments
          const dx = targetX - mode.startWorld.x;
          const dy = targetY - mode.startWorld.y;
          const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
          const dist = Math.hypot(dx, dy);
          targetX = mode.startWorld.x + Math.cos(angle) * dist;
          targetY = mode.startWorld.y + Math.sin(angle) * dist;
        }
        const updated: BoardElement = {
          ...mode.element,
          points: [mode.startWorld, { x: targetX, y: targetY }],
        };
        mode.element = updated;
        setDraftElement(updated);
      } else {
        let w = targetX - mode.startWorld.x;
        let h = targetY - mode.startWorld.y;
        if (e.shiftKey) {
          const size = Math.max(Math.abs(w), Math.abs(h));
          w = w < 0 ? -size : size;
          h = h < 0 ? -size : size;
        }
        const updated: BoardElement = {
          ...mode.element,
          x: mode.startWorld.x,
          y: mode.startWorld.y,
          width: w,
          height: h,
        };
        mode.element = updated;
        setDraftElement(updated);
      }
      return;
    }

    if (mode.type === 'marquee') {
      mode.currentWorld = worldPt;
      const rx = Math.min(mode.startWorld.x, worldPt.x);
      const ry = Math.min(mode.startWorld.y, worldPt.y);
      const rw = Math.abs(worldPt.x - mode.startWorld.x);
      const rh = Math.abs(worldPt.y - mode.startWorld.y);
      setMarqueeRect({ x: rx, y: ry, width: rw, height: rh });
      return;
    }

    if (mode.type === 'move') {
      const rawDx = worldPt.x - mode.startWorld.x;
      const rawDy = worldPt.y - mode.startWorld.y;
      const dx = snapToGrid ? snapValue(rawDx, 20, true) : rawDx;
      const dy = snapToGrid ? snapValue(rawDy, 20, true) : rawDy;

      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        mode.moved = true;
      }

      const changed: BoardElement[] = [];
      const next = elementsRef.current.map((el) => {
        const snap = mode.initialSnapshots.get(el.id);
        if (!snap) return el;
        let updated: BoardElement;
        if (snap.points) {
          updated = {
            ...snap,
            points: snap.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
            updatedAt: Date.now(),
          };
        } else {
          updated = {
            ...snap,
            x: snap.x + dx,
            y: snap.y + dy,
            updatedAt: Date.now(),
          };
        }
        changed.push(updated);
        return updated;
      });
      onCommitElements(next, changed, [], false);
      return;
    }

    if (mode.type === 'resize') {
      const dx = worldPt.x - mode.startWorld.x;
      const dy = worldPt.y - mode.startWorld.y;
      const ib = mode.initialBounds;

      // Single line/arrow endpoint resize
      if ((mode.handle === 'start' || mode.handle === 'end') && mode.initialSnapshots.size === 1) {
        const [id, snap] = Array.from(mode.initialSnapshots.entries())[0];
        if (snap.points && snap.points.length >= 2) {
          const pts = [...snap.points];
          if (mode.handle === 'start') {
            pts[0] = snappedPt;
          } else {
            pts[1] = snappedPt;
          }
          const updated: BoardElement = { ...snap, points: pts, updatedAt: Date.now() };
          const next = elementsRef.current.map((el) => (el.id === id ? updated : el));
          onCommitElements(next, [updated], [], false);
        }
        return;
      }

      let newX = ib.x;
      let newY = ib.y;
      let newW = ib.width;
      let newH = ib.height;

      if (mode.handle.includes('e')) newW = Math.max(16, ib.width + dx);
      if (mode.handle.includes('s')) newH = Math.max(16, ib.height + dy);
      if (mode.handle.includes('w')) {
        const maxDx = ib.width - 16;
        const clampedDx = Math.min(dx, maxDx);
        newX = ib.x + clampedDx;
        newW = ib.width - clampedDx;
      }
      if (mode.handle.includes('n')) {
        const maxDy = ib.height - 16;
        const clampedDy = Math.min(dy, maxDy);
        newY = ib.y + clampedDy;
        newH = ib.height - clampedDy;
      }

      const scaleX = ib.width > 0 ? newW / ib.width : 1;
      const scaleY = ib.height > 0 ? newH / ib.height : 1;

      const changed: BoardElement[] = [];
      const next = elementsRef.current.map((el) => {
        const snap = mode.initialSnapshots.get(el.id);
        if (!snap) return el;

        let updated: BoardElement;
        if (snap.points) {
          updated = {
            ...snap,
            points: snap.points.map((p) => ({
              x: newX + (p.x - ib.x) * scaleX,
              y: newY + (p.y - ib.y) * scaleY,
            })),
            updatedAt: Date.now(),
          };
        } else {
          const sb = getElementBounds(snap);
          updated = {
            ...snap,
            x: newX + (sb.x - ib.x) * scaleX,
            y: newY + (sb.y - ib.y) * scaleY,
            width: Math.max(16, sb.width * scaleX),
            height: Math.max(16, sb.height * scaleY),
            updatedAt: Date.now(),
          };
        }
        changed.push(updated);
        return updated;
      });
      onCommitElements(next, changed, [], false);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }

    const mode = interactionRef.current;
    interactionRef.current = { type: 'none' };

    if (mode.type === 'place_text') {
      const rect = canvas?.getBoundingClientRect();
      const worldPt = rect
        ? screenToWorld(e.clientX - rect.left, e.clientY - rect.top, camera)
        : mode.startWorld;
      const sortedTopFirst = [...elementsRef.current].sort((a, b) => b.zIndex - a.zIndex);
      const existingText = sortedTopFirst.find(
        (el) => el.type === 'text' && !el.locked && hitTestElement(el, worldPt, 8 / camera.zoom)
      );
      if (existingText) {
        onSelectIds([existingText.id]);
        startEditingElement(existingText.id, existingText.text || '');
        return;
      }

      const dragWidth = Math.abs(worldPt.x - mode.startWorld.x);
      const boxX = dragWidth > 24 ? Math.min(mode.startWorld.x, worldPt.x) : mode.startWorld.x;
      const boxW = dragWidth > 24 ? Math.max(140, dragWidth) : 240;

      const newText: BoardElement = {
        id: createId(),
        type: 'text',
        x: boxX,
        y: mode.startWorld.y - (toolStyle.fontSize || 20) * 0.5,
        width: boxW,
        height: 60,
        strokeColor: toolStyle.strokeColor,
        fillColor: 'transparent',
        strokeWidth: 1,
        strokeStyle: 'solid',
        opacity: toolStyle.opacity,
        text: '',
        fontSize: toolStyle.fontSize,
        fontFamily: toolStyle.fontFamily,
        textAlign: toolStyle.textAlign,
        bold: toolStyle.bold,
        italic: toolStyle.italic,
        zIndex: getMaxZIndex() + 1,
        updatedAt: Date.now(),
      };
      const next = [...elementsRef.current, newText];
      onCommitElements(next, [newText], [], true);
      onSelectIds([newText.id]);
      startEditingElement(newText.id, '');
      return;
    }

    if (mode.type === 'place_sticky') {
      const newSticky: BoardElement = {
        id: createId(),
        type: 'sticky',
        x: mode.startWorld.x - 100,
        y: mode.startWorld.y - 80,
        width: 200,
        height: 170,
        strokeColor: '#1E293B',
        fillColor: 'transparent',
        strokeWidth: 1,
        strokeStyle: 'solid',
        opacity: 1,
        text: '',
        fontSize: 19,
        fontFamily: 'hand',
        textAlign: 'left',
        stickyColor: toolStyle.stickyColor,
        zIndex: getMaxZIndex() + 1,
        updatedAt: Date.now(),
      };
      const next = [...elementsRef.current, newSticky];
      onCommitElements(next, [newSticky], [], true);
      onSelectIds([newSticky.id]);
      startEditingElement(newSticky.id, '');
      return;
    }

    if (mode.type === 'draw_freehand') {
      const finalEl = { ...mode.element, updatedAt: Date.now() };
      setDraftElement(null);
      const next = [...elementsRef.current, finalEl];
      onCommitElements(next, [finalEl], [], true);
      return;
    }

    if (mode.type === 'draw_shape') {
      setDraftElement(null);
      let finalEl = normalizeElement({ ...mode.element, updatedAt: Date.now() });

      // Click-to-create default size if user didn't drag
      if (finalEl.type === 'line' || finalEl.type === 'arrow') {
        const pts = finalEl.points || [];
        if (pts.length >= 2 && Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) < 8) {
          finalEl = {
            ...finalEl,
            points: [pts[0], { x: pts[0].x + 140, y: pts[0].y }],
          };
        }
      } else if (finalEl.width < 12 && finalEl.height < 12) {
        finalEl = {
          ...finalEl,
          width: finalEl.type === 'frame' ? 360 : 150,
          height: finalEl.type === 'frame' ? 260 : 100,
        };
      }

      const next = [...elementsRef.current, finalEl];
      onCommitElements(next, [finalEl], [], true);
      onSelectIds([finalEl.id]);
      onSelectTool('select');
      return;
    }

    if (mode.type === 'marquee') {
      const rx = Math.min(mode.startWorld.x, mode.currentWorld.x);
      const ry = Math.min(mode.startWorld.y, mode.currentWorld.y);
      const rw = Math.abs(mode.currentWorld.x - mode.startWorld.x);
      const rh = Math.abs(mode.currentWorld.y - mode.startWorld.y);
      setMarqueeRect(null);

      if (rw > 4 || rh > 4) {
        const rectBounds = { x: rx, y: ry, width: rw, height: rh };
        const hits = elementsRef.current
          .filter((el) => doesElementIntersectRect(el, rectBounds))
          .map((el) => el.id);
        onSelectIds(hits);
      }
      return;
    }

    if (mode.type === 'move' && mode.moved) {
      const changed = elementsRef.current.filter((el) => mode.initialSnapshots.has(el.id));
      onCommitElements(elementsRef.current, changed, [], true);
      return;
    }

    if (mode.type === 'resize') {
      const changed = elementsRef.current.filter((el) => mode.initialSnapshots.has(el.id));
      onCommitElements(elementsRef.current, changed, [], true);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const worldPt = screenToWorld(e.clientX - rect.left, e.clientY - rect.top, camera);
    const sortedTopFirst = [...elementsRef.current].sort((a, b) => b.zIndex - a.zIndex);
    const hit = sortedTopFirst.find((el) => hitTestElement(el, worldPt, 8 / camera.zoom));

    if (
      hit &&
      !hit.locked &&
      ['text', 'sticky', 'rectangle', 'ellipse', 'diamond', 'triangle', 'star', 'frame'].includes(hit.type)
    ) {
      onSelectIds([hit.id]);
      startEditingElement(hit.id, hit.text || '');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const worldPt = screenToWorld(e.clientX - rect.left, e.clientY - rect.top, camera);
        onDropImageFile(file, worldPt);
      } else {
        onDropImageFile(file);
      }
    }
  };

  // Compute active inline textarea overlay position
  const editingEl = editingId ? elements.find((e) => e.id === editingId) : null;
  let editorStyle: React.CSSProperties | null = null;
  if (editingEl) {
    const b = getElementBounds(editingEl);
    const screenTopLeft = worldToScreen(b.x, b.y, camera);
    const screenW = Math.max(140, b.width * camera.zoom);
    const screenH = Math.max(48, b.height * camera.zoom);
    const isFrame = editingEl.type === 'frame';

    editorStyle = {
      left: screenTopLeft.x,
      top: isFrame ? screenTopLeft.y - 30 : screenTopLeft.y,
      width: isFrame ? Math.min(240, screenW) : screenW,
      height: isFrame ? 28 : screenH,
      fontSize: (editingEl.fontSize || (editingEl.type === 'sticky' ? 18 : 16)) * camera.zoom,
      fontFamily:
        editingEl.fontFamily === 'hand'
          ? "'Caveat', cursive"
          : editingEl.fontFamily === 'mono'
          ? "'JetBrains Mono', monospace"
          : "'Plus Jakarta Sans', sans-serif",
      fontWeight: editingEl.bold ? 700 : 500,
      fontStyle: editingEl.italic ? 'italic' : 'normal',
      textAlign: editingEl.type === 'sticky' || editingEl.type === 'text' ? editingEl.textAlign || 'left' : 'center',
      color:
        editingEl.type === 'sticky'
          ? '#1E293B'
          : isFrame
          ? isDark
            ? '#E2E8F0'
            : '#334155'
          : editingEl.strokeColor,
    };
  }

  const cursorClass =
    hoverCursor ||
    (spacePressed || activeTool === 'hand'
      ? 'grab'
      : activeTool === 'select'
      ? 'default'
      : activeTool === 'text'
      ? 'text'
      : 'crosshair');

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="relative w-full h-full overflow-hidden touch-none select-none"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: cursorClass }}
        className="block w-full h-full"
      />

      {editingEl && editorStyle && (
        <textarea
          ref={textareaRef}
          value={editingText}
          onChange={(e) => setEditingText(e.target.value)}
          onBlur={handleTextareaBlur}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              finishTextEditing();
            } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || editingEl.type === 'frame')) {
              e.preventDefault();
              finishTextEditing();
            }
          }}
          placeholder={editingEl.type === 'sticky' ? 'Type a note...' : 'Type text...'}
          style={editorStyle}
          className="fixed z-40 bg-transparent border-2 border-blue-500 rounded-md p-2 resize-none focus:outline-none leading-snug overflow-y-auto"
        />
      )}
    </div>
  );
};
