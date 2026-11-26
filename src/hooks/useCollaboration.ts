import { useCallback, useEffect, useRef, useState } from 'react';
import { BoardElement, Collaborator, LaserPoint, Point } from '../types/whiteboard';

const USER_COLORS = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#DB2777'];

function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

interface UseCollaborationOptions {
  onRemoteStateSync: (elements: BoardElement[], boardTitle: string) => void;
  onRemoteUpsert: (elements: BoardElement[]) => void;
  onRemoteDelete: (ids: string[]) => void;
  onRemoteReplace: (elements: BoardElement[]) => void;
  onRemoteTitleChange: (title: string) => void;
  onRemoteLaserPoint: (point: LaserPoint) => void;
  getCurrentElements: () => BoardElement[];
  getCurrentTitle: () => string;
}

export function useCollaboration({
  onRemoteStateSync,
  onRemoteUpsert,
  onRemoteDelete,
  onRemoteReplace,
  onRemoteTitleChange,
  onRemoteLaserPoint,
  getCurrentElements,
  getCurrentTitle,
}: UseCollaborationOptions) {
  const [roomId, setRoomId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room');
  });
  const [connected, setConnected] = useState(false);
  const [participants, setParticipants] = useState<Collaborator[]>([]);
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('boardcraft_username') || 'Creator';
  });
  const [userId] = useState<string>(() => {
    const saved = sessionStorage.getItem('boardcraft_userid');
    if (saved) return saved;
    const next = generateId('usr');
    sessionStorage.setItem('boardcraft_userid', next);
    return next;
  });
  const [userColor] = useState<string>(() => {
    return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const lastCursorSentRef = useRef<number>(0);

  const callbacksRef = useRef({
    onRemoteStateSync,
    onRemoteUpsert,
    onRemoteDelete,
    onRemoteReplace,
    onRemoteTitleChange,
    onRemoteLaserPoint,
    getCurrentElements,
    getCurrentTitle,
  });
  callbacksRef.current = {
    onRemoteStateSync,
    onRemoteUpsert,
    onRemoteDelete,
    onRemoteReplace,
    onRemoteTitleChange,
    onRemoteLaserPoint,
    getCurrentElements,
    getCurrentTitle,
  };

  useEffect(() => {
    if (!roomId) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setConnected(false);
      setParticipants([]);
      return;
    }

    let cancelled = false;

    const connect = () => {
      if (cancelled || !navigator.onLine) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) {
          ws.close();
          return;
        }
        setConnected(true);
        ws.send(
          JSON.stringify({
            type: 'room:join',
            roomId,
            userId,
            name: userName,
            color: userColor,
            initialElements: callbacksRef.current.getCurrentElements(),
            boardTitle: callbacksRef.current.getCurrentTitle(),
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case 'room:state':
              if (Array.isArray(msg.elements)) {
                callbacksRef.current.onRemoteStateSync(
                  msg.elements,
                  msg.boardTitle || 'Untitled Whiteboard'
                );
              }
              if (Array.isArray(msg.participants)) {
                setParticipants(msg.participants.filter((p: Collaborator) => p.id !== userId));
              }
              break;

            case 'user:joined':
            case 'user:left':
            case 'user:updated':
              if (Array.isArray(msg.participants)) {
                setParticipants(msg.participants.filter((p: Collaborator) => p.id !== userId));
              }
              break;

            case 'element:upsert':
              if (msg.senderId !== userId && Array.isArray(msg.elements)) {
                callbacksRef.current.onRemoteUpsert(msg.elements);
              }
              break;

            case 'element:delete':
              if (msg.senderId !== userId && Array.isArray(msg.ids)) {
                callbacksRef.current.onRemoteDelete(msg.ids);
              }
              break;

            case 'board:replace':
              if (msg.senderId !== userId && Array.isArray(msg.elements)) {
                callbacksRef.current.onRemoteReplace(msg.elements);
              }
              break;

            case 'board:meta':
              if (msg.senderId !== userId && typeof msg.boardTitle === 'string') {
                callbacksRef.current.onRemoteTitleChange(msg.boardTitle);
              }
              break;

            case 'cursor:move':
              if (msg.userId !== userId && msg.cursor) {
                setParticipants((prev) =>
                  prev.map((p) => (p.id === msg.userId ? { ...p, cursor: msg.cursor } : p))
                );
              }
              break;

            case 'laser:point':
              if (msg.userId !== userId && msg.point) {
                callbacksRef.current.onRemoteLaserPoint({
                  ...msg.point,
                  color: msg.color || '#EF4444',
                  time: Date.now(),
                });
              }
              break;
          }
        } catch {
          // Ignore invalid JSON
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (!cancelled && roomId && navigator.onLine) {
          reconnectTimerRef.current = window.setTimeout(connect, 2000);
        }
      };
    };

    const handleOnline = () => {
      if (!cancelled && (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED)) {
        connect();
      }
    };

    const handleOffline = () => {
      setConnected(false);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    connect();

    return () => {
      cancelled = true;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [roomId, userId, userColor]);

  const sendMessage = useCallback((payload: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const emitUpsert = useCallback(
    (elements: BoardElement[]) => {
      if (elements.length === 0) return;
      sendMessage({ type: 'element:upsert', elements });
    },
    [sendMessage]
  );

  const emitDelete = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      sendMessage({ type: 'element:delete', ids });
    },
    [sendMessage]
  );

  const emitReplace = useCallback(
    (elements: BoardElement[]) => {
      sendMessage({ type: 'board:replace', elements });
    },
    [sendMessage]
  );

  const emitTitle = useCallback(
    (boardTitle: string) => {
      sendMessage({ type: 'board:meta', boardTitle });
    },
    [sendMessage]
  );

  const emitCursor = useCallback(
    (cursor: Point) => {
      const now = performance.now();
      if (now - lastCursorSentRef.current < 40) return;
      lastCursorSentRef.current = now;
      sendMessage({ type: 'cursor:move', cursor });
    },
    [sendMessage]
  );

  const emitLaser = useCallback(
    (point: { x: number; y: number; strokeId: string }) => {
      sendMessage({ type: 'laser:point', point });
    },
    [sendMessage]
  );

  const startLiveRoom = useCallback((customId?: string) => {
    const nextRoom = (customId || generateId('room')).trim();
    const url = new URL(window.location.href);
    url.searchParams.set('room', nextRoom);
    window.history.replaceState({}, '', url.toString());
    setRoomId(nextRoom);
    return nextRoom;
  }, []);

  const leaveRoom = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState({}, '', url.toString());
    setRoomId(null);
  }, []);

  const updateUserName = useCallback(
    (name: string) => {
      const clean = name.trim().slice(0, 32) || 'Creator';
      setUserName(clean);
      localStorage.setItem('boardcraft_username', clean);
      sendMessage({ type: 'user:update', name: clean });
    },
    [sendMessage]
  );

  return {
    roomId,
    connected,
    participants,
    userName,
    userId,
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
  };
}
