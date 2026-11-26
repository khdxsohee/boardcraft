export type ToolType =
  | 'select'
  | 'hand'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'triangle'
  | 'star'
  | 'line'
  | 'arrow'
  | 'text'
  | 'sticky'
  | 'frame'
  | 'laser';

export type ElementType =
  | 'pen'
  | 'highlighter'
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'triangle'
  | 'star'
  | 'line'
  | 'arrow'
  | 'text'
  | 'sticky'
  | 'frame'
  | 'image';

export type StrokeStyle = 'solid' | 'dashed' | 'dotted';
export type FontFamily = 'sans' | 'hand' | 'mono';
export type TextAlign = 'left' | 'center' | 'right';
export type GridMode = 'dots' | 'grid' | 'lines' | 'none';

export interface Point {
  x: number;
  y: number;
}

export interface BoardElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  points?: Point[];
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  opacity: number;
  text?: string;
  fontSize?: number;
  fontFamily?: FontFamily;
  textAlign?: TextAlign;
  bold?: boolean;
  italic?: boolean;
  stickyColor?: string;
  doubleArrow?: boolean;
  imageData?: string;
  locked?: boolean;
  zIndex: number;
  updatedAt: number;
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  cursor?: Point;
}

export interface LaserPoint {
  x: number;
  y: number;
  time: number;
  color: string;
  strokeId: string;
}

export interface ToolStyleConfig {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  opacity: number;
  fontSize: number;
  fontFamily: FontFamily;
  textAlign: TextAlign;
  bold: boolean;
  italic: boolean;
  stickyColor: string;
  doubleArrow: boolean;
}

export type HandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'start' | 'end';
