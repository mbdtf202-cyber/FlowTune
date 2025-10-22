/**
 * Global Test Teardown
 * Cleans up the test environment after all tests complete
 */

import mongoose from 'mongoose';

export default async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Close database connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('✅ Database connection closed');
    }
    
    // Stop MongoDB Memory Server
    if (global.__MONGOD__) {
      await global.__MONGOD__.stop();
      console.log('✅ MongoDB Memory Server stopped');
    }
    
    console.log('✅ Test environment cleanup complete');
    
  } catch (error) {
    console.error('❌ Error during test cleanup:', error);
  }
}