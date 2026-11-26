import {
  BoardElement,
  CameraState,
  Collaborator,
  FontFamily,
  GridMode,
  LaserPoint,
  Point,
  StrokeStyle,
} from '../types/whiteboard';
import { Bounds, getElementBounds, getMultiBounds, getResizeHandles } from './canvasMath';

const imageCache = new Map<string, HTMLImageElement>();

export function getCachedImage(src: string, onLoad?: () => void): HTMLImageElement | null {
  if (!src) return null;
  let img = imageCache.get(src);
  if (!img) {
    img = new Image();
    img.onload = () => {
      if (onLoad) onLoad();
    };
    img.src = src;
    imageCache.set(src, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

function getFontString(
  family: FontFamily = 'sans',
  size = 16,
  bold = false,
  italic = false
): string {
  const fontMap: Record<FontFamily, string> = {
    sans: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    hand: "'Caveat', cursive, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  };
  const weight = bold ? '700' : family === 'hand' ? '600' : '500';
  const style = italic ? 'italic ' : '';
  return `${style}${weight} ${size}px ${fontMap[family]}`;
}

function applyStrokeStyle(ctx: CanvasRenderingContext2D, style: StrokeStyle, width: number) {
  if (style === 'dashed') {
    ctx.setLineDash([Math.max(8, width * 3), Math.max(6, width * 2)]);
  } else if (style === 'dotted') {
    ctx.setLineDash([Math.max(2, width * 0.8), Math.max(5, width * 2)]);
  } else {
    ctx.setLineDash([]);
  }
}

export function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text) return [];
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    if (para === '') {
      lines.push('');
      continue;
    }
    const words = para.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width <= maxWidth || !currentLine) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }
  return lines;
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  camera: CameraState,
  gridMode: GridMode,
  isDark: boolean
) {
  ctx.fillStyle = isDark ? '#0B1120' : '#F8FAFC';
  ctx.fillRect(0, 0, width, height);

  if (gridMode === 'none') return;

  const baseStep = 24;
  let step = baseStep;
  while (step * camera.zoom < 12) step *= 2;
  while (step * camera.zoom > 80) step /= 2;

  const worldLeft = -camera.x / camera.zoom;
  const worldTop = -camera.y / camera.zoom;
  const worldRight = worldLeft + width / camera.zoom;
  const worldBottom = worldTop + height / camera.zoom;

  const startX = Math.floor(worldLeft / step) * step;
  const startY = Math.floor(worldTop / step) * step;

  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);

  if (gridMode === 'dots') {
    ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(100, 116, 139, 0.28)';
    const r = Math.max(0.9, 1.35 / Math.sqrt(camera.zoom));
    for (let x = startX; x <= worldRight; x += step) {
      for (let y = startY; y <= worldBottom; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (gridMode === 'grid') {
    ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.09)' : 'rgba(100, 116, 139, 0.12)';
    ctx.lineWidth = 1 / camera.zoom;
    ctx.beginPath();
    for (let x = startX; x <= worldRight; x += step) {
      ctx.moveTo(x, worldTop);
      ctx.lineTo(x, worldBottom);
    }
    for (let y = startY; y <= worldBottom; y += step) {
      ctx.moveTo(worldLeft, y);
      ctx.lineTo(worldRight, y);
    }
    ctx.stroke();

    // Major grid every 4 steps
    const majorStep = step * 4;
    const majorStartX = Math.floor(worldLeft / majorStep) * majorStep;
    const majorStartY = Math.floor(worldTop / majorStep) * majorStep;
    ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(100, 116, 139, 0.22)';
    ctx.beginPath();
    for (let x = majorStartX; x <= worldRight; x += majorStep) {
      ctx.moveTo(x, worldTop);
      ctx.lineTo(x, worldBottom);
    }
    for (let y = majorStartY; y <= worldBottom; y += majorStep) {
      ctx.moveTo(worldLeft, y);
      ctx.lineTo(worldRight, y);
    }
    ctx.stroke();
  } else if (gridMode === 'lines') {
    const lineStep = step * 1.5;
    const lineStartY = Math.floor(worldTop / lineStep) * lineStep;
    ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(59, 130, 246, 0.14)';
    ctx.lineWidth = 1 / camera.zoom;
    ctx.beginPath();
    for (let y = lineStartY; y <= worldBottom; y += lineStep) {
      ctx.moveTo(worldLeft, y);
      ctx.lineTo(worldRight, y);
    }
    ctx.stroke();
  }

  ctx.restore();
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  strokeWidth: number
) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const headLen = Math.max(11, strokeWidth * 3.2);
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - headLen * Math.cos(angle - Math.PI / 6.5),
    to.y - headLen * Math.sin(angle - Math.PI / 6.5)
  );
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - headLen * Math.cos(angle + Math.PI / 6.5),
    to.y - headLen * Math.sin(angle + Math.PI / 6.5)
  );
  ctx.stroke();
}

function drawStarPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerRx: number,
  outerRy: number
) {
  const spikes = 5;
  const innerRatio = 0.44;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const rX = i % 2 === 0 ? outerRx : outerRx * innerRatio;
    const rY = i % 2 === 0 ? outerRy : outerRy * innerRatio;
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const px = cx + Math.cos(angle) * rX;
    const py = cy + Math.sin(angle) * rY;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function drawElement(
  ctx: CanvasRenderingContext2D,
  el: BoardElement,
  isDark: boolean,
  onImageLoad?: () => void,
  isEditingThisText = false
) {
  ctx.save();
  const baseOpacity = el.opacity ?? 1;
  ctx.globalAlpha = el.type === 'highlighter' ? Math.min(0.42, baseOpacity * 0.42) : baseOpacity;

  if ((el.type === 'pen' || el.type === 'highlighter') && el.points && el.points.length > 0) {
    ctx.strokeStyle = el.strokeColor;
    ctx.lineWidth = el.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    applyStrokeStyle(ctx, el.strokeStyle, el.strokeWidth);

    ctx.beginPath();
    const pts = el.points;
    if (pts.length === 1) {
      ctx.arc(pts[0].x, pts[0].y, el.strokeWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = el.strokeColor;
      ctx.fill();
    } else {
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const midX = (pts[i].x + pts[i + 1].x) / 2;
        const midY = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
      }
      const last = pts[pts.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if ((el.type === 'line' || el.type === 'arrow') && el.points && el.points.length >= 2) {
    const [p1, p2] = el.points;
    ctx.strokeStyle = el.strokeColor;
    ctx.lineWidth = el.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    applyStrokeStyle(ctx, el.strokeStyle, el.strokeWidth);

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    if (el.type === 'arrow') {
      ctx.setLineDash([]);
      drawArrowHead(ctx, p1, p2, el.strokeWidth);
      if (el.doubleArrow) {
        drawArrowHead(ctx, p2, p1, el.strokeWidth);
      }
    }
    ctx.restore();
    return;
  }

  const b = getElementBounds(el);

  if (el.type === 'frame') {
    const frameBg =
      el.fillColor && el.fillColor !== 'transparent'
        ? el.fillColor
        : isDark
        ? 'rgba(30, 41, 59, 0.35)'
        : 'rgba(255, 255, 255, 0.55)';
    ctx.fillStyle = frameBg;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.width, b.height, 8);
    ctx.fill();

    ctx.strokeStyle = el.strokeColor || (isDark ? '#475569' : '#94A3B8');
    ctx.lineWidth = Math.max(1.5, el.strokeWidth * 0.75);
    applyStrokeStyle(ctx, el.strokeStyle || 'dashed', 2);
    ctx.stroke();

    // Frame header label
    ctx.setLineDash([]);
    const label = el.text || 'Frame';
    ctx.font = getFontString('sans', 13, true, false);
    ctx.fillStyle = isDark ? '#CBD5E1' : '#475569';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(label, b.x + 4, b.y - 6, Math.max(40, b.width - 8));

    ctx.restore();
    return;
  }

  if (el.type === 'sticky') {
    const bg = el.stickyColor || '#FEF08A';
    ctx.save();
    ctx.shadowColor = isDark ? 'rgba(0,0,0,0.45)' : 'rgba(15, 23, 42, 0.12)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.width, b.height, 6);
    ctx.fill();
    ctx.restore();

    // Subtle top tape/border accent
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.width, b.height, 6);
    ctx.stroke();

    // Sticky text
    if (!isEditingThisText && el.text) {
      const fontSize = el.fontSize || 18;
      const family = el.fontFamily || 'hand';
      ctx.font = getFontString(family, fontSize, el.bold, el.italic);
      ctx.fillStyle = '#1E293B';
      const pad = 14;
      const lines = wrapTextLines(ctx, el.text, Math.max(20, b.width - pad * 2));
      const lineHeight = fontSize * 1.32;
      ctx.textBaseline = 'top';
      const align = el.textAlign || 'left';
      ctx.textAlign = align;
      const startY = b.y + pad;
      for (let i = 0; i < lines.length; i++) {
        const ly = startY + i * lineHeight;
        if (ly + lineHeight > b.y + b.height - 6) break;
        const lx =
          align === 'center'
            ? b.x + b.width / 2
            : align === 'right'
            ? b.x + b.width - pad
            : b.x + pad;
        ctx.fillText(lines[i], lx, ly);
      }
    }

    ctx.restore();
    return;
  }

  if (el.type === 'image' && el.imageData) {
    const img = getCachedImage(el.imageData, onImageLoad);
    if (img) {
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.width, b.height, 4);
      ctx.clip();
      ctx.drawImage(img, b.x, b.y, b.width, b.height);
    } else {
      ctx.fillStyle = isDark ? '#1E293B' : '#E2E8F0';
      ctx.fillRect(b.x, b.y, b.width, b.height);
      ctx.strokeStyle = '#94A3B8';
      ctx.strokeRect(b.x, b.y, b.width, b.height);
    }
    ctx.restore();
    return;
  }

  if (el.type === 'text') {
    if (!isEditingThisText && el.text) {
      const fontSize = el.fontSize || 20;
      const family = el.fontFamily || 'sans';
      ctx.font = getFontString(family, fontSize, el.bold, el.italic);
      ctx.fillStyle = el.strokeColor;
      const lines = wrapTextLines(ctx, el.text, Math.max(40, b.width - 8));
      const lineHeight = fontSize * 1.35;
      ctx.textBaseline = 'top';
      const align = el.textAlign || 'left';
      ctx.textAlign = align;
      for (let i = 0; i < lines.length; i++) {
        const lx =
          align === 'center'
            ? b.x + b.width / 2
            : align === 'right'
            ? b.x + b.width - 4
            : b.x + 4;
        ctx.fillText(lines[i], lx, b.y + 4 + i * lineHeight);
      }
    }
    ctx.restore();
    return;
  }

  // Standard geometric shapes
  ctx.strokeStyle = el.strokeColor;
  ctx.lineWidth = el.strokeWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  applyStrokeStyle(ctx, el.strokeStyle, el.strokeWidth);

  ctx.beginPath();
  if (el.type === 'rectangle') {
    const r = Math.min(8, Math.min(b.width, b.height) * 0.15);
    ctx.roundRect(b.x, b.y, b.width, b.height, r);
  } else if (el.type === 'ellipse') {
    ctx.ellipse(
      b.x + b.width / 2,
      b.y + b.height / 2,
      Math.max(1, b.width / 2),
      Math.max(1, b.height / 2),
      0,
      0,
      Math.PI * 2
    );
  } else if (el.type === 'diamond') {
    const cx = b.x + b.width / 2;
    const cy = b.y + b.height / 2;
    ctx.moveTo(cx, b.y);
    ctx.lineTo(b.x + b.width, cy);
    ctx.lineTo(cx, b.y + b.height);
    ctx.lineTo(b.x, cy);
    ctx.closePath();
  } else if (el.type === 'triangle') {
    ctx.moveTo(b.x + b.width / 2, b.y);
    ctx.lineTo(b.x + b.width, b.y + b.height);
    ctx.lineTo(b.x, b.y + b.height);
    ctx.closePath();
  } else if (el.type === 'star') {
    drawStarPath(ctx, b.x + b.width / 2, b.y + b.height / 2, b.width / 2, b.height / 2);
  }

  if (el.fillColor && el.fillColor !== 'transparent') {
    ctx.fillStyle = el.fillColor;
    ctx.fill();
  }
  if (el.strokeWidth > 0) {
    ctx.stroke();
  }

  // Optional label inside shape
  if (!isEditingThisText && el.text) {
    ctx.setLineDash([]);
    const fontSize = el.fontSize || 15;
    const family = el.fontFamily || 'sans';
    ctx.font = getFontString(family, fontSize, el.bold, el.italic);
    ctx.fillStyle = el.strokeColor;
    const pad = 12;
    const lines = wrapTextLines(ctx, el.text, Math.max(24, b.width - pad * 2));
    const lineHeight = fontSize * 1.3;
    const totalH = lines.length * lineHeight;
    const startY = b.y + (b.height - totalH) / 2;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], b.x + b.width / 2, startY + i * lineHeight);
    }
  }

  ctx.restore();
}

export function drawSelectionOverlay(
  ctx: CanvasRenderingContext2D,
  selectedElements: BoardElement[],
  camera: CameraState,
  marqueeRect: Bounds | null
) {
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);

  // Marquee drag box
  if (marqueeRect) {
    ctx.fillStyle = 'rgba(37, 99, 235, 0.08)';
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 1.5 / camera.zoom;
    ctx.fillRect(marqueeRect.x, marqueeRect.y, marqueeRect.width, marqueeRect.height);
    ctx.strokeRect(marqueeRect.x, marqueeRect.y, marqueeRect.width, marqueeRect.height);
  }

  if (selectedElements.length > 0) {
    // Individual subtle outlines for multi-select
    if (selectedElements.length > 1) {
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.45)';
      ctx.lineWidth = 1 / camera.zoom;
      for (const el of selectedElements) {
        const b = getElementBounds(el);
        ctx.strokeRect(b.x, b.y, b.width, b.height);
      }
    }

    // Single line/arrow endpoints
    if (
      selectedElements.length === 1 &&
      (selectedElements[0].type === 'line' || selectedElements[0].type === 'arrow') &&
      selectedElements[0].points &&
      selectedElements[0].points.length >= 2
    ) {
      const [p1, p2] = selectedElements[0].points;
      const r = 5.5 / camera.zoom;
      for (const pt of [p1, p2]) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 2 / camera.zoom;
        ctx.strokeStyle = '#2563EB';
        ctx.stroke();
      }
    } else {
      const bounds = getMultiBounds(selectedElements);
      if (bounds) {
        const pad = 4 / camera.zoom;
        const bx = bounds.x - pad;
        const by = bounds.y - pad;
        const bw = bounds.width + pad * 2;
        const bh = bounds.height + pad * 2;

        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = 1.5 / camera.zoom;
        ctx.strokeRect(bx, by, bw, bh);

        const allLocked = selectedElements.every((e) => e.locked);
        if (!allLocked) {
          const handles = getResizeHandles(bounds, camera.zoom);
          const hs = 8 / camera.zoom;
          for (const h of handles) {
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#2563EB';
            ctx.lineWidth = 1.5 / camera.zoom;
            ctx.fillRect(h.x - hs / 2, h.y - hs / 2, hs, hs);
            ctx.strokeRect(h.x - hs / 2, h.y - hs / 2, hs, hs);
          }
        }
      }
    }
  }

  ctx.restore();
}

export function drawLaserTrails(
  ctx: CanvasRenderingContext2D,
  points: LaserPoint[],
  camera: CameraState,
  now: number
) {
  if (points.length === 0) return;
  const maxAge = 1350;

  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    if (prev.strokeId !== curr.strokeId) continue;

    const age = now - curr.time;
    if (age > maxAge) continue;
    const life = 1 - age / maxAge;

    ctx.strokeStyle = curr.color || '#EF4444';
    ctx.globalAlpha = life * 0.85;
    ctx.lineWidth = (4.5 * life + 1.5) / Math.sqrt(camera.zoom);

    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(curr.x, curr.y);
    ctx.stroke();
  }

  // Glowing tip on newest active point
  const latest = points[points.length - 1];
  if (latest && now - latest.time < 350) {
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = latest.color || '#EF4444';
    ctx.beginPath();
    ctx.arc(latest.x, latest.y, 5 / Math.sqrt(camera.zoom), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawCollaborators(
  ctx: CanvasRenderingContext2D,
  collaborators: Collaborator[],
  camera: CameraState
) {
  if (collaborators.length === 0) return;

  ctx.save();
  for (const user of collaborators) {
    if (!user.cursor) continue;
    const sx = user.cursor.x * camera.zoom + camera.x;
    const sy = user.cursor.y * camera.zoom + camera.y;

    ctx.save();
    ctx.translate(sx, sy);

    // Pointer triangle
    ctx.fillStyle = user.color || '#2563EB';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 16);
    ctx.lineTo(5, 12);
    ctx.lineTo(11, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Name tag
    ctx.font = "600 11px 'Plus Jakarta Sans', sans-serif";
    const textWidth = ctx.measureText(user.name).width;
    const tagW = textWidth + 14;
    const tagH = 20;
    ctx.fillStyle = user.color || '#2563EB';
    ctx.beginPath();
    ctx.roundRect(10, 14, tagW, tagH, 4);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(user.name, 17, 14 + tagH / 2);

    ctx.restore();
  }
  ctx.restore();
}
