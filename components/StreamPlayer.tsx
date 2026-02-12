
import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause,
  Maximize, 
  Volume2, 
  VolumeX, 
  Users, 
  Radio, 
  Copy, 
  Check, 
  Lock, 
  Globe, 
  Monitor, 
  X,
  ChevronDown,
  Wifi,
  Cloud,
  Headphones,
  Mic
} from 'lucide-react';
import { StreamSession } from '../types';

interface StreamPlayerProps {
  stream: StreamSession;
  onRemove?: () => void;
  onUpdateResolution?: (resolution: string) => void;
  onUpdateIpMode?: (mode: string) => void;
}

const StreamPlayer: React.FC<StreamPlayerProps> = ({ stream, onRemove, onUpdateResolution, onUpdateIpMode }) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(80);
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Simulate Audio Level
  useEffect(() => {
    let interval: number;
    if (stream.status === 'live' && isPlaying) {
      interval = window.setInterval(() => {
        // Higher volume = higher potential peaks
        const base = volume > 0 ? (volume / 100) * 40 : 0;
        const peak = volume > 0 ? Math.random() * (volume / 100) * 60 : 0;
        setAudioLevel(base + peak);
      }, 100);
    } else {
      setAudioLevel(0);
    }
    return () => clearInterval(interval);
  }, [stream.status, isPlaying, volume]);

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

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const isLocal = stream.ingestIp === '127.0.0.1' || stream.ingestIp.startsWith('192.168.') || stream.ingestIp.startsWith('10.');

  return (
    <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all group shadow-xl flex flex-col h-full relative">
      {/* Video Container */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden shrink-0">
        {stream.status === 'live' ? (
          <div className="relative w-full h-full overflow-hidden">
            <img 
              src={stream.thumbnailUrl} 
              alt={stream.title} 
              className={`w-full h-full object-cover transition-all duration-700 ${isPlaying ? 'opacity-80 scale-100' : 'opacity-40 scale-110 grayscale-[0.5] blur-[2px]'}`}
            />
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Pause className="w-12 h-12 text-white/50 animate-pulse" />
              </div>
            )}
          </div>
        ) : (
          <div className="text-zinc-600 flex flex-col items-center">
            <Radio className="w-12 h-12 mb-2 opacity-20" />
            <span className="font-bold text-sm tracking-widest uppercase text-zinc-700">Off-Air</span>
          </div>
        )}
        
        {/* Overlay Controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={handlePlayToggle}
                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMonitoring(!isMonitoring); }}
                className={`p-2 rounded-full transition-all flex items-center gap-2 ${isMonitoring ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/10 text-white hover:bg-white/20'}`}
                title={isMonitoring ? "Stop Monitoring" : "Start Monitoring (Solo)"}
              >
                <Headphones className="w-5 h-5" />
                {isMonitoring && <span className="text-[10px] font-bold pr-1">MONITORING</span>}
              </button>
            </div>
            <div className="flex items-center gap-2">
               {onRemove && (
                 <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="px-3 py-1.5 bg-red-600/10 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1.5"
                 >
                   <X className="w-3.5 h-3.5" />
                   Remove
                 </button>
               )}
            </div>
          </div>
        </div>

        {/* Network & Live Status */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {stream.status === 'live' && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase shadow-lg transition-colors ${isPlaying ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-white animate-ping' : 'bg-zinc-600'}`} />
              {isPlaying ? 'LIVE' : 'PAUSED'}
            </div>
          )}
          <div className={`flex items-center gap-2 px-2.5 py-1 rounded text-[9px] font-bold uppercase backdrop-blur-md border ${isLocal ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' : 'bg-blue-500/20 border-blue-500/40 text-blue-400'}`}>
            {isLocal ? <Wifi className="w-3 h-3" /> : <Cloud className="w-3 h-3" />}
            {isLocal ? 'LAN Stream' : 'Public Cloud'}
          </div>
        </div>

        {/* Resolution Badge */}
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold text-zinc-300 flex items-center border border-white/10 overflow-hidden">
          {onUpdateResolution ? (
            <div className="relative group/res flex items-center px-2 py-1 hover:bg-white/10 transition-colors cursor-pointer">
              <Monitor className="w-3 h-3 text-blue-400 mr-1.5" />
              <span>{stream.resolution}</span>
              <select 
                value={stream.resolution}
                onChange={(e) => onUpdateResolution(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              >
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="2K">2K</option>
                <option value="4K">4K</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center px-2 py-1">
              <Monitor className="w-3 h-3 text-blue-400 mr-1.5" />
              {stream.resolution}
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="p-4 space-y-4 flex flex-col flex-1">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base line-clamp-1 text-zinc-100">{stream.title}</h3>
            <div className="flex items-center gap-2 mt-0.5">
               <p className="text-xs text-zinc-400 font-medium">@{stream.broadcaster}</p>
               <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
               <span className="text-[10px] font-mono text-zinc-500">{stream.ingestIp}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400 bg-zinc-800 px-2 py-1 rounded text-[10px] font-bold shrink-0 ml-2">
            <Users className="w-3 h-3 text-blue-500" />
            <span>{stream.viewers.toLocaleString()}</span>
          </div>
        </div>

        {/* Audio Management Console */}
        <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/50 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Mic className="w-3 h-3 text-zinc-500" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Input Audio</span>
            </div>
            <span className={`text-[10px] font-mono ${audioLevel > 80 ? 'text-red-500' : audioLevel > 50 ? 'text-yellow-500' : 'text-emerald-500'}`}>
              {Math.round(audioLevel)} dB
            </span>
          </div>
          
          {/* VU Meter */}
          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-zinc-800">
             {Array.from({ length: 20 }).map((_, i) => (
               <div 
                 key={i} 
                 className={`h-full flex-1 rounded-sm transition-all duration-75 ${
                   i * 5 < audioLevel 
                     ? (i > 15 ? 'bg-red-500' : i > 10 ? 'bg-yellow-500' : 'bg-emerald-500') 
                     : 'bg-zinc-800'
                 }`}
               />
             ))}
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3 pt-1">
            <button 
              onClick={() => setVolume(v => v === 0 ? 80 : 0)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <div className="flex-1 relative flex items-center group/vol">
              <input 
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div 
                className="absolute right-0 -top-6 bg-zinc-800 text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover/vol:opacity-100 transition-opacity border border-zinc-700 pointer-events-none"
              >
                {volume}% Gain
              </div>
            </div>
          </div>
        </div>

        {/* RTMP Info */}
        <div className="mt-auto space-y-2 pt-2 border-t border-zinc-800/50">
            <div className="flex justify-between items-center">
               <div className="relative flex items-center gap-1.5 group/net">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Ingest Point
                  </p>
                  {onUpdateIpMode && (
                    <div className="relative">
                       <button className="text-zinc-600 hover:text-blue-500 transition-colors">
                          <ChevronDown className="w-3 h-3" />
                       </button>
                       <select 
                        onChange={(e) => onUpdateIpMode(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        defaultValue={isLocal ? "lan" : "auto"}
                       >
                          <option value="auto">Public IP</option>
                          <option value="lan">LAN IP</option>
                          <option value="loopback">Loopback (127.0.0.1)</option>
                          <option value="manual">Manual Override</option>
                       </select>
                    </div>
                  )}
               </div>
               <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${isLocal ? 'border-orange-500/20 text-orange-500/60' : 'border-blue-500/20 text-blue-500/60'}`}>
                 {isLocal ? 'LOCAL' : 'REMOTE'}
               </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between text-[11px] bg-black/40 p-2 rounded border border-zinc-800/50">
                    <code className="text-blue-400/80 truncate mr-2 font-mono" title={stream.rtmpUrl}>{stream.rtmpUrl}</code>
                    <button onClick={() => copyToClipboard(stream.rtmpUrl, 'url')} className="text-zinc-500 hover:text-white transition-colors">
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                </div>
                <div className="flex items-center justify-between text-[11px] bg-black/40 p-2 rounded border border-zinc-800/50">
                    <code className="text-amber-400/80 truncate mr-2 font-mono tracking-wider">••••••••</code>
                    <button onClick={() => copyToClipboard(stream.streamKey, 'key')} className="text-zinc-500 hover:text-white transition-colors">
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StreamPlayer;
