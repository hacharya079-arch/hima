
export interface StreamSession {
  id: string;
  title: string;
  broadcaster: string;
  viewers: number;
  status: 'live' | 'offline';
  startTime: string;
  rtmpUrl: string;
  streamKey: string;
  thumbnailUrl: string;
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
