import pg from 'pg';
import fs from 'fs';
import path from 'path';

// Let's create a local file path for fallback JSON persistence
const DATA_DIR = path.resolve('./data');
const JSON_DB_PATH = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Interfaces matching PostgreSQL tables
export interface UserRecord {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface StreamRecord {
  id: string;
  userId: number;
  title: string;
  broadcaster: string;
  streamKey: string;
  status: 'offline' | 'live' | 'disabled' | 'scheduled';
  scheduledStart?: string;
  rtmpUrl: string;
  resolution: string;
  bitrate: number;
  codec: string;
  ingestIp: string;
  viewers: number;
  startTime?: string;
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

// In-Memory Fallback State (persisted to data/db.json)
interface LocalDBState {
  users: UserRecord[];
  streams: StreamRecord[];
}

let localState: LocalDBState = {
  users: [],
  streams: [
    {
      id: '1',
      userId: 1,
      title: 'Late Night Coding Sessions',
      broadcaster: 'dev_alex',
      viewers: 1240,
      status: 'live',
      startTime: new Date().toISOString(),
      rtmpUrl: 'rtmp://154.12.88.2/live',
      streamKey: 'alex_secure_123',
      resolution: '1080p',
      ingestIp: '154.12.88.2',
      bitrate: 6000,
      codec: 'H.264'
    },
    {
      id: '2',
      userId: 1,
      title: 'E-Sports Tournament Qualifiers',
      broadcaster: 'pro_gaming_tv',
      viewers: 8520,
      status: 'live',
      startTime: new Date().toISOString(),
      rtmpUrl: 'rtmp://192.168.1.45/live',
      streamKey: 'tournament_alpha',
      resolution: '4K',
      ingestIp: '192.168.1.45',
      bitrate: 10000,
      codec: 'H.265'
    }
  ]
};

// Load saved data if exists
if (fs.existsSync(JSON_DB_PATH)) {
  try {
    const data = fs.readFileSync(JSON_DB_PATH, 'utf-8');
    localState = JSON.parse(data);
  } catch (err) {
    console.error('Error reading JSON DB fallback, using defaults', err);
  }
} else {
  // Create initial admin user
  // Password hash for 'admin123'
  // $2a$10$Xm3C0H5gLqGz7uB7wF8pZeGbyhS6F1mP689S5fV/M4V8L5Yn4O7yW
  localState.users.push({
    id: 1,
    username: 'admin',
    email: 'admin@streampulse.io',
    password_hash: '$2a$10$Xm3C0H5gLqGz7uB7wF8pZeGbyhS6F1mP689S5fV/M4V8L5Yn4O7yW',
    role: 'admin',
    created_at: new Date().toISOString()
  });
  fs.writeFileSync(JSON_DB_PATH, JSON.stringify(localState, null, 2));
}

// Function to save state to file
const saveLocalState = () => {
  try {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(localState, null, 2));
  } catch (err) {
    console.error('Error saving JSON DB fallback', err);
  }
};

// PostgreSQL configuration setup
const { Pool } = pg;
let pgPool: pg.Pool | null = null;
let usePostgres = false;

if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME) {
  try {
    pgPool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    usePostgres = true;
    console.log('PostgreSQL configuration found. Running database initializer...');
  } catch (err) {
    console.error('Failed to configure PostgreSQL pool, falling back to JSON storage.', err);
    usePostgres = false;
  }
} else {
  console.log('PostgreSQL env variables not set. Using secure local file-system persistence (data/db.json).');
}

// Database helper functions supporting both real Postgres and persistent JSON Fallback
export const db = {
  // Initialize Database tables if PostgreSQL is connected
  init: async () => {
    if (!usePostgres || !pgPool) return;
    try {
      const client = await pgPool.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(20) DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS streams (
            id VARCHAR(50) PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            broadcaster VARCHAR(100) NOT NULL,
            stream_key VARCHAR(100) UNIQUE NOT NULL,
            status VARCHAR(50) DEFAULT 'offline',
            scheduled_start TIMESTAMP,
            rtmp_url VARCHAR(255) NOT NULL,
            resolution VARCHAR(20) DEFAULT '1080p',
            bitrate INTEGER DEFAULT 4500,
            codec VARCHAR(20) DEFAULT 'H.264',
            ingest_ip VARCHAR(50) NOT NULL,
            viewers INTEGER DEFAULT 0,
            start_time TIMESTAMP
          );

          ALTER TABLE streams ADD COLUMN IF NOT EXISTS width INTEGER;
          ALTER TABLE streams ADD COLUMN IF NOT EXISTS height INTEGER;
          ALTER TABLE streams ADD COLUMN IF NOT EXISTS fps INTEGER;
          ALTER TABLE streams ADD COLUMN IF NOT EXISTS aspect_ratio VARCHAR(50);
          ALTER TABLE streams ADD COLUMN IF NOT EXISTS video_codec VARCHAR(50);
          ALTER TABLE streams ADD COLUMN IF NOT EXISTS audio_codec VARCHAR(50);
          ALTER TABLE streams ADD COLUMN IF NOT EXISTS preset VARCHAR(50);
          ALTER TABLE streams ADD COLUMN IF NOT EXISTS profile VARCHAR(50);
          ALTER TABLE streams ADD COLUMN IF NOT EXISTS pixel_format VARCHAR(50);
          ALTER TABLE streams ADD COLUMN IF NOT EXISTS enabled_profiles VARCHAR(255);
        `);
        console.log('PostgreSQL Database tables verified/created successfully.');
        
        // Seed default admin if table is empty
        const userCount = await client.query('SELECT COUNT(*) FROM users');
        if (parseInt(userCount.rows[0].count, 10) === 0) {
          await client.query(`
            INSERT INTO users (username, email, password_hash, role)
            VALUES ('admin', 'admin@streampulse.io', '$2a$10$Xm3C0H5gLqGz7uB7wF8pZeGbyhS6F1mP689S5fV/M4V8L5Yn4O7yW', 'admin')
          `);
          console.log('Seeded default admin account into PostgreSQL.');
        }
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('Error initializing PostgreSQL database, switching to file fallback:', err);
      usePostgres = false;
    }
  },

  // USERS
  getUserByUsername: async (username: string): Promise<UserRecord | null> => {
    if (usePostgres && pgPool) {
      const res = await pgPool.query('SELECT * FROM users WHERE username = $1', [username]);
      if (res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        username: r.username,
        email: r.email,
        password_hash: r.password_hash,
        role: r.role,
        created_at: r.created_at.toISOString()
      };
    }
    const user = localState.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    return user || null;
  },

  createUser: async (username: string, email: string, passwordHash: string, role: 'admin' | 'user' = 'user'): Promise<UserRecord> => {
    if (usePostgres && pgPool) {
      const res = await pgPool.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [username, email, passwordHash, role]
      );
      const r = res.rows[0];
      return {
        id: r.id,
        username: r.username,
        email: r.email,
        password_hash: r.password_hash,
        role: r.role,
        created_at: r.created_at.toISOString()
      };
    }
    const newUser: UserRecord = {
      id: localState.users.length > 0 ? Math.max(...localState.users.map(u => u.id)) + 1 : 1,
      username,
      email,
      password_hash: passwordHash,
      role,
      created_at: new Date().toISOString()
    };
    localState.users.push(newUser);
    saveLocalState();
    return newUser;
  },

  // STREAMS
  getStreams: async (): Promise<StreamRecord[]> => {
    if (usePostgres && pgPool) {
      const res = await pgPool.query('SELECT * FROM streams ORDER BY start_time DESC, id DESC');
      return res.rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        title: r.title,
        broadcaster: r.broadcaster,
        streamKey: r.stream_key,
        status: r.status,
        scheduledStart: r.scheduled_start ? r.scheduled_start.toISOString() : undefined,
        rtmpUrl: r.rtmp_url,
        resolution: r.resolution,
        bitrate: r.bitrate,
        codec: r.codec,
        ingestIp: r.ingest_ip,
        viewers: r.viewers,
        startTime: r.start_time ? r.start_time.toISOString() : undefined,
        width: r.width,
        height: r.height,
        fps: r.fps,
        aspectRatio: r.aspect_ratio,
        videoCodec: r.video_codec,
        audioCodec: r.audio_codec,
        preset: r.preset,
        profile: r.profile,
        pixelFormat: r.pixel_format,
        enabledProfiles: r.enabled_profiles
      }));
    }
    return localState.streams;
  },

  getStreamByKey: async (streamKey: string): Promise<StreamRecord | null> => {
    if (usePostgres && pgPool) {
      const res = await pgPool.query('SELECT * FROM streams WHERE stream_key = $1', [streamKey]);
      if (res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        userId: r.user_id,
        title: r.title,
        broadcaster: r.broadcaster,
        streamKey: r.stream_key,
        status: r.status,
        scheduledStart: r.scheduled_start ? r.scheduled_start.toISOString() : undefined,
        rtmpUrl: r.rtmp_url,
        resolution: r.resolution,
        bitrate: r.bitrate,
        codec: r.codec,
        ingestIp: r.ingest_ip,
        viewers: r.viewers,
        startTime: r.start_time ? r.start_time.toISOString() : undefined,
        width: r.width,
        height: r.height,
        fps: r.fps,
        aspectRatio: r.aspect_ratio,
        videoCodec: r.video_codec,
        audioCodec: r.audio_codec,
        preset: r.preset,
        profile: r.profile,
        pixelFormat: r.pixel_format,
        enabledProfiles: r.enabled_profiles
      };
    }
    return localState.streams.find(s => s.streamKey === streamKey) || null;
  },

  createStream: async (stream: Omit<StreamRecord, 'id' | 'viewers'>): Promise<StreamRecord> => {
    const id = Math.random().toString(36).substring(2, 11);
    if (usePostgres && pgPool) {
      await pgPool.query(
        `INSERT INTO streams 
         (id, user_id, title, broadcaster, stream_key, status, scheduled_start, rtmp_url, resolution, bitrate, codec, ingest_ip, viewers, start_time, width, height, fps, aspect_ratio, video_codec, audio_codec, preset, profile, pixel_format, enabled_profiles) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)`,
        [
          id,
          stream.userId,
          stream.title,
          stream.broadcaster,
          stream.streamKey,
          stream.status,
          stream.scheduledStart ? new Date(stream.scheduledStart) : null,
          stream.rtmpUrl,
          stream.resolution,
          stream.bitrate,
          stream.codec,
          stream.ingestIp,
          0,
          stream.startTime ? new Date(stream.startTime) : null,
          stream.width ?? null,
          stream.height ?? null,
          stream.fps ?? null,
          stream.aspectRatio ?? null,
          stream.videoCodec ?? null,
          stream.audioCodec ?? null,
          stream.preset ?? null,
          stream.profile ?? null,
          stream.pixelFormat ?? null,
          stream.enabledProfiles ?? null
        ]
      );
      return { ...stream, id, viewers: 0 };
    }
    const newStream: StreamRecord = { ...stream, id, viewers: 0 };
    localState.streams.unshift(newStream);
    saveLocalState();
    return newStream;
  },

  updateStream: async (id: string, updates: Partial<StreamRecord>): Promise<StreamRecord | null> => {
    if (usePostgres && pgPool) {
      // Formulate dynamic SQL query
      const keys = Object.keys(updates);
      if (keys.length === 0) return null;
      
      const setClause = keys.map((key, index) => {
        const pgKey = key === 'userId' ? 'user_id' :
                      key === 'streamKey' ? 'stream_key' :
                      key === 'scheduledStart' ? 'scheduled_start' :
                      key === 'rtmpUrl' ? 'rtmp_url' :
                      key === 'ingestIp' ? 'ingest_ip' :
                      key === 'startTime' ? 'start_time' : key.replace(/([A-Z])/g, "_$1").toLowerCase();
        return `${pgKey} = $${index + 2}`;
      }).join(', ');

      const vals = keys.map(k => {
        const val = (updates as any)[k];
        if (k === 'startTime' || k === 'scheduledStart') {
          return val ? new Date(val) : null;
        }
        return val;
      });

      await pgPool.query(`UPDATE streams SET ${setClause} WHERE id = $1`, [id, ...vals]);
      const res = await pgPool.query('SELECT * FROM streams WHERE id = $1', [id]);
      if (res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        userId: r.user_id,
        title: r.title,
        broadcaster: r.broadcaster,
        streamKey: r.stream_key,
        status: r.status,
        scheduledStart: r.scheduled_start ? r.scheduled_start.toISOString() : undefined,
        rtmpUrl: r.rtmp_url,
        resolution: r.resolution,
        bitrate: r.bitrate,
        codec: r.codec,
        ingestIp: r.ingest_ip,
        viewers: r.viewers,
        startTime: r.start_time ? r.start_time.toISOString() : undefined,
        width: r.width,
        height: r.height,
        fps: r.fps,
        aspectRatio: r.aspect_ratio,
        videoCodec: r.video_codec,
        audioCodec: r.audio_codec,
        preset: r.preset,
        profile: r.profile,
        pixelFormat: r.pixel_format,
        enabledProfiles: r.enabled_profiles
      };
    }

    const index = localState.streams.findIndex(s => s.id === id);
    if (index === -1) return null;
    localState.streams[index] = { ...localState.streams[index], ...updates };
    saveLocalState();
    return localState.streams[index];
  },

  deleteStream: async (id: string): Promise<boolean> => {
    if (usePostgres && pgPool) {
      const res = await pgPool.query('DELETE FROM streams WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    }
    const initialLen = localState.streams.length;
    localState.streams = localState.streams.filter(s => s.id !== id);
    if (localState.streams.length !== initialLen) {
      saveLocalState();
      return true;
    }
    return false;
  },

};
