import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthedRequest } from '../middleware/authMiddleware.js';
import { prisma } from '../prisma.js';

const router = Router();

router.put('/', requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({
    bio: z.string().max(280).optional().nullable(),
    avatarUrl: z.string().max(512).optional().nullable(),
    homeLocation: z.string().max(80).optional().nullable(),
    customLocation: z.string().max(80).optional().nullable(),
    useCustomLocation: z.boolean().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const data = parsed.data;
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: {
      bio: data.bio ?? undefined,
      avatarUrl: data.avatarUrl ?? undefined,
      homeLocation: data.homeLocation ?? undefined,
      customLocation: data.customLocation ?? undefined,
      useCustomLocation: data.useCustomLocation ?? undefined,
    },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      avatarUrl: true,
      homeLocation: true,
      customLocation: true,
      useCustomLocation: true,
    }
  });

  res.json({ user });
});

export default router;
