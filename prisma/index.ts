import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client (this handles connection automatically)
const prisma = new PrismaClient();

// Ensure DATABASE_URL is set in your environment variables
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be a Neon Postgres connection string');
}

// Prisma will automatically manage connections, you don't need to call `connect` explicitly.

async function main() {
  // Example of using Prisma to get data from your Notification model
  const notifications = await prisma.notification.findMany({
    where: { status: 'pending' },
    include: { user: true, trip: true, driver: true }
  });

  console.log('Notifications:', notifications);
}

// Run the main function
main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    // Disconnect Prisma when done
    await prisma.$disconnect();
  });

export { prisma };

