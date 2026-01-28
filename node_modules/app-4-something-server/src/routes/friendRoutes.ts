import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthedRequest } from '../middleware/authMiddleware.js';
import { prisma } from '../prisma.js';

const router = Router();

function friendIdsFrom(me: string, rows: { userAId: string; userBId: string }[]) {
  return rows.map((f) => (f.userAId === me ? f.userBId : f.userAId));
}

router.get('/', requireAuth, async (req: AuthedRequest, res) => {
  const me = req.userId!;
  const friendships = await prisma.friendship.findMany({
    where: { status: 'ACCEPTED', OR: [{ userAId: me }, { userBId: me }] },
    select: { userAId: true, userBId: true },
  });
  const ids = friendIdsFrom(me, friendships);

  const friends = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      homeLocation: true,
      customLocation: true,
      useCustomLocation: true,
      status: { select: { mode: true, text: true, updatedAt: true } },
    },
    orderBy: { name: 'asc' },
  });

  res.json({ friends });
});

router.get('/requests', requireAuth, async (req: AuthedRequest, res) => {
  const me = req.userId!;

  const pending = await prisma.friendship.findMany({
    where: { status: 'PENDING', userBId: me },
    include: { userA: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ received: pending.map((f) => ({ id: f.id, from: f.userA })) });
});

router.post('/request', requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({ userId: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const me = req.userId!;
  const other = parsed.data.userId;
  if (me === other) return res.status(400).json({ error: 'Cannot friend yourself' });

  const existing = await prisma.friendship.findFirst({
    where: { OR: [{ userAId: me, userBId: other }, { userAId: other, userBId: me }] },
  });

  if (existing) {
    if (existing.status === 'ACCEPTED') return res.status(409).json({ error: 'Already friends' });
    return res.status(409).json({ error: 'Friend request already pending' });
  }

  const request = await prisma.friendship.create({
    data: { userAId: me, userBId: other, status: 'PENDING' },
    select: { id: true, status: true },
  });

  res.json({ request });
});

router.post('/accept', requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({ requestId: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const me = req.userId!;
  const request = await prisma.friendship.findUnique({ where: { id: parsed.data.requestId } });
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (request.userBId !== me) return res.status(403).json({ error: 'Not your request' });

  const friendship = await prisma.friendship.update({
    where: { id: request.id },
    data: { status: 'ACCEPTED' },
  });

  res.json({ friendship });
});

router.post('/deny', requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({ requestId: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const me = req.userId!;
  const request = await prisma.friendship.findUnique({ where: { id: parsed.data.requestId } });
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (request.userBId !== me) return res.status(403).json({ error: 'Not your request' });

  await prisma.friendship.delete({ where: { id: request.id } });
  res.json({ ok: true });
});

export default router;
