
export interface StreamSession {
  id: string;
  title: string;
  broadcaster: string;
  viewers: number;
  status: 'live' | 'offline' | 'scheduled' | 'disabled';
  startTime: string;
  scheduledStart?: string; // ISO string for future streams
  rtmpUrl: string;
  streamKey: string;
  thumbnailUrl: string;
  resolution: string;
  ingestIp: string;
  bitrate?: number; // in Kbps
  codec?: string;
  width?: number;
  height?: number;
  fps?: number;
  aspectRatio?: string;
  videoCodec?: string;
  audioCodec?: string;
  preset?: string;
  profile?: string;
  pixelFormat?: string;
  enabledProfiles?: string;
}

export interface StreamStats {
  cpuUsage: number;
  memoryUsage: number;
  activeStreams: number;
  totalBandwidth: string;
}

export interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: string;
  isAi?: boolean;
}
