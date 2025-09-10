const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check if users exist
    const users = await prisma.user.findMany({
      include: { role: true }
    });
    
    console.log(`📊 Found ${users.length} users in database:`);
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.role.name})`);
    });
    
    // Check if roles exist
    const roles = await prisma.role.findMany();
    console.log(`📊 Found ${roles.length} roles in database:`);
    roles.forEach(role => {
      console.log(`  - ${role.name}: ${role.description || 'No description'}`);
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();