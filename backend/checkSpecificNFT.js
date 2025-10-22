import Database from './src/config/database.js';
import MusicNFT from './src/models/MusicNFT.js';

async function checkSpecificNFT() {
  try {
    const nftId = 'fdc6aeb5-6cd6-4509-9929-b9a73466fd3c';
    
    console.log('Checking NFT ID:', nftId);
    
    // Check Redis data
    const redisData = await Database.get(`nft:${nftId}`);
    console.log('\nRedis data:');
    console.log('Title:', redisData?.title);
    console.log('Market isForSale:', redisData?.market?.isForSale);
    console.log('Market price:', redisData?.market?.price);
    
    // Check MusicNFT.findById
    const nftObject = await MusicNFT.findById(nftId);
    console.log('\nMusicNFT.findById result:');
    console.log('Title:', nftObject?.title);
    console.log('Market isForSale:', nftObject?.market?.isForSale);
    console.log('Market price:', nftObject?.market?.price);
    
    // Check if there are multiple NFTs with same title
    const allNFTs = await Database.smembers('nfts');
    const etherealDreamsNFTs = [];
    
    for (const id of allNFTs) {
      const nftData = await Database.get(`nft:${id}`);
      if (nftData && nftData.title === 'Ethereal Dreams') {
        etherealDreamsNFTs.push({
          id: id,
          isForSale: nftData.market?.isForSale,
          price: nftData.market?.price
        });
      }
    }
    
    console.log('\nAll "Ethereal Dreams" NFTs:');
    etherealDreamsNFTs.forEach((nft, index) => {
      console.log(`${index + 1}. ID: ${nft.id}, isForSale: ${nft.isForSale}, price: ${nft.price}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSpecificNFT();