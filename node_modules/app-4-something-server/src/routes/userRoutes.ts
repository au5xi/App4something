import { Router } from 'express';
import { requireAuth, AuthedRequest } from '../middleware/authMiddleware.js';
import { prisma } from '../prisma.js';

const router = Router();

// Live search users (starts at 3 chars)
router.get('/search', requireAuth, async (req: AuthedRequest, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 3) return res.json({ users: [] });

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        { email: { contains: q } },
      ],
      NOT: { id: req.userId! },
    },
    take: 10,
    select: { id: true, name: true, email: true, avatarUrl: true },
  });

  res.json({ users });
});

export default router;
