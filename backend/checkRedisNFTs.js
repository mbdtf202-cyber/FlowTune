import Database from './src/config/database.js';

async function checkRedisNFTs() {
  try {
    const allNFTs = await Database.smembers('nfts');
    console.log(`Total NFTs in Redis: ${allNFTs.length}`);
    
    let forSaleCount = 0;
    let foundForSaleNFT = null;
    
    for (const nftId of allNFTs) {
      const nftData = await Database.get(`nft:${nftId}`);
      if (nftData && nftData.market && nftData.market.isForSale) {
        forSaleCount++;
        if (!foundForSaleNFT) {
          foundForSaleNFT = nftData;
          console.log('\nFirst NFT for sale found:');
          console.log('Title:', nftData.title);
          console.log('ID:', nftData.id);
          console.log('Market isForSale:', nftData.market.isForSale);
          console.log('Market price:', nftData.market.price);
          console.log('Market object:', nftData.market);
        }
      }
    }
    
    console.log(`\nTotal NFTs with isForSale=true: ${forSaleCount}`);
    
    if (forSaleCount === 0) {
      console.log('No NFT with isForSale=true found in Redis');
      // Let's check the first few NFTs
      console.log('\nChecking first 3 NFTs:');
      for (let i = 0; i < Math.min(3, allNFTs.length); i++) {
        const nftData = await Database.get(`nft:${allNFTs[i]}`);
        console.log(`NFT ${i+1}: ${nftData.title}, isForSale: ${nftData.market?.isForSale}`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRedisNFTs();