import MusicNFT from './src/models/MusicNFT.js';
import Database from './src/config/database.js';

async function debugNFTSave() {
  try {
    console.log('🔍 Debugging NFT save process...');
    
    // Connect to database
    await Database.connect();
    console.log('✅ Database connected:', Database.isConnected);
    
    // Create a simple test NFT
    const testNFT = {
      title: 'Debug Test NFT',
      description: 'A test NFT for debugging save process',
      creator: 'debug-creator',
      owner: 'debug-creator',
      music: {
        duration: 120,
        genre: 'Test',
        bpm: 120,
        key: 'C Major',
        mood: 'Test',
        instruments: ['Test'],
        tags: ['debug', 'test']
      },
      market: {
        price: '5.0',
        currency: 'FLOW',
        isForSale: true,
        saleType: 'fixed'
      },
      status: 'minted',
      visibility: 'public'
    };
    
    console.log('📝 Creating NFT instance...');
    const nft = new MusicNFT(testNFT);
    console.log('✅ NFT instance created with ID:', nft.id);
    
    // Check if NFT exists before save
    const existsBefore = await Database.exists(`nft:${nft.id}`);
    console.log('🔍 NFT exists before save:', existsBefore);
    
    // Check nfts set before save
    const nftIdsBefore = await Database.smembers('nfts');
    console.log('📊 NFT IDs before save:', nftIdsBefore.length);
    
    console.log('💾 Saving NFT...');
    
    // Save with detailed error handling
    try {
      const savedNFT = await nft.save();
      console.log('✅ NFT save completed');
      console.log('📋 Saved NFT ID:', savedNFT.id);
    } catch (saveError) {
      console.error('❌ Error during NFT save:', saveError);
      throw saveError;
    }
    
    // Verify save results
    console.log('🔍 Verifying save results...');
    
    // Check if NFT exists after save
    const existsAfter = await Database.exists(`nft:${nft.id}`);
    console.log('✅ NFT exists after save:', existsAfter);
    
    // Check nfts set after save
    const nftIdsAfter = await Database.smembers('nfts');
    console.log('📊 NFT IDs after save:', nftIdsAfter.length);
    
    if (nftIdsAfter.includes(nft.id)) {
      console.log('✅ NFT ID found in nfts set');
    } else {
      console.log('❌ NFT ID NOT found in nfts set');
    }
    
    // Try to retrieve the NFT data
    const retrievedData = await Database.get(`nft:${nft.id}`);
    if (retrievedData) {
      console.log('✅ NFT data retrieved successfully');
      console.log('📋 Retrieved title:', retrievedData.title);
      console.log('📋 Retrieved isForSale:', retrievedData.market?.isForSale);
    } else {
      console.log('❌ Failed to retrieve NFT data');
    }
    
    // Check visibility index
    const publicNFTs = await Database.smembers('nfts:visibility:public');
    console.log('📊 Public NFTs count:', publicNFTs.length);
    
    if (publicNFTs.includes(nft.id)) {
      console.log('✅ NFT found in public visibility index');
    } else {
      console.log('❌ NFT NOT found in public visibility index');
    }
    
    await Database.disconnect();
    console.log('🎉 Debug completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Debug failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

debugNFTSave();