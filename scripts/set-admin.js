/**
 * Script to set a user as admin
 * Usage: node scripts/set-admin.js <user-email>
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setAdmin(email) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'admin' },
    });

    console.log(`✅ Successfully set ${email} as admin`);
    console.log(`User: ${updatedUser.name || 'N/A'} (${updatedUser.email})`);
    console.log(`Role: ${updatedUser.role}`);
  } catch (error) {
    console.error('Error setting admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address');
  console.log('Usage: node scripts/set-admin.js <user-email>');
  process.exit(1);
}

setAdmin(email);
