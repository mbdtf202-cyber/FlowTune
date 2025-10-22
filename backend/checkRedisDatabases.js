import Redis from 'ioredis';

async function checkRedisDatabases() {
  try {
    // Check databases 0-3
    for (let db = 0; db < 4; db++) {
      const redis = new Redis({
        host: 'localhost',
        port: 6379,
        db: db
      });
      
      const nftIds = await redis.smembers('nfts');
      const testValue = await redis.get('test:api');
      
      console.log(`Database ${db}:`);
      console.log(`  NFTs: ${nftIds.length}`);
      console.log(`  Test value: ${testValue}`);
      
      if (nftIds.length > 0) {
        console.log(`  First NFT ID: ${nftIds[0]}`);
        const nftData = await redis.get(`nft:${nftIds[0]}`);
        if (nftData) {
          console.log(`  First NFT title: ${nftData.title}`);
          console.log(`  First NFT isForSale: ${nftData.market?.isForSale}`);
        }
      }
      console.log('');
      
      await redis.disconnect();
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRedisDatabases();