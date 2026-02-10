
import React, { useState } from 'react';
import { Play, Maximize, Volume2, Users, Radio, Copy, Check, Lock, Globe } from 'lucide-react';
import { StreamSession } from '../types';

interface StreamPlayerProps {
  stream: StreamSession;
}

const StreamPlayer: React.FC<StreamPlayerProps> = ({ stream }) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const copyToClipboard = (text: string, type: 'url' | 'key') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all group shadow-xl flex flex-col h-full">
      {/* Video Container */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden shrink-0">
        {stream.status === 'live' ? (
          <img 
            src={stream.thumbnailUrl} 
            alt={stream.title} 
            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="text-zinc-600 flex flex-col items-center">
            <Radio className="w-12 h-12 mb-2 opacity-20" />
            <span className="font-bold text-sm tracking-widest">OFFLINE</span>
          </div>
        )}
        
        {/* Overlay Controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <Play className="w-5 h-5 fill-current" />
              </button>
              <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
            <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Badge */}
        {stream.status === 'live' && (
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-red-600 rounded text-[10px] font-bold tracking-widest uppercase">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            LIVE
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-4 space-y-4 flex flex-col flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-base line-clamp-1 text-zinc-100">{stream.title}</h3>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">@{stream.broadcaster}</p>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400 bg-zinc-800 px-2 py-1 rounded text-[10px] font-bold">
            <Users className="w-3 h-3 text-blue-500" />
            <span>{stream.viewers.toLocaleString()}</span>
          </div>
        </div>

        {/* RTMP Info - Admin/Broadcaster Details */}
        <div className="mt-auto space-y-2 pt-4 border-t border-zinc-800">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight flex items-center gap-1">
              <Globe className="w-3 h-3" /> RTMP Server URL
            </p>
            <div className="flex items-center justify-between text-[11px] bg-black/40 p-2 rounded border border-zinc-800/50">
                <code className="text-blue-400/80 truncate mr-2 font-mono">{stream.rtmpUrl}</code>
                <button 
                  onClick={() => copyToClipboard(stream.rtmpUrl, 'url')}
                  className="text-zinc-500 hover:text-white flex-shrink-0 transition-colors"
                >
                  {copiedUrl ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>

            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight flex items-center gap-1 mt-2">
              <Lock className="w-3 h-3" /> Stream Key (Password)
            </p>
            <div className="flex items-center justify-between text-[11px] bg-black/40 p-2 rounded border border-zinc-800/50">
                <code className="text-amber-400/80 truncate mr-2 font-mono tracking-wider">{stream.streamKey}</code>
                <button 
                  onClick={() => copyToClipboard(stream.streamKey, 'key')}
                  className="text-zinc-500 hover:text-white flex-shrink-0 transition-colors"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StreamPlayer;
