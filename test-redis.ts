import { connectRedis, getCache, setCache } from './src/config/redis';

async function test() {
  try {
    await connectRedis.connect();
    
    // Test set
    await setCache('test:key', { message: 'Hello Redis!' }, 60);
    console.log('✓ Cached value set');
    
    // Test get
    const value = await getCache('test:key');
    console.log('✓ Retrieved value:', value);
    
    await connectRedis.disconnect();
    console.log('✓ Redis test passed!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

test();
