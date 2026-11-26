import React, { useState } from 'react';
import { Check, Copy, Link2, LogOut, Users, X } from 'lucide-react';
import { Collaborator } from '../types/whiteboard';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  roomId: string | null;
  connected: boolean;
  userName: string;
  userColor: string;
  participants: Collaborator[];
  onStartRoom: () => void;
  onLeaveRoom: () => void;
  onUpdateUserName: (name: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  open,
  onClose,
  roomId,
  connected,
  userName,
  userColor,
  participants,
  onStartRoom,
  onLeaveRoom,
  onUpdateUserName,
}) => {
  const [nameInput, setNameInput] = useState(userName);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const shareUrl = roomId ? `${window.location.origin}${window.location.pathname}?room=${roomId}` : '';

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Live Collaboration
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Your Display Name
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={() => onUpdateUserName(nameInput)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onUpdateUserName(nameInput);
                }}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                placeholder="Enter your name"
              />
              <button
                onClick={() => onUpdateUserName(nameInput)}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>

          {!roomId ? (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Start a live collaborative session to get a shareable link. Anyone with the link can draw, add sticky notes, and see live cursors in real time.
              </p>
              <button
                onClick={onStartRoom}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Link2 className="w-4 h-4" />
                Start Live Session
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-500 dark:text-slate-400">
                    Shareable Room Link
                  </span>
                  <span
                    className={`font-medium ${
                      connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'
                    }`}
                  >
                    {connected ? 'Connected' : 'Reconnecting...'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-3 py-2 text-xs font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 select-all"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Active Collaborators ({participants.length + 1})
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/70 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: userColor }}
                      />
                      <span className="font-medium text-slate-900 dark:text-white">{userName}</span>
                    </div>
                    <span className="text-slate-400">You</span>
                  </div>

                  {participants.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/70 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="font-medium text-slate-900 dark:text-white">{p.name}</span>
                      </div>
                      <span className="text-emerald-600 dark:text-emerald-400">Online</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={onLeaveRoom}
                className="w-full py-2 px-3 rounded-lg text-xs font-medium border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Leave Live Session
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
