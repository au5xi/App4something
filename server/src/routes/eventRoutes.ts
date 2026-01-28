import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthedRequest } from '../middleware/authMiddleware.js';
import { prisma } from '../prisma.js';

const router = Router();

function visibleToUserWhere(userId: string) {
  return {
    OR: [
      { hostId: userId },
      { cohosts: { some: { userId } } },
      { participants: { some: { userId } } },
    ],
  };
}

router.get('/next', requireAuth, async (req: AuthedRequest, res) => {
  const me = req.userId!;
  const now = new Date();
  const next = await prisma.event.findFirst({
    where: { ...visibleToUserWhere(me), startTime: { gte: now } },
    orderBy: { startTime: 'asc' },
    include: { host: { select: { id: true, name: true } } },
  });
  res.json({ event: next });
});

// List events (private visibility)
router.get('/', requireAuth, async (req: AuthedRequest, res) => {
  const me = req.userId!;
  const now = new Date(Date.now() - 1000 * 60 * 60 * 24); // show since yesterday

  const events = await prisma.event.findMany({
    where: { ...visibleToUserWhere(me), startTime: { gte: now } },
    orderBy: { startTime: 'asc' },
    take: 100,
    include: {
      host: { select: { id: true, name: true, avatarUrl: true } },
      cohosts: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      participants: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
    }
  });

  res.json({ events });
});

// Create event
router.post('/', requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({
    activity: z.string().min(2).max(64),
    startTime: z.string().datetime().optional(),
    isInstant: z.boolean().default(false),
    isPotential: z.boolean().optional().default(false),
    location: z.string().max(80).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
    imageUrl: z.string().max(512).optional().nullable(),
    inviteeIds: z.array(z.string()).optional().default([]),
    cohostIds: z.array(z.string()).optional().default([]),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const me = req.userId!;
  const p = parsed.data;

  // Instant: schedule for day created (startTime = now)
  const startTime = p.isInstant ? new Date() : new Date(p.startTime || new Date().toISOString());

  const invitees = Array.from(new Set((p.inviteeIds || []).filter((id) => id && id !== me)));
  const cohosts = Array.from(new Set((p.cohostIds || []).filter((id) => id && id !== me)));

  const event = await prisma.event.create({
    data: {
      hostId: me,
      activity: p.activity,
      startTime,
      isInstant: !!p.isInstant,
      isPotential: !!p.isPotential,
      location: p.location?.trim() || null,
      notes: p.notes?.trim() || null,
      imageUrl: p.imageUrl?.trim() || null,
      cohosts: { create: cohosts.map((userId) => ({ userId })) },
      participants: {
        create: [
          { userId: me, role: 'HOST', status: 'JOINED' },
          ...cohosts.map((userId) => ({ userId, role: 'COHOST' as const, status: 'JOINED' as const })),
          ...invitees.filter((id) => !cohosts.includes(id)).map((userId) => ({ userId, role: 'GUEST' as const, status: 'INVITED' as const })),
        ],
      },
    },
    include: {
      host: { select: { id: true, name: true, avatarUrl: true } },
      cohosts: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      participants: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
    },
  });

  res.json({ event });
});

// Get event details (private)
router.get('/:id', requireAuth, async (req: AuthedRequest, res) => {
  const me = req.userId!;
  const id = req.params.id;

  const event = await prisma.event.findFirst({
    where: { id, ...visibleToUserWhere(me) },
    include: {
      host: { select: { id: true, name: true, avatarUrl: true } },
      cohosts: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      participants: { include: { user: { select: { id: true, name: true, avatarUrl: true } } }, orderBy: { createdAt: 'asc' } },
      shouts: { include: { user: { select: { id: true, name: true, avatarUrl: true } } }, orderBy: { createdAt: 'asc' } },
    }
  });

  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json({ event });
});

// Respond to invitation / interest / join
router.post('/:id/respond', requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({ status: z.enum(['INTERESTED', 'JOINED', 'DECLINED']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const me = req.userId!;
  const eventId = req.params.id;

  const existing = await prisma.eventParticipant.findUnique({
    where: { eventId_userId: { eventId, userId: me } },
  });
  if (!existing) return res.status(404).json({ error: 'You are not invited to this event' });

  const updated = await prisma.eventParticipant.update({
    where: { eventId_userId: { eventId, userId: me } },
    data: { status: parsed.data.status },
  });

  res.json({ participant: updated });
});

router.post('/:id/shout', requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({ message: z.string().min(1).max(500) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const me = req.userId!;
  const eventId = req.params.id;

  // Ensure visibility
  const canSee = await prisma.event.findFirst({ where: { id: eventId, ...visibleToUserWhere(me) }, select: { id: true } });
  if (!canSee) return res.status(404).json({ error: 'Event not found' });

  const shout = await prisma.shoutMessage.create({
    data: { eventId, userId: me, message: parsed.data.message.trim() },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });

  res.json({ shout });
});

export default router;
