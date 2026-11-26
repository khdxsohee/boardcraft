import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

interface ClientMeta {
  id: string;
  name: string;
  color: string;
  roomId: string;
  cursor?: { x: number; y: number };
}

interface RoomState {
  boardTitle: string;
  elements: Record<string, unknown>[];
  clients: Map<WebSocket, ClientMeta>;
}

const rooms = new Map<string, RoomState>();

function getOrCreateRoom(roomId: string): RoomState {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      boardTitle: 'Untitled Whiteboard',
      elements: [],
      clients: new Map(),
    };
    rooms.set(roomId, room);
  }
  return room;
}

function getRoomParticipants(room: RoomState) {
  return Array.from(room.clients.values()).map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    cursor: c.cursor,
  }));
}

function broadcastToRoom(room: RoomState, payload: unknown, excludeWs?: WebSocket) {
  const message = JSON.stringify(payload);
  for (const [clientWs] of room.clients.entries()) {
    if (clientWs !== excludeWs && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(message);
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', rooms: rooms.size });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
      if (url.pathname === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch {
      socket.destroy();
    }
  });

  wss.on('connection', (ws: WebSocket) => {
    let currentMeta: ClientMeta | null = null;

    ws.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());

        if (data.type === 'room:join') {
          const roomId = String(data.roomId || 'default').slice(0, 64);
          // Leave previous room if any
          if (currentMeta) {
            const prevRoom = rooms.get(currentMeta.roomId);
            if (prevRoom) {
              prevRoom.clients.delete(ws);
              broadcastToRoom(prevRoom, {
                type: 'user:left',
                userId: currentMeta.id,
                participants: getRoomParticipants(prevRoom),
              });
              if (prevRoom.clients.size === 0 && prevRoom.elements.length === 0) {
                rooms.delete(currentMeta.roomId);
              }
            }
          }

          const room = getOrCreateRoom(roomId);
          currentMeta = {
            id: String(data.userId || Math.random().toString(36).slice(2, 10)),
            name: String(data.name || 'Guest').slice(0, 32),
            color: String(data.color || '#2563EB'),
            roomId,
          };

          // If joining client brings initial local elements to an empty room, seed the room
          if (room.elements.length === 0 && Array.isArray(data.initialElements) && data.initialElements.length > 0) {
            room.elements = data.initialElements;
            if (typeof data.boardTitle === 'string' && data.boardTitle.trim()) {
              room.boardTitle = data.boardTitle.trim().slice(0, 80);
            }
          }

          room.clients.set(ws, currentMeta);

          ws.send(
            JSON.stringify({
              type: 'room:state',
              roomId,
              boardTitle: room.boardTitle,
              elements: room.elements,
              participants: getRoomParticipants(room),
            })
          );

          broadcastToRoom(
            room,
            {
              type: 'user:joined',
              user: currentMeta,
              participants: getRoomParticipants(room),
            },
            ws
          );
          return;
        }

        if (!currentMeta) return;
        const room = rooms.get(currentMeta.roomId);
        if (!room) return;

        switch (data.type) {
          case 'element:upsert': {
            const incoming: Record<string, unknown>[] = Array.isArray(data.elements)
              ? data.elements
              : data.element
              ? [data.element]
              : [];

            for (const item of incoming) {
              if (!item || typeof item.id !== 'string') continue;
              const idx = room.elements.findIndex((el) => el.id === item.id);
              if (idx >= 0) {
                room.elements[idx] = item;
              } else {
                room.elements.push(item);
              }
            }

            broadcastToRoom(
              room,
              {
                type: 'element:upsert',
                elements: incoming,
                senderId: currentMeta.id,
              },
              ws
            );
            break;
          }

          case 'element:delete': {
            const ids = new Set<string>(Array.isArray(data.ids) ? data.ids : []);
            if (ids.size > 0) {
              room.elements = room.elements.filter((el) => !ids.has(String(el.id)));
              broadcastToRoom(
                room,
                {
                  type: 'element:delete',
                  ids: Array.from(ids),
                  senderId: currentMeta.id,
                },
                ws
              );
            }
            break;
          }

          case 'board:replace': {
            if (Array.isArray(data.elements)) {
              room.elements = data.elements;
              broadcastToRoom(
                room,
                {
                  type: 'board:replace',
                  elements: room.elements,
                  senderId: currentMeta.id,
                },
                ws
              );
            }
            break;
          }

          case 'board:meta': {
            if (typeof data.boardTitle === 'string') {
              room.boardTitle = data.boardTitle.slice(0, 80);
              broadcastToRoom(
                room,
                {
                  type: 'board:meta',
                  boardTitle: room.boardTitle,
                  senderId: currentMeta.id,
                },
                ws
              );
            }
            break;
          }

          case 'cursor:move': {
            currentMeta.cursor = data.cursor;
            broadcastToRoom(
              room,
              {
                type: 'cursor:move',
                userId: currentMeta.id,
                name: currentMeta.name,
                color: currentMeta.color,
                cursor: data.cursor,
              },
              ws
            );
            break;
          }

          case 'laser:point': {
            broadcastToRoom(
              room,
              {
                type: 'laser:point',
                userId: currentMeta.id,
                color: currentMeta.color,
                point: data.point,
              },
              ws
            );
            break;
          }

          case 'user:update': {
            if (typeof data.name === 'string' && data.name.trim()) {
              currentMeta.name = data.name.trim().slice(0, 32);
            }
            if (typeof data.color === 'string') {
              currentMeta.color = data.color;
            }
            broadcastToRoom(room, {
              type: 'user:updated',
              participants: getRoomParticipants(room),
            });
            break;
          }
        }
      } catch {
        // Ignore malformed packets
      }
    });

    ws.on('close', () => {
      if (!currentMeta) return;
      const room = rooms.get(currentMeta.roomId);
      if (!room) return;
      room.clients.delete(ws);
      broadcastToRoom(room, {
        type: 'user:left',
        userId: currentMeta.id,
        participants: getRoomParticipants(room),
      });
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        ws: process.env.DISABLE_HMR === 'true' ? false : { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`BoardCraft server running on http://localhost:${PORT}`);
  });
}

startServer();
