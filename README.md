<div align="center">
<img width="90" alt="boardcraft" src="https://github.com/user-attachments/assets/308d4939-f320-4e65-bf13-92e400ec2e6c" />

# BoardCraft

**An infinite, real-time collaborative digital whiteboard for sketching, diagramming, brainstorming, and presenting.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Open_BoardCraft-2563EB?style=for-the-badge&logo=googlechrome&logoColor=FFFFFF)](https://your-live-demo-url.com)
[![Download Windows .exe](https://img.shields.io/badge/Download-Windows_.exe-059669?style=for-the-badge&logo=windows&logoColor=FFFFFF)](https://github.com/khdxsohee/boardcraft/releases/latest/download/BoardCraft-Setup.exe)
[![GitHub Release](https://img.shields.io/github/v/release/khdxsohee/boardcraft?style=for-the-badge&color=072957&label=Latest%20Release)](https://github.com/khdxsohee/boardcraft/releases)

[![GitHub Repo](https://img.shields.io/badge/GitHub-khdxsohee%2Fboardcraft-181717?style=for-the-badge&logo=github)](https://github.com/khdxsohee/boardcraft)
[![GitHub Stars](https://img.shields.io/github/stars/khdxsohee/boardcraft?style=for-the-badge&color=2563EB)](https://github.com/khdxsohee/boardcraft/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/khdxsohee/boardcraft?style=for-the-badge&color=D97706)](https://github.com/khdxsohee/boardcraft/issues)
[![GitHub Last Commit](https://img.shields.io/github/last-commit/khdxsohee/boardcraft?style=for-the-badge&color=059669)](https://github.com/khdxsohee/boardcraft/commits)

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=000000)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6?style=flat-square&logo=typescript&logoColor=FFFFFF)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=FFFFFF)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=flat-square&logo=vite&logoColor=FFFFFF)](https://vite.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express&logoColor=FFFFFF)](https://expressjs.com/)
[![WebSockets](https://img.shields.io/badge/WebSockets-ws-2563EB?style=flat-square&logo=socketdotio&logoColor=FFFFFF)](https://github.com/websockets/ws)
[![PWA Offline](https://img.shields.io/badge/PWA-Offline_Ready-072957?style=flat-square&logo=pwa&logoColor=FFFFFF)](#getting-started)
[![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas_2D-E34F26?style=flat-square&logo=html5&logoColor=FFFFFF)](#project-architecture)

[Live Demo](#live-demo) • [Download](#download) • [Screenshots](#screenshots) • [Features](#key-features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [Collaboration](#real-time-collaboration) • [Shortcuts](#keyboard-shortcuts)

</div>

---

**BoardCraft** is a full-featured, real-time collaborative digital whiteboard application built with React, TypeScript, HTML5 Canvas, Tailwind CSS, Express, and WebSockets. It provides an infinite high-DPI canvas for sketching, diagramming, brainstorming, wireframing, and presenting—complete with instant local auto-saving, starter templates, vector/raster/JSON exports, and zero-signup live multiplayer rooms.

---

## Table of Contents

- [Live Demo](#live-demo)
- [Download](#download)
- [Screenshots](#screenshots)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Directory & File Structure](#directory--file-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Development](#installation--development)
  - [Production Build & Deployment](#production-build--deployment)
  - [Environment Variables](#environment-variables)
- [Tools & Canvas Capabilities](#tools--canvas-capabilities)
  - [Drawing & Annotation Tools](#drawing--annotation-tools)
  - [Shapes, Connectors & Containers](#shapes-connectors--containers)
  - [Text, Sticky Notes & Images](#text-sticky-notes--images)
  - [Selection, Manipulation & Layering](#selection-manipulation--layering)
  - [Viewport, Grid & Snapping](#viewport-grid--snapping)
  - [Presentation Mode & Laser Pointer](#presentation-mode--laser-pointer)
- [Properties Inspector](#properties-inspector)
- [Starter Templates](#starter-templates)
- [Real-Time Collaboration](#real-time-collaboration)
  - [How Live Rooms Work](#how-live-rooms-work)
  - [WebSocket Protocol Reference](#websocket-protocol-reference)
- [Persistence, Import & Export](#persistence-import--export)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Data Model](#data-model)
- [API Endpoints](#api-endpoints)
- [Known Scope & Limitations](#known-scope--limitations)
- [Repository & Contributing](#repository--contributing)

---

## Live Demo

Try **BoardCraft** instantly in your browser—complete with infinite canvas drawing, templates, export tools, live collaboration, and offline PWA support:

[![Launch Live Demo](https://img.shields.io/badge/▶_Launch_Live_Demo-Open_BoardCraft-2563EB?style=for-the-badge&logo=googlechrome&logoColor=FFFFFF)](https://your-live-demo-url.com)

> *Replace `https://your-live-demo-url.com` above (and in the top hero badge) with your deployed live URL.*

---

## Download

Download the standalone Windows desktop installer (`.exe`) directly from GitHub Releases—clicking the button below starts the download immediately:

[![Download BoardCraft .exe](https://img.shields.io/badge/⬇_Download_BoardCraft-Windows_.exe-059669?style=for-the-badge&logo=windows&logoColor=FFFFFF)](https://github.com/khdxsohee/boardcraft/releases/latest/download/BoardCraft-Setup.exe)
[![All Releases](https://img.shields.io/badge/View_All_Releases-GitHub_Releases-181717?style=for-the-badge&logo=github)](https://github.com/khdxsohee/boardcraft/releases)

> *Make sure your uploaded release asset filename matches `BoardCraft-Setup.exe` (or replace the URL above with the direct `.exe` asset link from your GitHub Release).*

---

## Screenshots

<img width="1896" height="830" alt="image" src="https://github.com/user-attachments/assets/30efc64f-0f7f-4f98-8a0c-d95e94938fa4" />


---

## Key Features

- **Infinite High-DPI Canvas**: Crisp rendering across Retina/HiDPI displays using `window.devicePixelRatio` scaling, smooth `requestAnimationFrame` render loops, and unconstrained pan & zoom (`15%` to `400%`).
- **Complete Toolset**: Select/marquee, Hand pan, Pen, Highlighter, Object Eraser, 5 geometric shapes (Rectangle, Ellipse, Diamond, Triangle, 5-point Star), Line, Arrow (single & double-headed), Text, Sticky Notes, Frames, Images, and Laser Pointer.
- **Real-Time Multiplayer Collaboration**: Built-in Node.js WebSocket server (`/ws`) supporting room-based sessions via shareable `?room=<id>` links, live cursor tracking with color-coded name badges, live laser trails, automatic reconnection, and instant state synchronization.
- **Rich Styling & Properties Inspector**: Context-aware inspector for stroke color, custom hex color pickers, fill color, stroke width (`2px`, `4px`, `8px`, `16px`), stroke styles (`solid`, `dashed`, `dotted`), opacity (`15%–100%`), sticky note paper colors, typography (`Sans`, `Hand`, `Mono`, bold, italic, alignment, size), z-index layering, duplication, and element locking.
- **Starter Templates**: Built-in templates for **Kanban Sprint Board**, **Central Mind Map**, **System Architecture Flow**, and **Team Retrospective**—each insertable in either **Add to Board** (append) or **Replace All** mode.
- **Multi-Format Export & Import**: Export boards as high-resolution `2x` **PNG** images (respecting current theme and grid mode), scalable **SVG** vectors, or portable `.boardcraft.json` files, and import `.json` board files back onto the canvas.
- **Local Persistence & Undo/Redo**: Automatic `localStorage` persistence (`boardcraft_local_board_v1`) and a 50-step undo/redo history stack.
- **Light & Dark Themes**: Toggleable Light/Dark board themes with automatic contrast adjustment for default stroke colors and grid lines.
- **Presentation Mode**: Distraction-free view that hides editing chrome and switches directly to Laser Pointer / Hand Pan controls.

---

## Tech Stack

| Layer                    | Technology                       | Version   | Purpose                                                |
| :----------------------- | :------------------------------- | :-------- | :----------------------------------------------------- |
| **Frontend Framework**   | React                            | `19.0.1`  | Component UI & state management                        |
| **Language**             | TypeScript                       | `^7.0.2`  | End-to-end type safety across client & server          |
| **Styling**              | Tailwind CSS + `@tailwindcss/vite` | `^4.3.3` | Utility-first styling with class-based dark mode       |
| **Icons**                | `lucide-react`                   | `^0.546.0` | Crisp UI iconography                                   |
| **Bundler / Dev Server** | Vite                             | `^8.3.0`  | Fast client bundling & dev middleware                  |
| **Backend Server**       | Express                          | `^4.21.2` | HTTP server, health API, SPA serving, Vite integration |
| **Real-Time Transport**  | `ws`                             | `^8.23.0` | WebSocket server for multiplayer rooms                 |
| **TypeScript Runner**    | `tsx`                            | `^4.21.0` | Running `server.ts` directly in development            |

**Typography (via Google Fonts in `index.html`):**
- `Plus Jakarta Sans` — Primary UI and Sans-serif canvas text
- `Caveat` — Handwritten style for Sticky Notes and Hand font mode
- `JetBrains Mono` — Monospace canvas text, zoom readouts, item counters, and shortcut badges

---

## Project Architecture

BoardCraft uses a **unified full-stack Node.js server** (`server.ts`) paired with an **imperative HTML5 2D Canvas engine** inside React:

1. **Unified Server (`server.ts`)**:
   - Attaches an Express app and a `ws` `WebSocketServer` (mounted at `/ws`) to a single `http.Server` on port `3000` (or `process.env.PORT`).
   - In development (`NODE_ENV !== 'production'`), Vite is mounted via `createViteServer({ server: { middlewareMode: true }, appType: 'spa' })`.
   - In production (`NODE_ENV === 'production'`), Express serves static assets from `dist/` and falls back to `dist/index.html` for SPA routing.

2. **Canvas Rendering & Interaction Pipeline**:
   - **State Layer (`App.tsx`)**: Owns canonical `elements`, `selectedIds`, `camera`, `toolStyle`, `gridMode`, `snapToGrid`, `history` (up to 50 snapshots), `laserPoints`, and theme state.
   - **Math & Hit-Testing (`src/utils/canvasMath.ts`)**: Handles `screenToWorld` / `worldToScreen` coordinate transforms, grid snapping, bounding-box calculation (`getElementBounds`, `getMultiBounds`), point-to-segment/ellipse/frame hit-testing (`hitTestElement`), marquee intersection (`doesElementIntersectRect`), and resize handle geometry (`getResizeHandles`, `hitTestHandle`).
   - **Renderer (`src/utils/canvasRenderer.ts`)**: Renders the adaptive grid, quadratic-bezier smoothed freehand paths, geometric shapes, arrowheads, sticky notes with drop shadows and word-wrapped text, frames with header labels, cached images (`getCachedImage`), selection overlays, fading laser trails, and remote collaborator cursors.
   - **Canvas Controller (`src/components/WhiteboardCanvas.tsx`)**: Manages pointer capture, drag state machines (`pan`, `draw_freehand`, `draw_shape`, `marquee`, `move`, `resize`, `erase`, `laser`), wheel pan/zoom, image drag-and-drop, and inline `<textarea>` overlays for double-click text editing.

3. **Real-Time Sync Layer (`src/hooks/useCollaboration.ts`)**:
   - Reads/updates the `?room=<roomId>` URL query parameter without reloading the page.
   - Syncs deltas (`element:upsert`, `element:delete`, `board:replace`, `board:meta`) and ephemeral streams (`cursor:move` throttled at 40ms, `laser:point`).

---

## Directory & File Structure

```text
.
├── .env.example                    # Environment variable template (GEMINI_API_KEY, APP_URL)
├── .gitignore                      # Git ignore rules
├── bun.lock                        # Lockfile
├── index.html                      # HTML entry point, metadata, and Google Fonts
├── metadata.json                   # Applet metadata & capability declarations
├── package.json                    # Dependencies and npm scripts
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite & Tailwind CSS v4 configuration
├── server.ts                       # Express HTTP server + WebSocket collaboration server
└── src/
    ├── main.tsx                    # React DOM entry point
    ├── index.css                   # Tailwind import, dark variant, and custom font classes
    ├── App.tsx                     # Root application state, shortcuts, undo/redo, and layout
    ├── types/
    │   └── whiteboard.ts           # Core TypeScript interfaces and union types
    ├── hooks/
    │   └── useCollaboration.ts     # WebSocket client hook for rooms, cursors, and sync
    ├── components/
    │   ├── TopBar.tsx              # Header: title, undo/redo, templates, export/import, clear, present, theme, share
    │   ├── ToolDock.tsx            # Left floating vertical toolbar + shapes flyout + image upload
    │   ├── PropertiesPanel.tsx     # Right floating inspector for styles, typography, opacity, layering, lock
    │   ├── BottomControls.tsx      # Bottom-left grid/snap/help & bottom-right zoom/fit controls
    │   ├── WhiteboardCanvas.tsx    # Interactive HTML5 Canvas engine + inline text editor
    │   ├── TemplatesModal.tsx      # Template picker modal (Append / Replace)
    │   ├── ShareModal.tsx          # Live collaboration modal (display name, room link, participants)
    │   └── ShortcutsModal.tsx      # Keyboard shortcuts reference modal
    └── utils/
        ├── canvasMath.ts           # Coordinate transforms, bounds, snapping, hit-testing, normalization
        ├── canvasRenderer.ts       # Canvas 2D drawing routines for grid, elements, overlays, cursors, laser
        ├── exportUtils.ts          # PNG (2x), SVG, and JSON exporters
        └── templates.ts            # Built-in board template generators
```

---

## Getting Started

### Prerequisites

- **Node.js** `v20+` (recommended for native `tsx` / modern ESM compatibility)
- **npm** (or **bun**)

### Installation & Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/khdxsohee/boardcraft.git
   cd boardcraft
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables (optional):**
   Copy `.env.example` to `.env` if you need custom environment values:
   ```bash
   cp .env.example .env
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   This starts `tsx server.ts` on `http://localhost:3000` (binding to `0.0.0.0:3000`) with Vite middleware for the frontend and WebSocket support at `ws://localhost:3000/ws`.

5. **Type-check the codebase:**
   ```bash
   npm run lint
   ```

### Production Build & Deployment

1. **Build the frontend bundle:**
   ```bash
   npm run build
   ```
   This compiles the Vite React bundle into `dist/` (and copies `src/assets` if present).

2. **Run in production mode:**
   ```bash
   NODE_ENV=production npm start
   ```
   `server.ts` serves static files from `dist/` and handles WebSocket collaboration connections on the same port.

### Environment Variables

| Variable         | Default       | Description                                                               |
| :--------------- | :------------ | :------------------------------------------------------------------------ |
| `PORT`           | `3000`        | Port used by the Express HTTP and WebSocket server                        |
| `NODE_ENV`       | `development` | Set to `production` to serve built assets from `dist/` instead of Vite    |
| `DISABLE_HMR`    | `false`       | When `'true'`, disables Vite HMR and file watching in `vite.config.ts`    |
| `APP_URL`        | `—`           | Public URL where the application is hosted                                |
| `GEMINI_API_KEY` | `—`           | Optional environment key declared in `.env.example`                       |

---

## Tools & Canvas Capabilities

### Drawing & Annotation Tools

- **Pen (`P`)**: Smooth quadratic-curve freehand ink strokes with customizable stroke color, width, dash style (`solid`, `dashed`, `dotted`), and opacity.
- **Highlighter (`M`)**: Semi-transparent broad marker strokes (`opacity` capped at `0.42`, minimum width `18px` or `3x` current stroke width).
- **Object Eraser (`E`)**: Click or drag across unlocked elements to delete them immediately with undo support.

### Shapes, Connectors & Containers

- **Shapes Flyout**:
  - **Rectangle (`R`)** — Rounded corners proportional to dimensions.
  - **Circle / Ellipse (`O`)** — Smooth ellipse; hold `Shift` while dragging to constrain to a circle.
  - **Diamond (`D`)** — Four-point flowchart decision diamond.
  - **Triangle (`G`)** — Isosceles triangle.
  - **Star (`U`)** — 5-point star polygon.
  - *Tip:* Hold **`Shift`** while dragging any shape to lock a `1:1` aspect ratio. Clicking without dragging creates a default `150×100` shape. Double-click any shape to edit centered label text inside it.
- **Connectors**:
  - **Line (`L`)** & **Arrow (`A`)** — Point-to-point connectors with draggable `start` and `end` endpoint handles when selected.
  - Hold **`Shift`** while drawing a line/arrow to snap its angle to `45°` increments.
  - Arrows support a **Double-Headed Arrow** toggle in the Properties Inspector.
- **Frame / Section (`F`)**:
  - Dashed container region (`zIndex: 0` by default) with an editable top header label (`Untitled Frame`).
  - Hit-testing is restricted to the frame border and title tab so elements placed inside a frame can still be clicked and selected directly.

### Text, Sticky Notes & Images

- **Text (`T`)**: Click anywhere to drop an editable text box with live word wrapping, font family (`Sans`, `Hand`, `Mono`), bold/italic, alignment, font size (`12–48px`), and color. Empty text blocks are automatically cleaned up on blur.
- **Sticky Note (`S`)**: Drop a `200×170` soft-shadowed note card with 6 paper presets (**Butter**, **Mint**, **Sky**, **Rose**, **Lavender**, **Peach**), handwritten `Caveat` default typography, and double-click editing.
- **Images**: Insert raster images via three methods:
  1. **Toolbar Upload Button** (`ImagePlus` icon in the left dock)
  2. **Clipboard Paste** (`Ctrl+V` / `Cmd+V`)
  3. **Drag & Drop** an image file directly onto the canvas at the drop coordinates
  - Images are automatically scaled down proportionally to a maximum dimension of `420px` upon insertion and stored as data URLs.

### Selection, Manipulation & Layering

- **Select & Move (`V`)**:
  - Click to select an element; `Shift + Click` to add/remove from multi-selection.
  - Drag on empty canvas space to draw a **marquee selection box**.
  - **8-point bounding-box resize handles** (`nw`, `n`, `ne`, `e`, `se`, `s`, `sw`, `w`) for shapes/notes/images/groups, or **endpoint handles** (`start`, `end`) for single lines/arrows.
- **Layer Ordering & Locking**:
  - **Bring Forward** / **Send Backward** (`zIndex` adjustment).
  - **Duplicate (`Ctrl+D`)**: Clones selected items with a `+28px, +28px` offset and unlocks clones.
  - **Lock / Unlock**: Prevents accidental moving, resizing, text editing, or erasing of locked elements.

### Viewport, Grid & Snapping

- **Panning**: Use the **Hand Tool (`H`)**, hold **`Space + Drag`**, drag with the **Middle Mouse Button**, or scroll with trackpad/wheel (`deltaX` / `deltaY`).
- **Zooming**: `Ctrl / Cmd + Scroll` zooms toward the pointer cursor (`15%` to `400%`). Bottom-right controls provide **Zoom In**, **Zoom Out**, **Reset to 100%**, and **Fit to Content**.
- **Adaptive Grid Modes**: Switch between **Dots**, **Grid** (minor + 4x major lines), **Lines** (notebook rule), and **Blank** (`none`). Grid step spacing adapts dynamically with zoom level.
- **Snap to Grid**: Toggle magnetic `20px` coordinate snapping for shape creation, moving, and connector endpoint resizing.

### Presentation Mode & Laser Pointer

- **Presentation Mode**: Click the Presentation icon in the TopBar to hide the main header, Properties Inspector, and bottom-left grid bar. Only **Hand Pan (`H`)**, **Laser Pointer (`K`)**, Zoom controls, and an **Exit Presentation** pill remain visible. Press `Esc` or click **Exit Presentation** to return to editing.
- **Laser Pointer (`K`)**: Draws glowing red laser trails (`1350ms` fade lifetime) that broadcast in real time to all connected collaborators.

---

## Properties Inspector

The right-hand `PropertiesPanel` dynamically adapts to either the active drawing tool or the currently selected element(s):

- **Note Paper** (Sticky Notes): 6 pastel presets.
- **Stroke / Text Color**: 10 curated swatches plus native `<input type="color">` picker.
- **Fill Color** (Shapes & Frames): `transparent` + 8 curated swatches + native `<input type="color">` picker.
- **Stroke Width**: Quick presets (`2px`, `4px`, `8px`, `16px`).
- **Stroke Style**: `solid`, `dashed`, `dotted`.
- **Double-Headed Arrow**: Toggle on/off for `arrow` elements.
- **Typography** (Text, Sticky Notes, Shapes):
  - Font family: `Sans` (`Plus Jakarta Sans`), `Hand` (`Caveat`), `Mono` (`JetBrains Mono`)
  - Style: `Bold`, `Italic`
  - Alignment: `Left`, `Center`, `Right`
  - Font size slider: `12px` – `48px` (step `2`)
- **Opacity**: Slider from `15%` to `100%` (step `5%`).
- **Arrange & Edit** (when elements are selected): Bring Forward, Send Backward, Duplicate, Delete, and Lock/Unlock toggle.

---

## Starter Templates

Accessible from **Templates** in the TopBar (`TemplatesModal.tsx`):

| Template                     | Category        | Description                                                                            |
| :--------------------------- | :-------------- | :------------------------------------------------------------------------------------- |
| **Kanban Sprint Board**      | Product & Agile | 4 workflow frames (*Backlog*, *In Progress*, *Review*, *Done*) with sticky-note tasks  |
| **Central Mind Map**         | Brainstorming   | Central *Core Concept* ellipse connected via arrows to 4 radial sticky-note branches   |
| **System Architecture Flow** | Engineering     | *Client Request* → *Auth Valid?* decision diamond → *Process & Sync* / *401* blocks    |
| **Team Retrospective**       | Workshops       | 3 column frames (*What Went Well*, *What To Improve*, *Action Items*) with notes       |

Each template supports:
- **Add to Board**: Appends template elements with a `+60px` offset (if the board already has items) and higher `zIndex`.
- **Replace All**: Replaces the entire board and resets the camera to `{ x: 0, y: 0, zoom: 1 }` (available when existing elements are present).

---

## Real-Time Collaboration

### How Live Rooms Work

1. Click **Share** in the TopBar to open the **Live Collaboration** modal.
2. Customize your **Display Name** (persisted in `localStorage` under `boardcraft_username`, default `'Creator'`).
3. Click **Start Live Session** to generate a unique room ID (`room_<random>`) and append `?room=<roomId>` to the browser URL.
4. Share the URL with teammates. Anyone opening that URL automatically connects to `/ws` and joins the room:
   - If the room is newly created and empty, the initiator seeds the room with their current local elements and board title.
   - Joining clients receive the full authoritative `room:state` and active participants list.
   - Disconnected sockets automatically attempt reconnection every `2000ms`.
   - Participant identities use a per-tab `sessionStorage` ID (`boardcraft_userid`) and a randomly assigned color from a 7-color palette.

### WebSocket Protocol Reference

All messages over `/ws` are JSON objects discriminated by `type`:

| Message Type                              | Direction       | Payload Fields                                               | Description                                                        |
| :---------------------------------------- | :-------------- | :----------------------------------------------------------- | :----------------------------------------------------------------- |
| `room:join`                               | Client → Server | `roomId`, `userId`, `name`, `color`, `initialElements?`, `boardTitle?` | Joins/switches room and optionally seeds an empty room   |
| `room:state`                              | Server → Client | `roomId`, `boardTitle`, `elements`, `participants`           | Sends full room snapshot to the newly joined client                |
| `user:joined` / `user:left` / `user:updated` | Server → Room | `user?`, `userId?`, `participants`                           | Updates participant presence list                                  |
| `user:update`                             | Client → Server | `name?`, `color?`                                            | Updates display name or color                                      |
| `element:upsert`                          | Bidirectional   | `elements` (or `element`), `senderId`                        | Inserts or updates one or more `BoardElement` items                |
| `element:delete`                          | Bidirectional   | `ids`, `senderId`                                            | Deletes elements by ID                                             |
| `board:replace`                           | Bidirectional   | `elements`, `senderId`                                       | Replaces entire board state (undo/redo, clear, templates, import)  |
| `board:meta`                              | Bidirectional   | `boardTitle`, `senderId`                                     | Syncs board title changes                                          |
| `cursor:move`                             | Bidirectional   | `cursor: { x, y }`, `userId`, `name`, `color`                | Broadcasts world-space cursor coordinates (40ms client throttle)   |
| `laser:point`                             | Bidirectional   | `point: { x, y, strokeId }`, `userId`, `color`               | Streams temporary laser pointer trail vertices                     |

---

## Persistence, Import & Export

- **Auto-Save (`localStorage`)**:
  - Board state (`{ boardTitle, elements }`) is automatically saved to `localStorage` under `boardcraft_local_board_v1`.
  - Theme preference (`'light'` / `'dark'`) is saved under `boardcraft_theme`.
- **Export as PNG Image**:
  - Renders all elements onto an offscreen `2x` scaled canvas with `64px` padding around content bounds, preserving the active Light/Dark theme and Grid mode (`<sanitized-title>.png`).
- **Export as SVG Vector**:
  - Generates a standalone XML SVG (`<sanitized-title>.svg`) with `48px` padding, theme background color, freehand paths, shapes, arrowheads, sticky notes, text, and embedded images. *(Note: `star` elements and `doubleArrow` heads are rendered on the live Canvas and PNG export; SVG export covers paths, lines, single arrows, rectangles, frames, ellipses, diamonds, triangles, sticky notes, text, and images.)*
- **Save / Import Board File (`.json`)**:
  - Exports `{ app: "BoardCraft", version: 1, boardTitle, exportedAt, elements }` as `<sanitized-title>.boardcraft.json`.
  - Importing a `.json` file restores `elements` and `boardTitle`, records an undo snapshot, and syncs to any connected live room.

---

## Keyboard Shortcuts

Press **`?`** anywhere (outside text inputs) to toggle the in-app Shortcuts modal.

### Drawing & Creation Tools

| Action            | Shortcut |
| :---------------- | :------- |
| Select & Move     | `V`      |
| Hand Pan          | `H`      |
| Pen               | `P`      |
| Highlighter       | `M`      |
| Object Eraser     | `E`      |
| Rectangle         | `R`      |
| Circle / Ellipse  | `O`      |
| Diamond           | `D`      |
| Triangle          | `G`      |
| Star              | `U`      |
| Line              | `L`      |
| Arrow Connector   | `A`      |
| Text              | `T`      |
| Sticky Note       | `S`      |
| Frame / Section   | `F`      |
| Laser Pointer     | `K`      |

### Canvas & Editing

| Action                                          | Shortcut                                           |
| :---------------------------------------------- | :------------------------------------------------- |
| Pan Anywhere                                    | `Space + Drag`                                     |
| Zoom In / Out                                   | `Ctrl / Cmd + Scroll`                              |
| Undo                                            | `Ctrl + Z` / `Cmd + Z`                             |
| Redo                                            | `Ctrl + Y` / `Ctrl + Shift + Z` / `Cmd + Shift + Z` |
| Duplicate Selected                              | `Ctrl + D` / `Cmd + D`                             |
| Select All                                      | `Ctrl + A` / `Cmd + A`                             |
| Delete Selected                                 | `Delete` or `Backspace`                            |
| Paste Image from Clipboard                      | `Ctrl + V` / `Cmd + V`                             |
| Edit Text / Sticky / Shape / Frame Label        | `Double-click`                                     |
| Constrain Proportions / 45° Line Angle          | Hold `Shift` while drawing                         |
| Multi-select Toggle                             | `Shift + Click`                                    |
| Clear Selection / Close Modals / Exit Present   | `Escape`                                           |
| Open Keyboard Shortcuts Modal                   | `?`                                                |

---

## Data Model

Every object on the board is represented by `BoardElement` (`src/types/whiteboard.ts`):

```ts
export interface BoardElement {
  id: string;
  type:
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
  x: number;
  y: number;
  width: number;
  height: number;
  points?: { x: number; y: number }[];
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  opacity: number;
  text?: string;
  fontSize?: number;
  fontFamily?: 'sans' | 'hand' | 'mono';
  textAlign?: 'left' | 'center' | 'right';
  bold?: boolean;
  italic?: boolean;
  stickyColor?: string;
  doubleArrow?: boolean;
  imageData?: string;
  locked?: boolean;
  zIndex: number;
  updatedAt: number;
}
```

---

## API Endpoints

| Endpoint      | Method | Response                                | Description                                              |
| :------------ | :----- | :-------------------------------------- | :------------------------------------------------------- |
| `/api/health` | `GET`  | `{ "status": "ok", "rooms": <number> }` | Health check and active in-memory collaboration room count |
| `/ws`         | `WS`   | WebSocket stream                        | Real-time collaboration endpoint                         |

---

## Known Scope & Limitations

- **In-Memory Collaboration Rooms**: Room states on `server.ts` are stored in an in-memory `Map` (`rooms`). Restarting the server clears active room memory, while each user's local browser copy remains saved in `localStorage`.
- **Single-Node WebSocket Server**: Because room state lives in memory, horizontal multi-instance scaling would require an external pub/sub and persistence adapter (e.g., Redis/database).
- **Large Image Payloads**: Express JSON limit is configured at `15mb`, and inserted images are stored as Base64 data URLs inside `BoardElement.imageData`; very large or numerous images can eventually hit browser `localStorage` quota limits.

---

## Repository & Contributing

- **Source Repository:** [https://github.com/khdxsohee/boardcraft](https://github.com/khdxsohee/boardcraft)
- **Issues & Feature Requests:** [https://github.com/khdxsohee/boardcraft/issues](https://github.com/khdxsohee/boardcraft/issues)

Contributions are welcome:
1. Fork the repository at [khdxsohee/boardcraft](https://github.com/khdxsohee/boardcraft).
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Make your changes and run `npm run lint` and `npm run build` to verify there are no TypeScript or build errors.
4. Commit your changes and open a Pull Request.

---

<div align="center">

Built with React, TypeScript, HTML5 Canvas, Express & WebSockets · [Back to Top](#boardcraft)

</div>
