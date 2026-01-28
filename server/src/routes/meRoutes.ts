import { Router } from 'express';
import { requireAuth, AuthedRequest } from '../middleware/authMiddleware.js';
import { prisma } from '../prisma.js';

const router = Router();

router.get('/', requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      avatarUrl: true,
      homeLocation: true,
      customLocation: true,
      useCustomLocation: true,
      status: { select: { mode: true, text: true, updatedAt: true } },
    },
  });
  res.json({ user });
});

export default router;
