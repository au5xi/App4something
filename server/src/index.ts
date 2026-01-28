import express from 'express';
import cors from 'cors';
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

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/me', meRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/calendar', calendarRoutes);

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
