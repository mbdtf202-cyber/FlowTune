import Database from './src/config/database.js';

async function testDatabase() {
  try {
    console.log('Testing Database connection...');
    
    // Connect to database
    await Database.connect();
    
    console.log('Database connected:', Database.isConnected);
    console.log('Database healthy:', Database.isHealthy());
    
    // Test set and get
    await Database.set('test:database', 'working');
    const testValue = await Database.get('test:database');
    console.log('Test value:', testValue);
    
    // Test sadd and smembers
    await Database.sadd('test:set', 'item1', 'item2', 'item3');
    const setMembers = await Database.smembers('test:set');
    console.log('Set members:', setMembers);
    
    // Check existing NFTs
    const nftIds = await Database.smembers('nfts');
    console.log('NFT IDs in database:', nftIds.length);
    
    if (nftIds.length > 0) {
      console.log('First NFT ID:', nftIds[0]);
      const nftData = await Database.get(`nft:${nftIds[0]}`);
      console.log('First NFT data exists:', !!nftData);
    }
    
    await Database.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Database test error:', error);
    process.exit(1);
  }
}

testDatabase();