import { BoardElement, GridMode } from '../types/whiteboard';
import { getElementBounds, getMultiBounds } from './canvasMath';
import { drawElement, drawGrid } from './canvasRenderer';

function sanitizeFilename(name: string): string {
  return (name || 'whiteboard')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'whiteboard';
}

export function exportBoardAsPNG(
  elements: BoardElement[],
  isDark: boolean,
  gridMode: GridMode,
  boardTitle: string
) {
  const padding = 64;
  const bounds = getMultiBounds(elements) || { x: 0, y: 0, width: 1200, height: 800 };
  const width = Math.max(400, Math.ceil(bounds.width + padding * 2));
  const height = Math.max(300, Math.ceil(bounds.height + padding * 2));
  const scale = 2;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(scale, scale);

  const camera = {
    x: -bounds.x + padding,
    y: -bounds.y + padding,
    zoom: 1,
  };

  drawGrid(ctx, width, height, camera, gridMode, isDark);

  ctx.save();
  ctx.translate(camera.x, camera.y);
  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  for (const el of sorted) {
    drawElement(ctx, el, isDark);
  }
  ctx.restore();

  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(boardTitle)}.png`;
  a.click();
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function exportBoardAsSVG(
  elements: BoardElement[],
  isDark: boolean,
  boardTitle: string
) {
  const padding = 48;
  const bounds = getMultiBounds(elements) || { x: 0, y: 0, width: 1200, height: 800 };
  const width = Math.max(400, Math.ceil(bounds.width + padding * 2));
  const height = Math.max(300, Math.ceil(bounds.height + padding * 2));
  const ox = -bounds.x + padding;
  const oy = -bounds.y + padding;
  const bg = isDark ? '#0B1120' : '#F8FAFC';

  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  const parts: string[] = [];

  for (const el of sorted) {
    const opacity = el.type === 'highlighter' ? Math.min(0.42, el.opacity * 0.42) : el.opacity;
    const dash =
      el.strokeStyle === 'dashed'
        ? `stroke-dasharray="${Math.max(8, el.strokeWidth * 3)} ${Math.max(6, el.strokeWidth * 2)}"`
        : el.strokeStyle === 'dotted'
        ? `stroke-dasharray="${Math.max(2, el.strokeWidth * 0.8)} ${Math.max(5, el.strokeWidth * 2)}"`
        : '';

    if ((el.type === 'pen' || el.type === 'highlighter') && el.points && el.points.length > 0) {
      const pts = el.points.map((p) => `${(p.x + ox).toFixed(1)},${(p.y + oy).toFixed(1)}`);
      const d = `M ${pts.join(' L ')}`;
      parts.push(
        `<path d="${d}" fill="none" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" ${dash} />`
      );
      continue;
    }

    if ((el.type === 'line' || el.type === 'arrow') && el.points && el.points.length >= 2) {
      const [p1, p2] = el.points;
      const x1 = p1.x + ox;
      const y1 = p1.y + oy;
      const x2 = p2.x + ox;
      const y2 = p2.y + oy;
      parts.push(
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" stroke-linecap="round" opacity="${opacity}" ${dash} />`
      );
      if (el.type === 'arrow') {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const len = Math.max(11, el.strokeWidth * 3.2);
        const ax1 = x2 - len * Math.cos(angle - Math.PI / 6.5);
        const ay1 = y2 - len * Math.sin(angle - Math.PI / 6.5);
        const ax2 = x2 - len * Math.cos(angle + Math.PI / 6.5);
        const ay2 = y2 - len * Math.sin(angle + Math.PI / 6.5);
        parts.push(
          `<path d="M ${ax1} ${ay1} L ${x2} ${y2} L ${ax2} ${ay2}" fill="none" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" stroke-linecap="round" opacity="${opacity}" />`
        );
      }
      continue;
    }

    const b = getElementBounds(el);
    const x = b.x + ox;
    const y = b.y + oy;

    if (el.type === 'sticky') {
      parts.push(
        `<rect x="${x}" y="${y}" width="${b.width}" height="${b.height}" rx="6" fill="${el.stickyColor || '#FEF08A'}" stroke="rgba(15,23,42,0.1)" opacity="${opacity}" />`
      );
      if (el.text) {
        parts.push(
          `<text x="${x + 14}" y="${y + 28}" fill="#1E293B" font-size="${el.fontSize || 18}" font-family="sans-serif">${escapeXml(el.text)}</text>`
        );
      }
      continue;
    }

    if (el.type === 'text' && el.text) {
      parts.push(
        `<text x="${x + 4}" y="${y + (el.fontSize || 20)}" fill="${el.strokeColor}" font-size="${el.fontSize || 20}" font-family="sans-serif" opacity="${opacity}">${escapeXml(el.text)}</text>`
      );
      continue;
    }

    if (el.type === 'image' && el.imageData) {
      parts.push(
        `<image x="${x}" y="${y}" width="${b.width}" height="${b.height}" href="${el.imageData}" opacity="${opacity}" />`
      );
      continue;
    }

    const fill = el.fillColor && el.fillColor !== 'transparent' ? el.fillColor : 'none';
    if (el.type === 'rectangle' || el.type === 'frame') {
      parts.push(
        `<rect x="${x}" y="${y}" width="${b.width}" height="${b.height}" rx="8" fill="${fill}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" opacity="${opacity}" ${dash} />`
      );
    } else if (el.type === 'ellipse') {
      parts.push(
        `<ellipse cx="${x + b.width / 2}" cy="${y + b.height / 2}" rx="${b.width / 2}" ry="${b.height / 2}" fill="${fill}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" opacity="${opacity}" ${dash} />`
      );
    } else if (el.type === 'diamond') {
      const pts = `${x + b.width / 2},${y} ${x + b.width},${y + b.height / 2} ${x + b.width / 2},${y + b.height} ${x},${y + b.height / 2}`;
      parts.push(
        `<polygon points="${pts}" fill="${fill}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" opacity="${opacity}" ${dash} />`
      );
    } else if (el.type === 'triangle') {
      const pts = `${x + b.width / 2},${y} ${x + b.width},${y + b.height} ${x},${y + b.height}`;
      parts.push(
        `<polygon points="${pts}" fill="${fill}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" opacity="${opacity}" ${dash} />`
      );
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="${bg}" />
  ${parts.join('\n  ')}
</svg>`;

  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(boardTitle)}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportBoardAsJSON(elements: BoardElement[], boardTitle: string) {
  const payload = {
    app: 'BoardCraft',
    version: 1,
    boardTitle,
    exportedAt: new Date().toISOString(),
    elements,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(boardTitle)}.boardcraft.json`;
  a.click();
  URL.revokeObjectURL(url);
}
