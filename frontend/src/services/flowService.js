import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import config, { flowConfig } from '../config/environment';

// Output debug information
console.log('🔧 Flow Configuration Debug Info:');
console.log('Environment:', config.ENVIRONMENT);
console.log('Flow Network:', flowConfig.network);
console.log('Access Node:', flowConfig.accessNode);
console.log('Discovery Wallet:', flowConfig.discoveryWallet);
console.log('Local Mode:', flowConfig.localMode);

// Configure FCL only in non-local mode
if (!flowConfig.localMode) {
  // Configure FCL
  fcl.config({
    'flow.network': flowConfig.network,
    'accessNode.api': flowConfig.accessNode,
    'discovery.wallet': flowConfig.discoveryWallet,
    'app.detail.title': 'FlowTune',
    'app.detail.icon': 'https://flowtune.com/icon.png'
  });

  // Verify FCL configuration
  console.log('🔧 FCL Configuration Verification:');
  try {
    console.log('FCL Config:', {
      network: flowConfig.network,
      accessNode: flowConfig.accessNode,
      discoveryWallet: flowConfig.discoveryWallet
    });
  } catch (error) {
    console.error('FCL configuration verification failed:', error);
  }
} else {
  console.log('🏠 Local Development Mode: Skipping FCL configuration');
}

class FlowService {
  constructor() {
    this.isInitialized = false;
    this.currentUser = null;
    this.initPromise = null;
  }

  async init() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._performInit();
    return this.initPromise;
  }

  async _performInit() {
    try {
      console.log('🚀 Starting Flow service initialization...');
      console.log('🔧 Current configuration:', {
        network: flowConfig.network,
        accessNode: flowConfig.accessNode,
        discoveryWallet: flowConfig.discoveryWallet,
        environment: config.ENVIRONMENT,
        localMode: flowConfig.localMode
      });
      console.log('🌍 Environment variables:', {
        VITE_FLOW_NETWORK: import.meta.env.VITE_FLOW_NETWORK,
        VITE_FLOW_ACCESS_NODE: import.meta.env.VITE_FLOW_ACCESS_NODE,
        VITE_FLOW_DISCOVERY_WALLET: import.meta.env.VITE_FLOW_DISCOVERY_WALLET,
        VITE_LOCAL_DEV_MODE: import.meta.env.VITE_LOCAL_DEV_MODE,
        VITE_DISABLE_FLOW_NETWORK: import.meta.env.VITE_DISABLE_FLOW_NETWORK
      });
      
      // Skip network-related operations in local development mode
      if (flowConfig.localMode) {
        console.log('🏠 Local development mode: Skipping Flow network connection and user authentication');
        this.isInitialized = true;
        console.log('✅ Flow service initialization completed (local mode)');
        return;
      }
      
      // Listen for user authentication state changes
      fcl.currentUser.subscribe((user) => {
        this.currentUser = user;
        console.log('Flow user status updated:', user);
      });

      console.log('📡 Starting Flow network connection test...');
      // Test network connection
      await this.testConnection();

      this.isInitialized = true;
      console.log('✅ Flow service initialization completed');
    } catch (error) {
      console.error('❌ Flow service initialization failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      this.initPromise = null; // Reset to allow retry
      throw error;
    }
  }

  // Test Flow network connection
  async testConnection(retryCount = 0) {
    const maxRetries = 3;
    
    try {
      console.log(`🔄 Testing Flow connection (attempt ${retryCount + 1}/${maxRetries})`);
      
      // First check basic network connectivity
      try {
        await this.checkNetworkConnectivity();
        console.log('✅ Basic network connectivity check passed');
      } catch (error) {
        console.error('❌ Basic network connectivity check failed:', error.message);
        throw error;
      }

      console.log('🧪 Starting FCL connection test...');
      // Try executing a simple query to test FCL connection
      const result = await fcl.query({
        cadence: `
          pub fun main(): String {
            return "Hello Flow"
          }
        `
      });

      console.log('✅ FCL query successful:', result);
      return true;
    } catch (error) {
      console.error(`❌ Flow connection test failed (attempt ${retryCount + 1}/${maxRetries}):`, error);
      
      if (retryCount < maxRetries - 1) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.testConnection(retryCount + 1);
      }
      
      console.error('💥 All retries failed');
      throw error;
    }
  }

  // Flow access node connection check
  async checkProxyConnectivity() {
    try {
      console.log('🔍 Checking Flow access node connection');
      console.log('🌐 Using access node:', flowConfig.accessNode);
      
      // Create AbortController for timeout control
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ Access node request timeout, aborting...');
        controller.abort();
      }, 10000); // 10 second timeout
      
      const testUrl = `${flowConfig.accessNode}/v1/blocks/sealed`;
      console.log('📤 Sending request to:', testUrl);
      
      const response = await window.fetch.bind(window)(testUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('📥 Received response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Flow access node connection successful, block data:', data);
        return { success: true, data };
      } else {
        const errorText = await response.text();
        console.error('❌ Flow access node response error:', response.status, errorText);
        throw new Error(`Flow access node HTTP error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Flow access node connection failed:', error);
      if (error.name === 'AbortError') {
        throw new Error('Flow access node request timeout');
      }
      throw new Error(`Unable to connect to Flow access node (${error.message})`);
    }
  }

  // Network connectivity check
  async checkNetworkConnectivity() {
    try {
      console.log('🔍 Checking Flow REST API connection');
      console.log('🌐 Using access node:', flowConfig.accessNode);
      
      // Create AbortController for timeout control
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ Network request timeout, aborting...');
        controller.abort();
      }, 10000); // 10 second timeout
      
      const testUrl = `${flowConfig.accessNode}/v1/network/parameters`;
      console.log('📤 Sending network request to:', testUrl);
      
      const response = await window.fetch.bind(window)(testUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('📥 Received response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });
      
      if (response.ok) {
        console.log('✅ Flow REST API connection normal');
        return true;
      } else {
        console.warn('⚠️ Flow REST API response exception:', response.status, response.statusText);
        throw new Error(`Unable to connect to Flow REST API endpoint, please check your network connection (HTTP ${response.status})`);
      }
    } catch (error) {
      console.error('❌ Flow network connectivity check failed:', error);
      if (error.name === 'AbortError') {
        throw new Error(`Unable to connect to Flow REST API endpoint, please check your network connection (request timeout)`);
      }
      throw new Error(`Unable to connect to Flow REST API endpoint, please check your network connection (${error.message})`);
    }
  }

  // 账户设置
  async setupAccount() {
    try {
      const txId = await fcl.mutate({
        cadence: `
          import NonFungibleToken from 0x1d7e57aa55817448
          import MusicNFT from 0xf8d6e0586b0a20c7
          import Marketplace from 0xf8d6e0586b0a20c7
          import RoyaltyDistributor from 0xf8d6e0586b0a20c7

          transaction {
            prepare(signer: AuthAccount) {
              // Setup MusicNFT Collection if it doesn't exist
              if signer.borrow<&MusicNFT.Collection>(from: MusicNFT.CollectionStoragePath) == nil {
                let collection <- MusicNFT.createEmptyCollection()
                signer.save(<-collection, to: MusicNFT.CollectionStoragePath)
                
                signer.link<&MusicNFT.Collection{NonFungibleToken.CollectionPublic, MusicNFT.MusicNFTCollectionPublic}>(
                  MusicNFT.CollectionPublicPath,
                  target: MusicNFT.CollectionStoragePath
                )
              }

              // Setup Marketplace Storefront if it doesn't exist
              if signer.borrow<&Marketplace.Storefront>(from: Marketplace.StorefrontStoragePath) == nil {
                let storefront <- Marketplace.createStorefront()
                signer.save(<-storefront, to: Marketplace.StorefrontStoragePath)
                
                signer.link<&Marketplace.Storefront{Marketplace.StorefrontPublic}>(
                  Marketplace.StorefrontPublicPath,
                  target: Marketplace.StorefrontStoragePath
                )
              }

              // Setup RoyaltyDistributor if it doesn't exist
              if signer.borrow<&RoyaltyDistributor.Distributor>(from: RoyaltyDistributor.DistributorStoragePath) == nil {
                let distributor <- RoyaltyDistributor.createDistributor()
                signer.save(<-distributor, to: RoyaltyDistributor.DistributorStoragePath)
                
                signer.link<&RoyaltyDistributor.Distributor{RoyaltyDistributor.DistributorPublic}>(
                  RoyaltyDistributor.DistributorPublicPath,
                  target: RoyaltyDistributor.DistributorStoragePath
                )
              }
            }

            execute {
              log("Account setup completed successfully")
            }
          }
        `,
        proposer: fcl.currentUser,
        payer: fcl.currentUser,
        authorizations: [fcl.currentUser],
        limit: 1000
      });

      return txId;
    } catch (error) {
      console.error('Account setup failed:', error);
      throw error;
    }
  }

  // User authentication
  async authenticate() {
    try {
      const user = await fcl.authenticate();
      return user;
    } catch (error) {
      console.error('Flow authentication failed:', error);
      throw error;
    }
  }

  // 用户登出
  async unauthenticate() {
    try {
      await fcl.unauthenticate();
    } catch (error) {
      console.error('Flow logout failed:', error);
      throw error;
    }
  }

  // 获取当前用户
  getCurrentUser() {
    return this.currentUser;
  }

  // 获取当前区块高度
  async getCurrentBlockHeight() {
    try {
      const result = await fcl.query({
        cadence: `
          access(all) fun main(): UInt64 {
            return getCurrentBlock().height
          }
        `
      });
      return result;
    } catch (error) {
      console.error('Failed to get block height:', error);
      throw error;
    }
  }

  // 获取账户信息
  async getAccount(address) {
    try {
      const account = await fcl.account(address);
      return account;
    } catch (error) {
      console.error('Failed to get account info:', error);
      throw error;
    }
  }

  // 获取账户余额
  async getBalance(address) {
    try {
      const script = `
        import FlowToken from 0x1654653399040a61

        access(all) fun main(address: Address): UFix64 {
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

      return balance;
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  // 创建NFT
  async createNFT(metadata) {
    try {
      const transaction = `
        import FlowTuneNFT from ${flowConfig.contracts.FlowTuneNFT}
        import NonFungibleToken from 0x1d7e57aa55817448

        transaction(
          recipient: Address,
          title: String,
          artist: String,
          description: String,
          audioUrl: String,
          coverImageUrl: String,
          genre: String,
          duration: UFix64,
          price: UFix64
        ) {
          let minter: &FlowTuneNFT.NFTMinter

          prepare(signer: AuthAccount) {
            self.minter = signer.borrow<&FlowTuneNFT.NFTMinter>(from: FlowTuneNFT.MinterStoragePath)
              ?? panic("Could not borrow a reference to the NFT minter")
          }

          execute {
            let metadata = FlowTuneNFT.Metadata(
              title: title,
              artist: artist,
              description: description,
              audioUrl: audioUrl,
              coverImageUrl: coverImageUrl,
              genre: genre,
              duration: duration,
              price: price,
              createdAt: getCurrentBlock().timestamp
            )

            self.minter.mintNFT(recipient: recipient, metadata: metadata)
          }
        }
      `;

      const txId = await fcl.mutate({
        cadence: transaction,
        args: (arg, t) => [
          arg(this.currentUser.addr, t.Address),
          arg(metadata.title, t.String),
          arg(metadata.artist, t.String),
          arg(metadata.description, t.String),
          arg(metadata.audioUrl, t.String),
          arg(metadata.coverImageUrl, t.String),
          arg(metadata.genre, t.String),
          arg(metadata.duration.toString(), t.UFix64),
          arg(metadata.price.toString(), t.UFix64)
        ],
        proposer: fcl.currentUser,
        payer: fcl.currentUser,
        authorizations: [fcl.currentUser],
        limit: 1000
      });

      const transaction_result = await fcl.tx(txId).onceSealed();
      return transaction_result;
    } catch (error) {
      console.error('Failed to create NFT:', error);
      throw error;
    }
  }

  // 获取用户的NFT集合
  async getUserNFTs(address) {
    try {
      const script = `
        import FlowTuneNFT from ${flowConfig.contracts.FlowTuneNFT}
        import NonFungibleToken from 0x1d7e57aa55817448

        pub fun main(address: Address): [FlowTuneNFT.NFTData] {
          let account = getAccount(address)
          let collectionRef = account.getCapability(FlowTuneNFT.CollectionPublicPath)
            .borrow<&{FlowTuneNFT.FlowTuneNFTCollectionPublic}>()
            ?? panic("Could not borrow capability from public collection")
          
          let ids = collectionRef.getIDs()
          let nfts: [FlowTuneNFT.NFTData] = []
          
          for id in ids {
            let nft = collectionRef.borrowFlowTuneNFT(id: id)
            if nft != nil {
              nfts.append(nft!.getData())
            }
          }
          
          return nfts
        }
      `;

      const nfts = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(address, t.Address)]
      });

      return nfts;
    } catch (error) {
      console.error('Failed to get user NFTs:', error);
      throw error;
    }
  }

  // 获取市场上的NFT
  async getMarketNFTs() {
    try {
      const script = `
        import FlowTuneMarket from ${flowConfig.contracts.FlowTuneMarket}
        import FlowTuneNFT from ${flowConfig.contracts.FlowTuneNFT}

        access(all) fun main(): [FlowTuneMarket.SaleData] {
          return FlowTuneMarket.getSaleOffers()
        }
      `;

      const sales = await fcl.query({
        cadence: script
      });

      return sales;
    } catch (error) {
      console.error('Failed to get market NFTs:', error);
      throw error;
    }
  }

  // 购买NFT
  async purchaseNFT(saleId, price) {
    try {
      const transaction = `
        import FlowTuneMarket from ${flowConfig.contracts.FlowTuneMarket}
        import FlowToken from 0x1654653399040a61
        import FungibleToken from 0xf233dcee88fe0abe

        transaction(saleId: UInt64, price: UFix64) {
          let paymentVault: @FungibleToken.Vault
          let buyer: Address

          prepare(signer: AuthAccount) {
            self.buyer = signer.address
            
            let vaultRef = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
              ?? panic("Could not borrow reference to the owner's Vault!")
            
            self.paymentVault <- vaultRef.withdraw(amount: price)
          }

          execute {
            FlowTuneMarket.purchase(
              saleId: saleId,
              buyerAddress: self.buyer,
              payment: <-self.paymentVault
            )
          }
        }
      `;

      const txId = await fcl.mutate({
        cadence: transaction,
        args: (arg, t) => [
          arg(saleId.toString(), t.UInt64),
          arg(price.toString(), t.UFix64)
        ],
        proposer: fcl.currentUser,
        payer: fcl.currentUser,
        authorizations: [fcl.currentUser],
        limit: 1000
      });

      const transaction_result = await fcl.tx(txId).onceSealed();
      return transaction_result;
    } catch (error) {
      console.error('Failed to purchase NFT:', error);
      throw error;
    }
  }

  // 上架NFT到市场
  async listNFTForSale(nftId, price) {
    try {
      const transaction = `
        import FlowTuneMarket from ${flowConfig.contracts.FlowTuneMarket}
        import FlowTuneNFT from ${flowConfig.contracts.FlowTuneNFT}
        import NonFungibleToken from 0x1d7e57aa55817448

        transaction(nftId: UInt64, price: UFix64) {
          let sellerCollection: &FlowTuneNFT.Collection
          let marketplace: &FlowTuneMarket.Marketplace

          prepare(signer: AuthAccount) {
            self.sellerCollection = signer.borrow<&FlowTuneNFT.Collection>(from: FlowTuneNFT.CollectionStoragePath)
              ?? panic("Could not borrow seller's collection")
            
            self.marketplace = signer.borrow<&FlowTuneMarket.Marketplace>(from: FlowTuneMarket.MarketplaceStoragePath)
              ?? panic("Could not borrow marketplace")
          }

          execute {
            let nft <- self.sellerCollection.withdraw(withdrawID: nftId) as! @FlowTuneNFT.NFT
            self.marketplace.listForSale(nft: <-nft, price: price)
          }
        }
      `;

      const txId = await fcl.mutate({
        cadence: transaction,
        args: (arg, t) => [
          arg(nftId.toString(), t.UInt64),
          arg(price.toString(), t.UFix64)
        ],
        proposer: fcl.currentUser,
        payer: fcl.currentUser,
        authorizations: [fcl.currentUser],
        limit: 1000
      });

      const transaction_result = await fcl.tx(txId).onceSealed();
      return transaction_result;
    } catch (error) {
      console.error('Failed to list NFT for sale:', error);
      throw error;
    }
  }

  // Listen to blockchain events
  async subscribeToEvents(eventType, callback) {
    try {
      // Event listening logic can be implemented here
      // Flow currently mainly gets events through polling or WebSocket
      console.log(`Subscribe to event: ${eventType}`);
    } catch (error) {
      console.error('Failed to subscribe to events:', error);
      throw error;
    }
  }

  // Get transaction status
  async getTransactionStatus(txId) {
    try {
      const transaction = await fcl.tx(txId).snapshot();
      return transaction;
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      throw error;
    }
  }

  // Wait for transaction confirmation
  async waitForTransaction(txId) {
    try {
      const transaction = await fcl.tx(txId).onceSealed();
      return transaction;
    } catch (error) {
      console.error('Failed to wait for transaction confirmation:', error);
      throw error;
    }
  }
}

// Create singleton instance
let flowServiceInstance = null;

export const getFlowService = () => {
  if (!flowServiceInstance) {
    flowServiceInstance = new FlowService();
  }
  return flowServiceInstance;
};

export default getFlowService();

// Export commonly used FCL functions
export {
  fcl,
  t
};