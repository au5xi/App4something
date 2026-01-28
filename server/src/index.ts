import express from 'express';
import cors from 'cors';
import path from 'path';
// If you ever switch runtime to ESM, replace __dirname with:
//   import { fileURLToPath } from 'url';
//   const __filename = fileURLToPath(import.meta.url);
//   const __dirname = path.dirname(__filename);

import { config } from './config.js';

import authRoutes from './routes/authRoutes.js';
import meRoutes from './routes/meRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import userRoutes from './routes/userRoutes.js';
import friendRoutes from './routes/friendRoutes.js';
import statusRoutes from './routes/statusRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';

const app = express();

// --- Core middleware ---
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());

// --- Health check (keep this simple) ---
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// --- API routes ---
app.use('/api/auth', authRoutes);
app.use('/api/me', meRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/calendar', calendarRoutes);

// --- Static frontend + SPA fallback (after /api/*) ---
const clientDist = path.resolve(__dirname, '../../client-dist');

// Serve static assets (JS, CSS, images) built by Vite
app.use(express.static(clientDist));

// For any non-API path, send index.html (SPA routing)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

// --- Start server ---
app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
