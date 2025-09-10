const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // First, create a role if it doesn't exist
    let participantRole = await prisma.role.findUnique({
      where: { name: 'PARTICIPANT' }
    });

    if (!participantRole) {
      participantRole = await prisma.role.create({
        data: {
          name: 'PARTICIPANT',
          description: 'Contest participant role'
        }
      });
      console.log('✅ Created PARTICIPANT role');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('test123', 10);

    // Create test user
    const testUser = await prisma.user.upsert({
      where: { username: 'test_user' },
      update: {
        password: hashedPassword,
        displayName: 'Test User'
      },
      create: {
        username: 'test_user',
        displayName: 'Test User',
        password: hashedPassword,
        roleId: participantRole.id
      }
    });

    console.log('✅ Test user created/updated:', {
      id: testUser.id,
      username: testUser.username,
      displayName: testUser.displayName,
      roleId: testUser.roleId
    });

    // Create admin user as well
    let adminRole = await prisma.role.findUnique({
      where: { name: 'ADMIN' }
    });

    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          name: 'ADMIN',
          description: 'Administrator role'
        }
      });
      console.log('✅ Created ADMIN role');
    }

    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {
        password: adminPassword,
        displayName: 'Administrator'
      },
      create: {
        username: 'admin',
        displayName: 'Administrator',
        password: adminPassword,
        roleId: adminRole.id
      }
    });

    console.log('✅ Admin user created/updated:', {
      id: adminUser.id,
      username: adminUser.username,
      displayName: adminUser.displayName,
      roleId: adminUser.roleId
    });

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();