import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  RefreshCcw, 
  Check, 
  X, 
  Radio, 
  Server, 
  Volume2, 
  Pause, 
  Play, 
  Smartphone, 
  Monitor, 
  Globe, 
  AlertTriangle,
  ArrowRight,
  Database,
  Cpu
} from 'lucide-react';
import { StreamSession } from '../types';

interface StreamTestHubProps {
  streams: StreamSession[];
}

export const StreamTestHub: React.FC<StreamTestHubProps> = ({ streams }) => {
  const [selectedStreamId, setSelectedStreamId] = useState<string>('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerProtocol, setPlayerProtocol] = useState<'hls' | 'dash'>('hls');
  const [qualityLevels, setQualityLevels] = useState<string[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<string>('Auto');
  const [volume, setVolume] = useState(70);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsInstanceRef = useRef<any>(null);
  const dashPlayerRef = useRef<any>(null);

  const selectedStream = streams.find(s => s.id === selectedStreamId) || streams[0];

  useEffect(() => {
    if (streams.length > 0 && !selectedStreamId) {
      setSelectedStreamId(streams[0].id);
    }
  }, [streams, selectedStreamId]);

  // Derive alternative URLs
  const baseHttp = selectedStream ? selectedStream.rtmpUrl.replace('rtmp://', 'http://').split('/')[0] : 'localhost:3000';
  const currentHost = typeof window !== 'undefined' ? window.location.host : baseHttp;
  const currentProto = typeof window !== 'undefined' ? window.location.protocol : 'http:';

  const hlsUrl = selectedStream ? `${currentProto}//${currentHost}/hls/${selectedStream.streamKey}/master.m3u8` : '';
  const dashUrl = selectedStream ? `${currentProto}//${currentHost}/dash/${selectedStream.streamKey}/manifest.mpd` : '';
  const embedUrl = selectedStream ? `${currentProto}//${currentHost}/player/${selectedStream.streamKey}` : '';

  // Load dependency scripts
  const loadScript = (url: string, id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }
      if (document.getElementById(id)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = url;
      script.id = id;
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.body.appendChild(script);
    });
  };

  // Run Stream Audits
  const runStreamAudit = async () => {
    if (!selectedStream) return;
    setIsAuditing(true);
    setAuditReport(null);
    try {
      const response = await fetch(`/api/test/stream?streamKey=${selectedStream.streamKey}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('streampulse_jwt')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAuditReport(data.report);
      } else {
        alert(data.error || 'Failed to complete diagnostics audit.');
      }
    } catch (e) {
      console.error(e);
      alert('Error fetching audit diagnostics reports.');
    } finally {
      setIsAuditing(false);
    }
  };

  // Interactive Player hook
  useEffect(() => {
    if (!isPlaying || !selectedStream || selectedStream.status !== 'live' || !videoRef.current) {
      return;
    }

    let active = true;

    const initPlayer = async () => {
      // Clear existing instances
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
      if (dashPlayerRef.current) {
        dashPlayerRef.current.destroy();
        dashPlayerRef.current = null;
      }

      const video = videoRef.current;
      video.muted = volume === 0;
      video.volume = volume / 100;

      if (playerProtocol === 'hls') {
        try {
          await loadScript('https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.min.js', 'hls-js-cdn');
          if (!active) return;
          const Hls = (window as any).Hls;
          if (Hls && Hls.isSupported()) {
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: true,
            });
            hls.loadSource(hlsUrl);
            hls.attachMedia(video);
            hlsInstanceRef.current = hls;

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (!active) return;
              video.play().catch(e => console.log('Autoplay block:', e));
              const levels = hls.levels.map((l: any) => `${l.height}p`);
              setQualityLevels(['Auto', ...levels]);
            });

            hls.on(Hls.Events.ERROR, (event: any, data: any) => {
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    hls.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    hls.recoverMediaError();
                    break;
                  default:
                    break;
                }
              }
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = hlsUrl;
            video.addEventListener('loadedmetadata', () => {
              if (active) video.play().catch(e => console.log('Autoplay block:', e));
            });
          }
        } catch (err) {
          console.error('HLS error:', err);
        }
      } else {
        try {
          await loadScript('https://cdn.jsdelivr.net/npm/dashjs@4.7.1/dist/dash.all.min.js', 'dash-js-cdn');
          if (!active) return;
          const dashjs = (window as any).dashjs;
          if (dashjs) {
            const player = dashjs.MediaPlayer().create();
            player.initialize(video, dashUrl, true);
            dashPlayerRef.current = player;
            
            player.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
              if (!active) return;
              const tracks = player.getTracksFor('video');
              if (tracks && tracks.length > 0) {
                const bitrates = player.getBitrateInfoListFor('video').map((b: any) => `${b.height}p`);
                setQualityLevels(['Auto', ...bitrates]);
              }
            });
          }
        } catch (err) {
          console.error('DASH error:', err);
        }
      }
    };

    initPlayer();

    return () => {
      active = false;
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
      if (dashPlayerRef.current) {
        dashPlayerRef.current.destroy();
        dashPlayerRef.current = null;
      }
    };
  }, [isPlaying, playerProtocol, hlsUrl, dashUrl, selectedStream, selectedStreamId]);

  // Sync volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = volume === 0;
      videoRef.current.volume = volume / 100;
    }
  }, [volume]);

  const changePlayerQuality = (quality: string) => {
    setSelectedQuality(quality);
    if (playerProtocol === 'hls' && hlsInstanceRef.current) {
      const hls = hlsInstanceRef.current;
      if (quality === 'Auto') {
        hls.currentLevel = -1;
      } else {
        const height = parseInt(quality);
        const idx = hls.levels.findIndex((l: any) => l.height === height);
        if (idx !== -1) {
          hls.currentLevel = idx;
        }
      }
    } else if (playerProtocol === 'dash' && dashPlayerRef.current) {
      const player = dashPlayerRef.current;
      if (quality === 'Auto') {
        player.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: true } } } });
      } else {
        player.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: false } } } });
        const height = parseInt(quality);
        const levels = player.getBitrateInfoListFor('video');
        const idx = levels.findIndex((l: any) => l.height === height);
        if (idx !== -1) {
          player.setQualityFor('video', idx, true);
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <ShieldCheck className="w-8 h-8 text-blue-500" />
            Stream Verification Hub
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            Automated compliance audits, playbacks, and real-time VPS diagnostics for professional RTMP setups.
          </p>
        </div>

        {selectedStream && (
          <button 
            onClick={runStreamAudit}
            disabled={isAuditing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white disabled:text-zinc-500 rounded-lg text-sm font-bold uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 cursor-pointer"
          >
            {isAuditing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            Run Live Audit Diagnostics
          </button>
        )}
      </div>

      {/* Stream Selection Dropdown */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-zinc-800 rounded-xl text-blue-400">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-300 uppercase tracking-wider">Select Stream for Diagnostics</h3>
            <p className="text-zinc-500 text-xs mt-0.5">Choose target broadcaster keys to execute audits.</p>
          </div>
        </div>

        <select 
          value={selectedStreamId}
          onChange={(e) => {
            setSelectedStreamId(e.target.value);
            setAuditReport(null);
            setIsPlaying(false);
          }}
          className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-100 rounded-xl px-4 py-3 text-sm font-bold outline-none cursor-pointer min-w-[240px] shadow-inner"
        >
          {streams.map(s => (
            <option key={s.id} value={s.id}>
              @{s.broadcaster} — {s.title} ({s.status.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      {selectedStream ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Audit Checklists */}
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
                <Database className="w-4 h-4 text-zinc-400" />
                Live Verification Checklist
              </h3>
              
              <div className="space-y-3">
                {auditReport ? (
                  Object.entries(auditReport).map(([key, value]: any) => (
                    <div key={key} className="flex gap-3 items-start bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80 hover:border-zinc-750 transition-colors">
                      <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        value.status === 'PASS' 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : value.status === 'WARN' 
                            ? 'bg-yellow-500/10 text-yellow-500' 
                            : 'bg-red-500/10 text-red-500'
                      }`}>
                        {value.status === 'PASS' ? (
                          <Check className="w-4 h-4" />
                        ) : value.status === 'WARN' ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs uppercase tracking-tight text-zinc-200">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </h4>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                            value.status === 'PASS' 
                              ? 'bg-emerald-500/15 text-emerald-400' 
                              : value.status === 'WARN' 
                                ? 'bg-yellow-500/15 text-yellow-500' 
                                : 'bg-red-500/15 text-red-500'
                          }`}>
                            {value.status}
                          </span>
                        </div>
                        <p className="text-zinc-400 text-xs leading-relaxed">
                          {value.reason}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500 bg-zinc-950/40 rounded-xl border border-dashed border-zinc-800">
                    <Activity className="w-10 h-10 mb-3 text-zinc-600 animate-pulse" />
                    <p className="text-xs font-bold uppercase tracking-wider">No Diagnostics Run Yet</p>
                    <p className="text-[11px] text-zinc-600 max-w-[260px] mt-1">
                      Click "Run Live Audit Diagnostics" at the top to check compliance checklists dynamically.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Ingest Credentials Info */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
                <Server className="w-4 h-4 text-zinc-400" />
                Ingest Endpoints
              </h3>
              
              <div className="space-y-3 text-xs">
                <div className="space-y-1.5">
                  <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider">OBS / vMix RTMP Server URL</span>
                  <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 font-mono text-zinc-300 break-all select-all">
                    {selectedStream.rtmpUrl}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider">OBS Ingest Stream Key</span>
                  <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 font-mono text-amber-500/80 break-all select-all tracking-wider font-bold">
                    {selectedStream.streamKey}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-2 bg-zinc-950/40 rounded-lg border border-zinc-850 text-zinc-500 text-[10px]">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Configure OBS to stream 1080p, 720p, 480p, or 360p video targets to begin transcoding.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Player Testing */}
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col h-full">
              <h3 className="text-base font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2 mb-4">
                <Monitor className="w-4 h-4 text-zinc-400" />
                Adaptive Web Player Test Sandbox
              </h3>

              <div className="aspect-video bg-black rounded-xl overflow-hidden relative border border-zinc-800 flex items-center justify-center">
                {selectedStream.status === 'live' ? (
                  isPlaying ? (
                    <div className="relative w-full h-full bg-black group/player">
                      <video 
                        ref={videoRef}
                        className="w-full h-full object-contain"
                        playsInline
                        autoPlay
                        controls={false}
                      />
                      
                      {/* Control Overlays */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent p-3 flex flex-col gap-2 opacity-0 group-hover/player:opacity-100 transition-opacity duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex bg-zinc-950/90 rounded border border-zinc-800 p-0.5 text-[8px] font-bold">
                            <button 
                              onClick={() => setPlayerProtocol('hls')}
                              className={`px-1.5 py-0.5 rounded cursor-pointer ${playerProtocol === 'hls' ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}
                            >
                              HLS
                            </button>
                            <button 
                              onClick={() => setPlayerProtocol('dash')}
                              className={`px-1.5 py-0.5 rounded cursor-pointer ${playerProtocol === 'dash' ? 'bg-purple-600 text-white' : 'text-zinc-500'}`}
                            >
                              DASH
                            </button>
                          </div>

                          {qualityLevels.length > 0 && (
                            <select 
                              value={selectedQuality}
                              onChange={(e) => changePlayerQuality(e.target.value)}
                              className="bg-zinc-950 border border-zinc-800 text-[8px] font-bold text-zinc-300 px-1 py-0.5 rounded outline-none cursor-pointer"
                            >
                              {qualityLevels.map(q => (
                                <option key={q} value={q}>{q}</option>
                              ))}
                            </select>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setIsPlaying(false)}
                              className="p-1.5 bg-white/15 hover:bg-white/25 rounded-full text-white cursor-pointer"
                            >
                              <Pause className="w-3.5 h-3.5 fill-white" />
                            </button>
                            
                            <div className="flex items-center gap-1">
                              <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
                              <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={volume}
                                onChange={(e) => setVolume(parseInt(e.target.value))}
                                className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                              />
                            </div>
                          </div>

                          <span className="text-[8px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded">
                            LIVE • {playerProtocol.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-3">
                      <p className="text-xs text-zinc-500">Broadcaster stream is live. Click to activate playback.</p>
                      <button 
                        onClick={() => setIsPlaying(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg uppercase tracking-wider flex items-center gap-1.5 mx-auto shadow-md shadow-blue-900/10 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" /> Open Sandbox Feed
                      </button>
                    </div>
                  )
                ) : (
                  <div className="text-center text-zinc-600 space-y-2">
                    <Radio className="w-12 h-12 mx-auto text-zinc-800" />
                    <p className="text-xs uppercase font-bold tracking-widest text-zinc-500">Stream Off-Air</p>
                    <p className="text-[10px] text-zinc-600 max-w-[200px] leading-relaxed mx-auto">
                      This sandbox requires a live publisher or virtual transcode node active.
                    </p>
                  </div>
                )}
              </div>

              {/* Endpoint configurations */}
              <div className="mt-4 space-y-3 bg-zinc-950/40 p-4 rounded-xl border border-zinc-800">
                <div className="space-y-1">
                  <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-blue-400" /> HLS Playback URL (VLC/iOS)
                  </span>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80 text-[10px] font-mono text-blue-400 truncate break-all select-all">
                    {hlsUrl || 'Select a stream key'}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1">
                    <Monitor className="w-3 h-3 text-purple-400" /> MPEG-DASH Playback URL (Web Players)
                  </span>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80 text-[10px] font-mono text-purple-400 truncate break-all select-all">
                    {dashUrl || 'Select a stream key'}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1">
                    <Globe className="w-3 h-3 text-rose-400" /> iframe Embed snippet (VLC/OBS)
                  </span>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80 text-[10px] font-mono text-rose-400 truncate break-all select-all">
                    {embedUrl ? `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>` : 'Select a stream key'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <AlertTriangle className="w-12 h-12 text-zinc-600 mb-3 animate-pulse" />
          <h3 className="text-lg font-bold">No streams found</h3>
          <p className="text-sm text-zinc-500 max-w-sm mt-1">
            Create a stream key inside the Admin Dashboard first to access verification hubs.
          </p>
        </div>
      )}
    </div>
  );
};
