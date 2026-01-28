import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthedRequest } from '../middleware/authMiddleware.js';
import { prisma } from '../prisma.js';
import { dayBucketUTC, addDaysUTC } from '../utils/date.js';

const router = Router();

router.put('/summary', requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({
    mode: z.enum(['OFF', 'GENERAL', 'SPECIFIC']),
    text: z.string().max(64).optional().nullable(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { mode, text } = parsed.data;
  if (mode === 'SPECIFIC' && (!text || text.trim().length === 0)) {
    return res.status(400).json({ error: 'text is required for SPECIFIC status' });
  }

  const status = await prisma.userStatus.upsert({
    where: { userId: req.userId! },
    update: { mode, text: mode === 'SPECIFIC' ? text!.trim() : null },
    create: { userId: req.userId!, mode, text: mode === 'SPECIFIC' ? text!.trim() : null },
  });

  res.json({ status });
});

// Get 4-week availability
router.get('/availability', requireAuth, async (req: AuthedRequest, res) => {
  const me = req.userId!;
  const start = dayBucketUTC(new Date());
  const end = addDaysUTC(start, 28);

  const rows = await prisma.userAvailability.findMany({
    where: { userId: me, date: { gte: start, lt: end } },
    orderBy: { date: 'asc' },
    select: { date: true, isUp: true, upText: true },
  });

  // Fill missing dates
  const map = new Map(rows.map(r => [r.date.toISOString(), r]));
  const days = [] as { date: string; isUp: boolean; upText: string | null }[];
  for (let i = 0; i < 28; i++) {
    const d = addDaysUTC(start, i);
    const key = d.toISOString();
    const r = map.get(key);
    days.push({ date: key, isUp: r?.isUp ?? false, upText: (r?.upText ?? null) });
  }

  res.json({ start: start.toISOString(), days });
});

router.put('/availability', requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({
    days: z.array(z.object({
      date: z.string().datetime(),
      isUp: z.boolean(),
      upText: z.string().max(64).optional().nullable(),
    })).min(1).max(28)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const me = req.userId!;

  // Upsert each day
  for (const d of parsed.data.days) {
    await prisma.userAvailability.upsert({
      where: { userId_date: { userId: me, date: new Date(d.date) } },
      update: { isUp: d.isUp, upText: d.isUp ? (d.upText ?? null) : null },
      create: { userId: me, date: new Date(d.date), isUp: d.isUp, upText: d.isUp ? (d.upText ?? null) : null },
    });
  }

  res.json({ ok: true });
});

export default router;
