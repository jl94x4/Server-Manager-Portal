
import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import https from 'https';
import { URL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Keep API port stable at 3002. Vite is at 3500.
const PORT = 3002;

const CONFIG_FILE = path.join(__dirname, 'subzero-config.json');
const HEALTH_FILE = path.join(__dirname, 'subzero-health.json');

const SPEED_TEST_CHUNK_SIZE = 1024 * 1024;
const SPEED_TEST_BUFFER = Buffer.alloc(SPEED_TEST_CHUNK_SIZE, 'x');

app.use(cors());
app.use(express.json());

// Simple Request Logger
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// --- Global State ---
let config = {
  services: [],
  groups: [
    { id: 'core', name: 'Core Infrastructure', order: 0 },
    { id: 'media', name: 'Media Stack', order: 1 },
    { id: 'downloads', name: 'Download Clients', order: 2 },
    { id: 'external', name: 'External Services', order: 3 },
  ],
  announcement: null
};

let healthData = {}; 

// --- API Endpoints (Defined EARLY) ---

// Heartbeat
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Get consolidated status
app.get('/api/status', (req, res) => {
  res.json({
    config,
    healthData
  });
});

app.get('/api/config', (req, res) => res.json(config));

app.post('/api/config', async (req, res) => {
  config = req.body;
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save config' });
  }
});

// Speed Test Endpoints
app.get('/api/speedtest/ping', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.send('pong');
});

app.get('/api/speedtest/download', (req, res) => {
  const bytes = parseInt(req.query.bytes) || SPEED_TEST_CHUNK_SIZE;
  res.set('Content-Type', 'application/octet-stream');
  res.set('Content-Length', bytes);
  res.set('Cache-Control', 'no-store');
  let sent = 0;
  const streamData = () => {
    if (sent >= bytes) return res.end();
    const remaining = bytes - sent;
    const chunk = remaining >= SPEED_TEST_CHUNK_SIZE ? SPEED_TEST_BUFFER : SPEED_TEST_BUFFER.subarray(0, remaining);
    const canContinue = res.write(chunk);
    sent += chunk.length;
    if (canContinue) setImmediate(streamData);
    else res.once('drain', streamData);
  };
  streamData();
});

app.post('/api/speedtest/upload', (req, res) => {
  req.on('data', () => {});
  req.on('end', () => res.sendStatus(200));
});

// --- File Persistence & Probe Logic ---
async function loadState() {
  try {
    const configData = await fs.readFile(CONFIG_FILE, 'utf-8');
    config = JSON.parse(configData);
  } catch (e) {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
  }

  try {
    const healthRaw = await fs.readFile(HEALTH_FILE, 'utf-8');
    healthData = JSON.parse(healthRaw);
  } catch (e) {
    healthData = {};
  }
}

async function saveHealth() {
  try {
    await fs.writeFile(HEALTH_FILE, JSON.stringify(healthData, null, 2));
  } catch (e) {}
}

function performSingleProbe(service) {
  return new Promise((resolve) => {
    const rawUrl = service.url;
    if (!rawUrl) return resolve({ status: 'offline', latency: 0, httpCode: 0 });

    let targetUrl = rawUrl;
    if (!/^https?:\/\//i.test(targetUrl)) targetUrl = 'http://' + targetUrl;
    if (service.port) {
       try {
         const u = new URL(targetUrl);
         u.port = service.port;
         targetUrl = u.toString();
       } catch(e) {}
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl);
    } catch (e) {
      return resolve({ status: 'offline', latency: 0, httpCode: 0 });
    }

    const lib = parsedUrl.protocol === 'https:' ? https : http;
    const start = Date.now();
    
    const request = lib.get(targetUrl, {
      headers: { 'User-Agent': 'SubZero-Monitor/1.0', 'Cache-Control': 'no-cache', 'Connection': 'close' },
      timeout: 8000, 
      rejectUnauthorized: false 
    }, (response) => {
      response.resume();
      const latency = Math.round(Date.now() - start);
      const code = response.statusCode || 0;
      let status = (code >= 200 && code < 400) || code === 401 || code === 403 ? 'online' : (code >= 500 ? 'degraded' : 'offline');
      resolve({ status, latency, httpCode: code });
    });

    request.on('error', () => resolve({ status: 'offline', latency: 0, httpCode: 0 }));
    request.on('timeout', () => { request.destroy(); resolve({ status: 'offline', latency: 0, httpCode: 408 }); });
  });
}

async function runMonitorCycle() {
  if (!config.services || config.services.length === 0) return;
  for (const service of config.services) {
    const result = await performSingleProbe(service);
    const timestamp = Date.now();
    if (!healthData[service.id]) {
      healthData[service.id] = { serviceId: service.id, currentStatus: 'unknown', lastCheck: 0, history: [], uptimePercentage: 100 };
    }
    const record = healthData[service.id];
    record.currentStatus = result.status;
    record.lastCheck = timestamp;
    record.history.push({ timestamp, ...result });
    if (record.history.length > 1000) record.history.shift();
    const onlineCount = record.history.filter(h => h.status === 'online').length;
    record.uptimePercentage = Math.round((onlineCount / record.history.length) * 100);
  }
  saveHealth();
}

setInterval(runMonitorCycle, 15000);

// Serve static in production
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', async () => {
  await loadState();
  console.log(`SubZero API Server running on port ${PORT}`);
  runMonitorCycle();
});
