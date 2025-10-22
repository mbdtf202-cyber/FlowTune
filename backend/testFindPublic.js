import MusicNFT from './src/models/MusicNFT.js';

async function testFindPublic() {
  try {
    console.log('Testing MusicNFT.findPublic...');
    const nfts = await MusicNFT.findPublic(10, 0);
    console.log(`Found ${nfts.length} public NFTs`);
    
    if (nfts.length > 0) {
      console.log('\nFirst NFT details:');
      const nft = nfts[0];
      console.log('Title:', nft.title);
      console.log('ID:', nft.id);
      console.log('Market object:', nft.market);
      console.log('Market isForSale:', nft.market?.isForSale);
      console.log('Market price:', nft.market?.price);
      
      // Check how many are for sale
      let forSaleCount = 0;
      nfts.forEach((nft, index) => {
        if (nft.market && nft.market.isForSale) {
          forSaleCount++;
          if (forSaleCount <= 3) {
            console.log(`NFT ${index + 1} for sale: ${nft.title}, price: ${nft.market.price}`);
          }
        }
      });
      console.log(`\nTotal NFTs for sale from findPublic: ${forSaleCount}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testFindPublic();