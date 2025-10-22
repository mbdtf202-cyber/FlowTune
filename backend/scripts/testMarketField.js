#!/usr/bin/env node

import MusicNFT from '../src/models/MusicNFT.js';
import logger from '../src/utils/logger.js';

async function testMarketField() {
  try {
    console.log('Testing market field...');
    
    // Create a test NFT with isForSale: true
    const testNFT = new MusicNFT({
      title: "Test Market NFT",
      description: "Testing market field",
      creator: "0xTestCreator",
      owner: "0xTestOwner",
      music: {
        duration: 180,
        genre: "Electronic",
        bpm: 120,
        key: "C",
        mood: "energetic",
        instruments: ["synthesizer", "drums"],
        tags: ["electronic", "test"]
      },
      market: {
        price: "5.0",
        currency: "FLOW",
        isForSale: true,
        saleType: "fixed"
      },
      status: 'minted',
      visibility: 'public',
      isActive: true
    });
    
    console.log('Before save - market.isForSale:', testNFT.market.isForSale);
    console.log('Before save - market.price:', testNFT.market.price);
    
    // Save the NFT
    await testNFT.save();
    console.log('NFT saved with ID:', testNFT.id);
    
    // Retrieve the NFT
    const retrievedNFT = await MusicNFT.findById(testNFT.id);
    if (retrievedNFT) {
      console.log('After retrieve - market.isForSale:', retrievedNFT.market.isForSale);
      console.log('After retrieve - market.price:', retrievedNFT.market.price);
      console.log('Market object:', JSON.stringify(retrievedNFT.market, null, 2));
    } else {
      console.log('Failed to retrieve NFT');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testMarketField();