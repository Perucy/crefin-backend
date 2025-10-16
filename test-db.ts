import { db, connectDatabase } from './src/config/database';

async function test() {
  try {
    console.log('Connecting to database...');
    await connectDatabase.connect();
    
    console.log('Testing query...');
    const users = await db.user.findMany();
    console.log('✓ Query successful! Users:', users.length);
    
    console.log('Creating test user...');
    const user = await db.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashed_password',
        firstName: 'Test',
        lastName: 'User',
        skills: ['web-dev', 'react']
      }
    });
    console.log('✓ User created!', user.id);
    
    console.log('Finding user...');
    const found = await db.user.findUnique({
      where: { email: 'test@example.com' }
    });
    console.log('✓ User found!', found?.firstName);
    
    console.log('Cleaning up...');
    await db.user.delete({
      where: { email: 'test@example.com' }
    });
    console.log('✓ Test user deleted');
    
    await connectDatabase.disconnect();
    console.log('✓✓✓ ALL TESTS PASSED! ✓✓✓');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

test();
