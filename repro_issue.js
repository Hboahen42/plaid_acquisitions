import { createUser } from './src/services/auth.service.js';
import logger from './src/config/logger.js';

async function testCreateUser() {
  const email = `test-${Date.now()}@example.com`;
  try {
    console.log(`Attempting to create user with email: ${email}`);
    const user = await createUser({
      name: 'Test User',
      email: email,
      password: 'password123',
      role: 'user'
    });
    console.log('User created successfully:', user);
  } catch (error) {
    console.error('Failed to create user:', error);
  }
}

testCreateUser();
