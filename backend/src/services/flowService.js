/**
 * Flow Blockchain Service
 * Handles NFT minting and blockchain interactions on Flow
 */

import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import logger from '../utils/logger.js';

class FlowService {
  constructor() {
    this.isInitialized = false;
    this.network = process.env.FLOW_NETWORK || 'emulator';
    this.privateKey = process.env.FLOW_PRIVATE_KEY;
    this.address = process.env.FLOW_ADDRESS || '0xf8d6e0586b0a20c7';
    this.accessNode = process.env.FLOW_ACCESS_NODE || 'http://localhost:8888';
    this.contractAddress = '0xf8d6e0586b0a20c7';
    this.contractName = 'BasicMusicNFT';
    

    
    this.init();
  }

  /**
   * Initialize Flow configuration
   */
  init() {
    try {
      // Configure FCL
      fcl.config({
        'accessNode.api': this.accessNode,
        'discovery.wallet': this.network === 'emulator' 
          ? 'http://localhost:8701/fcl/authn' 
          : this.network === 'mainnet' 
            ? 'https://fcl-discovery.onflow.org/authn' 
            : 'https://fcl-discovery.onflow.org/testnet/authn',
        'flow.network': this.network
      });

      // Validate configuration
      if (!this.privateKey || 
          this.privateKey === 'your_flow_private_key_here' || 
          this.privateKey === 'emulator_service_account_key') {
        logger.warn('Flow private key not configured, using mock mode');
        this.isInitialized = false;
      } else {
        this.isInitialized = true;
        logger.info(`Flow service initialized for ${this.network} network`);
      }
    } catch (error) {
      logger.error('Flow service initialization failed:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Check if Flow service is properly configured
   */
  isConfigured() {
    return this.isInitialized && this.address;
  }

  /**
   * Create authorization function for transactions
   */
  createAuthz() {
    if (this.network === 'emulator') {
      // For emulator, use the service account
      return fcl.authz;
    }
    
    // For testnet/mainnet, would need proper key management
    return fcl.authz;
  }

  /**
   * Mint a music NFT on Flow blockchain
   */
  async mintMusicNFT(params) {
    const {
      recipient,
      title,
      description,
      audioHash,
      coverImageHash,
      metadataHash,
      royalties = []
    } = params;

    try {
      if (!this.isConfigured()) {
        logger.info('Flow not configured, using mock minting');
        return await this.mockMintNFT(params);
      }

      logger.info(`🔗 Minting NFT on Flow blockchain for: ${recipient}`);

      // Cadence transaction for minting
      const mintTransaction = `
        import BasicMusicNFT from 0x${this.contractAddress.replace('0x', '')}

        transaction(
          recipient: Address,
          title: String,
          artist: String,
          description: String,
          audioURL: String,
          coverImageURL: String,
          duration: UFix64,
          genre: String
        ) {
          let minter: &BasicMusicNFT.NFTMinter
          let recipientCollection: &{BasicMusicNFT.CollectionPublic}

          prepare(signer: AuthAccount) {
            self.minter = signer.borrow<&BasicMusicNFT.NFTMinter>(from: BasicMusicNFT.MinterStoragePath)
              ?? panic("Could not borrow a reference to the NFT minter")

            self.recipientCollection = getAccount(recipient)
              .getCapability(BasicMusicNFT.CollectionPublicPath)
              .borrow<&{BasicMusicNFT.CollectionPublic}>()
              ?? panic("Could not get receiver reference to the NFT Collection")
          }

          execute {
            let metadata = BasicMusicNFT.MusicMetadata(
              title: title,
              artist: artist,
              description: description,
              audioURL: audioURL,
              coverImageURL: coverImageURL,
              duration: duration,
              genre: genre
            )

            self.minter.mintNFT(
              recipient: self.recipientCollection,
              metadata: metadata
            )
          }
        }
      `;

      // Execute transaction
      const transactionId = await fcl.mutate({
        cadence: mintTransaction,
        args: (arg, t) => [
          arg(recipient, t.Address),
          arg(title, t.String),
          arg(params.artist || 'FlowTune AI', t.String),
          arg(description, t.String),
          arg(params.audioURL || `https://ipfs.io/ipfs/${audioHash}`, t.String),
          arg(params.coverImageURL || `https://ipfs.io/ipfs/${coverImageHash}`, t.String),
          arg(params.duration || 180.0, t.UFix64),
          arg(params.genre || 'AI Generated', t.String)
        ],
        proposer: this.createAuthz(),
        payer: this.createAuthz(),
        authorizations: [this.createAuthz()],
        limit: 1000
      });

      // Wait for transaction to be sealed
      const transaction = await fcl.tx(transactionId).onceSealed();
      
      if (transaction.status === 4) { // SEALED
        // Extract token ID from events
        const mintEvent = transaction.events.find(e => 
          e.type.includes('BasicMusicNFT.Minted') || e.type.includes('BasicMusicNFT.Deposit')
        );
        
        const tokenId = mintEvent ? mintEvent.data.id : null;

        logger.info(`✅ NFT minted successfully: Token ID ${tokenId}, TX: ${transactionId}`);

        return {
          success: true,
          tokenId: tokenId,
          transactionId: transactionId,
          blockHeight: transaction.blockId,
          gasUsed: transaction.gasUsed || 0,
          status: 'minted'
        };
      } else {
        throw new Error(`Transaction failed with status: ${transaction.status}`);
      }

    } catch (error) {
      logger.error('Flow NFT minting failed:', error);
      
      // Fallback to mock if real minting fails
      if (this.isConfigured()) {
        logger.info('Falling back to mock minting due to error');
        return await this.mockMintNFT(params);
      }
      
      throw error;
    }
  }

  /**
   * Mock NFT minting for development/testing
   */
  async mockMintNFT(params) {
    const { recipient, title } = params;
    
    logger.info(`🎭 Mock minting NFT: ${title} for ${recipient}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockResult = {
      success: true,
      tokenId: Math.floor(Math.random() * 1000000),
      transactionId: `0x${Math.random().toString(16).substr(2, 64)}`,
      blockHeight: Math.floor(Math.random() * 1000000) + 1000000,
      gasUsed: Math.floor(Math.random() * 100000) + 50000,
      status: 'minted',
      isMock: true
    };

    logger.info(`✅ Mock NFT minted: Token ID ${mockResult.tokenId}`);
    return mockResult;
  }

  /**
   * Get NFT details by token ID
   */
  async getNFTDetails(tokenId) {
    try {
      if (!this.isConfigured()) {
        return this.getMockNFTDetails(tokenId);
      }

      const script = `
        import MusicNFT from 0x${this.address.replace('0x', '')}
        import MetadataViews from 0x1d7e57aa55817448

        pub fun main(tokenId: UInt64): MusicNFT.MusicMetadata? {
          let collection = getAccount(0x${this.address.replace('0x', '')})
            .getCapability(MusicNFT.CollectionPublicPath)
            .borrow<&{MusicNFT.MusicNFTCollectionPublic}>()
            ?? panic("Could not borrow collection reference")

          if let nft = collection.borrowMusicNFT(id: tokenId) {
            return nft.getMetadata()
          }
          return nil
        }
      `;

      const result = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(tokenId, t.UInt64)]
      });

      return result;
    } catch (error) {
      logger.error('Error getting NFT details:', error);
      return this.getMockNFTDetails(tokenId);
    }
  }

  /**
   * Mock NFT details for development
   */
  getMockNFTDetails(tokenId) {
    return {
      tokenId: tokenId,
      title: `Mock Music NFT #${tokenId}`,
      description: 'A mock music NFT for development',
      audioHash: 'QmMockAudioHash123',
      coverImageHash: 'QmMockImageHash456',
      metadataHash: 'QmMockMetadataHash789',
      owner: this.address || '0x1234567890abcdef',
      isMock: true
    };
  }

  /**
   * Get account balance
   */
  async getAccountBalance(address) {
    try {
      if (!this.isConfigured()) {
        return { balance: '100.0', currency: 'FLOW', isMock: true };
      }

      const script = `
        import FlowToken from 0x1654653399040a61

        pub fun main(address: Address): UFix64 {
          let account = getAccount(address)
          let vaultRef = account.getCapability(/public/flowTokenBalance)
            .borrow<&FlowToken.Vault{FlowToken.Balance}>()
            ?? panic("Could not borrow Balance reference to the Vault")

          return vaultRef.balance
        }
      `;

      const balance = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(address, t.Address)]
      });

      return {
        balance: balance.toString(),
        currency: 'FLOW',
        isMock: false
      };
    } catch (error) {
      logger.error('Error getting account balance:', error);
      return { balance: '0.0', currency: 'FLOW', error: error.message };
    }
  }

  /**
   * List NFT for sale
   */
  async listNFTForSale(params) {
    const { tokenId, price, seller } = params;

    try {
      if (!this.isConfigured()) {
        return this.mockListNFT(params);
      }

      logger.info(`📝 Listing NFT ${tokenId} for sale at ${price} FLOW`);

      // This would implement the actual marketplace listing transaction
      // For now, return mock result
      return this.mockListNFT(params);

    } catch (error) {
      logger.error('Error listing NFT for sale:', error);
      throw error;
    }
  }

  /**
   * Mock NFT listing
   */
  async mockListNFT(params) {
    const { tokenId, price } = params;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      listingId: `listing_${tokenId}_${Date.now()}`,
      tokenId: tokenId,
      price: price,
      status: 'listed',
      isMock: true
    };
  }

  /**
   * Purchase NFT from marketplace
   */
  async purchaseNFT(params) {
    const { tokenId, price, seller, buyer, currency = 'FLOW' } = params;

    try {
      if (!this.isConfigured()) {
        return this.mockPurchaseNFT(params);
      }

      logger.info(`💰 Purchasing NFT ${tokenId} for ${price} ${currency}`);

      // This would implement the actual marketplace purchase transaction
      // For now, return mock result
      return this.mockPurchaseNFT(params);

    } catch (error) {
      logger.error('Error purchasing NFT:', error);
      throw error;
    }
  }

  /**
   * Mock NFT purchase
   */
  async mockPurchaseNFT(params) {
    const { tokenId, price, seller, buyer, currency = 'FLOW' } = params;
    
    // Simulate transaction processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      tokenId: tokenId,
      price: price,
      currency: currency,
      seller: seller,
      buyer: buyer,
      status: 'completed',
      isMock: true
    };
  }

  /**
   * Remove NFT from marketplace
   */
  async removeNFTFromSale(params) {
    const { tokenId, owner } = params;

    try {
      if (!this.isConfigured()) {
        return this.mockRemoveFromSale(params);
      }

      logger.info(`📤 Removing NFT ${tokenId} from sale`);

      // This would implement the actual marketplace removal transaction
      // For now, return mock result
      return this.mockRemoveFromSale(params);

    } catch (error) {
      logger.error('Error removing NFT from sale:', error);
      throw error;
    }
  }

  /**
   * Mock NFT removal from sale
   */
  async mockRemoveFromSale(params) {
    const { tokenId } = params;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      tokenId: tokenId,
      status: 'removed',
      isMock: true
    };
  }
}

export default new FlowService();