import { Router } from 'express';
import { requireAuth, AuthedRequest } from '../middleware/authMiddleware.js';
import { prisma } from '../prisma.js';
import { dayBucketUTC, addDaysUTC } from '../utils/date.js';

const router = Router();

router.get('/friends', requireAuth, async (req: AuthedRequest, res) => {
  const me = req.userId!;
  const ids = String(req.query.ids || '').split(',').map(s => s.trim()).filter(Boolean);
  if (ids.length === 0) return res.json({ friends: [] });

  // verify these are actually friends
  const friendships = await prisma.friendship.findMany({
    where: { status: 'ACCEPTED', OR: [{ userAId: me }, { userBId: me }] },
    select: { userAId: true, userBId: true },
  });
  const friendSet = new Set(friendships.map(f => (f.userAId === me ? f.userBId : f.userAId)));
  const allowed = ids.filter(id => friendSet.has(id));

  const start = dayBucketUTC(new Date());
  const end = addDaysUTC(start, 28);

  const friends = await prisma.user.findMany({
    where: { id: { in: allowed } },
    select: { id: true, name: true, avatarUrl: true },
    orderBy: { name: 'asc' },
  });

  const availability = await prisma.userAvailability.findMany({
    where: { userId: { in: allowed }, date: { gte: start, lt: end } },
    select: { userId: true, date: true, isUp: true, upText: true },
  });

  const byUser = new Map<string, Map<string, any>>();
  for (const a of availability) {
    if (!byUser.has(a.userId)) byUser.set(a.userId, new Map());
    byUser.get(a.userId)!.set(a.date.toISOString(), a);
  }

  const payload = friends.map(f => {
    const map = byUser.get(f.id) || new Map();
    const days = [] as { date: string; isUp: boolean; upText: string | null }[];
    for (let i = 0; i < 28; i++) {
      const d = addDaysUTC(start, i);
      const r = map.get(d.toISOString());
      days.push({ date: d.toISOString(), isUp: r?.isUp ?? false, upText: r?.upText ?? null });
    }
    return { ...f, days };
  });

  res.json({ start: start.toISOString(), friends: payload });
});

export default router;
