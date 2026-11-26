import { BoardElement, CameraState, HandleType, Point } from '../types/whiteboard';

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function screenToWorld(screenX: number, screenY: number, camera: CameraState): Point {
  return {
    x: (screenX - camera.x) / camera.zoom,
    y: (screenY - camera.y) / camera.zoom,
  };
}

export function worldToScreen(worldX: number, worldY: number, camera: CameraState): Point {
  return {
    x: worldX * camera.zoom + camera.x,
    y: worldY * camera.zoom + camera.y,
  };
}

export function snapValue(val: number, gridSize = 20, enabled = false): number {
  if (!enabled) return val;
  return Math.round(val / gridSize) * gridSize;
}

export function getElementBounds(el: BoardElement): Bounds {
  if ((el.type === 'pen' || el.type === 'highlighter') && el.points && el.points.length > 0) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of el.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const pad = Math.max(4, el.strokeWidth / 2);
    return {
      x: minX - pad,
      y: minY - pad,
      width: Math.max(12, maxX - minX + pad * 2),
      height: Math.max(12, maxY - minY + pad * 2),
    };
  }

  if ((el.type === 'line' || el.type === 'arrow') && el.points && el.points.length >= 2) {
    const p1 = el.points[0];
    const p2 = el.points[1];
    const minX = Math.min(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxX = Math.max(p1.x, p2.x);
    const maxY = Math.max(p1.y, p2.y);
    return {
      x: minX,
      y: minY,
      width: Math.max(4, maxX - minX),
      height: Math.max(4, maxY - minY),
    };
  }

  const x = el.width < 0 ? el.x + el.width : el.x;
  const y = el.height < 0 ? el.y + el.height : el.y;
  return {
    x,
    y,
    width: Math.abs(el.width),
    height: Math.abs(el.height),
  };
}

export function getMultiBounds(elements: BoardElement[]): Bounds | null {
  if (elements.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const el of elements) {
    const b = getElementBounds(el);
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

export function hitTestElement(el: BoardElement, point: Point, tolerance = 8): boolean {
  if ((el.type === 'pen' || el.type === 'highlighter') && el.points && el.points.length > 0) {
    const tol = Math.max(tolerance, el.strokeWidth / 2 + 5);
    if (el.points.length === 1) {
      return Math.hypot(point.x - el.points[0].x, point.y - el.points[0].y) <= tol;
    }
    for (let i = 0; i < el.points.length - 1; i++) {
      if (distanceToSegment(point, el.points[i], el.points[i + 1]) <= tol) {
        return true;
      }
    }
    return false;
  }

  if ((el.type === 'line' || el.type === 'arrow') && el.points && el.points.length >= 2) {
    const tol = Math.max(tolerance, el.strokeWidth / 2 + 6);
    return distanceToSegment(point, el.points[0], el.points[1]) <= tol;
  }

  const b = getElementBounds(el);

  if (el.type === 'frame') {
    // Hit frame on border or top title tab so items inside can be selected easily
    const inOuter =
      point.x >= b.x - tolerance &&
      point.x <= b.x + b.width + tolerance &&
      point.y >= b.y - 28 &&
      point.y <= b.y + b.height + tolerance;
    if (!inOuter) return false;
    const onTitle = point.y <= b.y + 8 && point.x <= b.x + Math.min(b.width, 220);
    const onBorder =
      point.x <= b.x + tolerance * 1.5 ||
      point.x >= b.x + b.width - tolerance * 1.5 ||
      point.y <= b.y + tolerance * 1.5 ||
      point.y >= b.y + b.height - tolerance * 1.5;
    return onTitle || onBorder;
  }

  if (el.type === 'ellipse') {
    const rx = b.width / 2 + tolerance;
    const ry = b.height / 2 + tolerance;
    const cx = b.x + b.width / 2;
    const cy = b.y + b.height / 2;
    if (rx <= 0 || ry <= 0) return false;
    const norm = ((point.x - cx) ** 2) / (rx ** 2) + ((point.y - cy) ** 2) / (ry ** 2);
    return norm <= 1;
  }

  return (
    point.x >= b.x - tolerance &&
    point.x <= b.x + b.width + tolerance &&
    point.y >= b.y - tolerance &&
    point.y <= b.y + b.height + tolerance
  );
}

export function doesElementIntersectRect(el: BoardElement, rect: Bounds): boolean {
  const b = getElementBounds(el);
  return !(
    b.x + b.width < rect.x ||
    b.x > rect.x + rect.width ||
    b.y + b.height < rect.y ||
    b.y > rect.y + rect.height
  );
}

export function getResizeHandles(bounds: Bounds, zoom: number): { type: HandleType; x: number; y: number }[] {
  const { x, y, width, height } = bounds;
  const pad = 4 / zoom;
  const bx = x - pad;
  const by = y - pad;
  const bw = width + pad * 2;
  const bh = height + pad * 2;

  return [
    { type: 'nw', x: bx, y: by },
    { type: 'n', x: bx + bw / 2, y: by },
    { type: 'ne', x: bx + bw, y: by },
    { type: 'e', x: bx + bw, y: by + bh / 2 },
    { type: 'se', x: bx + bw, y: by + bh },
    { type: 's', x: bx + bw / 2, y: by + bh },
    { type: 'sw', x: bx, y: by + bh },
    { type: 'w', x: bx, y: by + bh / 2 },
  ];
}

export function hitTestHandle(
  elOrBounds: BoardElement | Bounds,
  point: Point,
  zoom: number,
  singleLineElement?: BoardElement
): HandleType | null {
  const radius = 9 / zoom;

  if (singleLineElement && (singleLineElement.type === 'line' || singleLineElement.type === 'arrow') && singleLineElement.points && singleLineElement.points.length >= 2) {
    const [p1, p2] = singleLineElement.points;
    if (Math.hypot(point.x - p1.x, point.y - p1.y) <= radius) return 'start';
    if (Math.hypot(point.x - p2.x, point.y - p2.y) <= radius) return 'end';
    return null;
  }

  const bounds = 'type' in elOrBounds ? getElementBounds(elOrBounds) : elOrBounds;
  const handles = getResizeHandles(bounds, zoom);
  for (const h of handles) {
    if (Math.hypot(point.x - h.x, point.y - h.y) <= radius) {
      return h.type;
    }
  }
  return null;
}

export function normalizeElement(el: BoardElement): BoardElement {
  if (el.type === 'line' || el.type === 'arrow' || el.type === 'pen' || el.type === 'highlighter') {
    return el;
  }
  const x = el.width < 0 ? el.x + el.width : el.x;
  const y = el.height < 0 ? el.y + el.height : el.y;
  const width = Math.abs(el.width);
  const height = Math.abs(el.height);
  return { ...el, x, y, width, height };
}
