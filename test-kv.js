// Quick test to verify KV connection
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@vercel/kv');

const kv = createClient({
  url: process.env.REDIS_URL,
  token: process.env.KV_REST_API_TOKEN || 'not-needed-for-redis-url'
});

async function test() {
  try {
    console.log('Testing KV connection...');
    console.log('Using REDIS_URL:', process.env.REDIS_URL ? '✓ Found' : '✗ Missing');

    // Try to set a test value
    await kv.set('test-key', 'test-value');
    console.log('✓ Write test passed');

    // Try to get it back
    const value = await kv.get('test-key');
    console.log('✓ Read test passed. Value:', value);

    // Clean up
    await kv.del('test-key');
    console.log('✓ Delete test passed');

    console.log('\n✅ KV is working perfectly!');
    process.exit(0);
  } catch (error) {
    console.error('❌ KV test failed:', error.message);
    process.exit(1);
  }
}

test();
