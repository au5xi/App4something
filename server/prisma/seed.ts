import { PrismaClient, UpStatusMode } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function dayBucket(d: Date) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  return x;
}

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = [
    { name: 'Alice', email: 'alice@example.com', homeLocation: 'Home' },
    { name: 'Bob', email: 'bob@example.com', homeLocation: 'Home' },
    { name: 'Charlie', email: 'charlie@example.com', homeLocation: 'Home' }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        homeLocation: u.homeLocation,
        status: { create: { mode: UpStatusMode.OFF } },
      }
    });
  }

  const alice = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
  const bob = await prisma.user.findUnique({ where: { email: 'bob@example.com' } });
  const charlie = await prisma.user.findUnique({ where: { email: 'charlie@example.com' } });

  // Friends: Alice <-> Bob accepted, Alice -> Charlie pending (for demo)
  if (alice && bob) {
    await prisma.friendship.upsert({
      where: { userAId_userBId: { userAId: alice.id, userBId: bob.id } },
      update: { status: 'ACCEPTED' },
      create: { userAId: alice.id, userBId: bob.id, status: 'ACCEPTED' },
    });
  }
  if (alice && charlie) {
    // Create only if not exists in either direction
    const existing = await prisma.friendship.findFirst({
      where: { OR: [
        { userAId: alice.id, userBId: charlie.id },
        { userAId: charlie.id, userBId: alice.id },
      ] }
    });
    if (!existing) {
      await prisma.friendship.create({ data: { userAId: alice.id, userBId: charlie.id, status: 'PENDING' } });
    }
  }

  // Bob is up for sauna (general status + availability)
  if (bob) {
    await prisma.userStatus.upsert({
      where: { userId: bob.id },
      update: { mode: UpStatusMode.SPECIFIC, text: 'sauna' },
      create: { userId: bob.id, mode: UpStatusMode.SPECIFIC, text: 'sauna' }
    });

    const today = dayBucket(new Date());
    for (let i = 0; i < 28; i++) {
      const d = new Date(today.getTime() + i * 24 * 3600 * 1000);
      const isUp = (i % 3 === 0);
      await prisma.userAvailability.upsert({
        where: { userId_date: { userId: bob.id, date: d } },
        update: { isUp, upText: isUp ? 'sauna' : null },
        create: { userId: bob.id, date: d, isUp, upText: isUp ? 'sauna' : null }
      });
    }
  }

  
// Create a sample event hosted by Alice and invite Bob & Charlie
  if (alice && bob && charlie) {
    const start = new Date(Date.now() + 2 * 3600 * 1000);
    const event = await prisma.event.create({
      data: {
        hostId: alice.id,
        activity: 'Board games',
        location: 'Alice's place',
        notes: 'Bring snacks if you can!',
        imageUrl: 'https://example.com/placeholder.jpg',
        startTime: start,
        isInstant: false,
        isPotential: false,
        participants: {
          create: [
            { userId: alice.id, role: 'HOST', status: 'JOINED' },
            { userId: bob.id, role: 'GUEST', status: 'INVITED' },
            { userId: charlie.id, role: 'GUEST', status: 'INVITED' },
          ]
        }
      }
    });

    await prisma.shoutMessage.create({
      data: {
        eventId: event.id,
        userId: alice.id,
        message: 'Who's in?',
      }
    });
  }


  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
