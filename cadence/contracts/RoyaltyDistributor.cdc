import FungibleToken from 0xee82856bf20e2aa6
import FlowToken from 0x0ae53cb6e3f42a79
import MusicNFT from "./MusicNFT.cdc"

/// RoyaltyDistributor - Advanced Royalty Management for FlowTune
/// 
/// This contract handles complex royalty distributions including:
/// - Play-based royalties (streaming revenue)
/// - Time-based distributions (scheduled payments)
/// - Multi-tier royalty structures
///
pub contract RoyaltyDistributor {

    /// Events
    pub event ContractInitialized()
    pub event RoyaltyPoolCreated(nftID: UInt64, totalAmount: UFix64)
    pub event RoyaltyDistributed(nftID: UInt64, recipient: Address, amount: UFix64, reason: String)
    pub event PlayCountUpdated(nftID: UInt64, newCount: UInt64)
    pub event StreamingRevenueAdded(nftID: UInt64, amount: UFix64)

    /// Named Paths
    pub let DistributorStoragePath: StoragePath
    pub let DistributorPublicPath: PublicPath

    /// Revenue tracking structure
    pub struct RevenueRecord {
        pub let nftID: UInt64
        pub let amount: UFix64
        pub let source: String // "sale", "streaming", "licensing"
        pub let timestamp: UFix64
        pub let playCount: UInt64

        init(nftID: UInt64, amount: UFix64, source: String, playCount: UInt64) {
            self.nftID = nftID
            self.amount = amount
            self.source = source
            self.timestamp = getCurrentBlock().timestamp
            self.playCount = playCount
        }
    }

    /// Royalty pool for managing accumulated revenue
    pub resource RoyaltyPool {
        pub let nftID: UInt64
        pub var totalRevenue: UFix64
        pub var distributedAmount: UFix64
        pub var playCount: UInt64
        access(self) let vault: @FlowToken.Vault
        access(self) let revenueHistory: [RevenueRecord]

        init(nftID: UInt64) {
            self.nftID = nftID
            self.totalRevenue = 0.0
            self.distributedAmount = 0.0
            self.playCount = 0
            self.vault <- FlowToken.createEmptyVault() as! @FlowToken.Vault
            self.revenueHistory = []
        }

        /// Add revenue to the pool
        pub fun addRevenue(payment: @FungibleToken.Vault, source: String) {
            pre {
                payment.isInstance(Type<@FlowToken.Vault>()): "Payment must be Flow tokens"
            }

            let amount = payment.balance
            self.vault.deposit(from: <-payment)
            self.totalRevenue = self.totalRevenue + amount

            let record = RevenueRecord(
                nftID: self.nftID,
                amount: amount,
                source: source,
                playCount: self.playCount
            )
            self.revenueHistory.append(record)

            emit StreamingRevenueAdded(nftID: self.nftID, amount: amount)
        }

        /// Increment play count for streaming royalties
        pub fun incrementPlayCount() {
            self.playCount = self.playCount + 1
            emit PlayCountUpdated(nftID: self.nftID, newCount: self.playCount)
        }

        /// Distribute royalties based on play count
        pub fun distributePlayBasedRoyalties(
            royalties: [MusicNFT.Royalty],
            minPlayThreshold: UInt64
        ) {
            pre {
                self.playCount >= minPlayThreshold: "Play count below minimum threshold"
            }

            let availableAmount = self.vault.balance
            if availableAmount <= 0.0 {
                return
            }

            // Calculate distribution based on play count milestones
            let distributionAmount = self.calculatePlayBasedDistribution(availableAmount)
            
            for royalty in royalties {
                let royaltyAmount = distributionAmount * royalty.percentage
                if royaltyAmount > 0.0 {
                    let payment <- self.vault.withdraw(amount: royaltyAmount)
                    
                    let recipient = getAccount(royalty.recipient)
                    let receiverRef = recipient.getCapability(/public/flowTokenReceiver)
                        .borrow<&{FungibleToken.Receiver}>()
                        ?? panic("Could not borrow receiver reference")
                    
                    receiverRef.deposit(from: <-payment)
                    self.distributedAmount = self.distributedAmount + royaltyAmount

                    emit RoyaltyDistributed(
                        nftID: self.nftID,
                        recipient: royalty.recipient,
                        amount: royaltyAmount,
                        reason: "play-based distribution"
                    )
                }
            }
        }

        /// Calculate distribution amount based on play milestones
        access(self) fun calculatePlayBasedDistribution(_ availableAmount: UFix64): UFix64 {
            // Progressive distribution based on play count
            if self.playCount >= 10000 {
                return availableAmount * 0.5 // Distribute 50% for viral tracks
            } else if self.playCount >= 1000 {
                return availableAmount * 0.3 // Distribute 30% for popular tracks
            } else if self.playCount >= 100 {
                return availableAmount * 0.1 // Distribute 10% for emerging tracks
            }
            return 0.0
        }

        /// Get pool statistics
        pub fun getStats(): {String: AnyStruct} {
            return {
                "nftID": self.nftID,
                "totalRevenue": self.totalRevenue,
                "distributedAmount": self.distributedAmount,
                "availableBalance": self.vault.balance,
                "playCount": self.playCount,
                "revenueRecords": self.revenueHistory.length
            }
        }

        /// Get revenue history
        pub fun getRevenueHistory(): [RevenueRecord] {
            return self.revenueHistory
        }

        destroy() {
            destroy self.vault
        }
    }

    /// Distributor interface for public access
    pub resource interface DistributorPublic {
        pub fun addStreamingRevenue(nftID: UInt64, payment: @FungibleToken.Vault)
        pub fun incrementPlayCount(nftID: UInt64)
        pub fun getPoolStats(nftID: UInt64): {String: AnyStruct}?
        pub fun getRevenueHistory(nftID: UInt64): [RevenueRecord]?
    }

    /// Main distributor resource
    pub resource Distributor: DistributorPublic {
        access(self) let royaltyPools: @{UInt64: RoyaltyPool}

        init() {
            self.royaltyPools <- {}
        }

        /// Create a new royalty pool for an NFT
        pub fun createRoyaltyPool(nftID: UInt64) {
            pre {
                self.royaltyPools[nftID] == nil: "Royalty pool already exists for this NFT"
            }

            let pool <- create RoyaltyPool(nftID: nftID)
            emit RoyaltyPoolCreated(nftID: nftID, totalAmount: 0.0)
            
            let oldPool <- self.royaltyPools[nftID] <- pool
            destroy oldPool
        }

        /// Add streaming revenue to a specific NFT pool
        pub fun addStreamingRevenue(nftID: UInt64, payment: @FungibleToken.Vault) {
            let poolRef = self.borrowRoyaltyPool(nftID: nftID)
                ?? panic("Royalty pool does not exist for this NFT")
            
            poolRef.addRevenue(payment: <-payment, source: "streaming")
        }

        /// Increment play count for an NFT
        pub fun incrementPlayCount(nftID: UInt64) {
            let poolRef = self.borrowRoyaltyPool(nftID: nftID)
                ?? panic("Royalty pool does not exist for this NFT")
            
            poolRef.incrementPlayCount()
        }

        /// Distribute royalties for an NFT based on play count
        pub fun distributeRoyalties(
            nftID: UInt64,
            royalties: [MusicNFT.Royalty],
            minPlayThreshold: UInt64
        ) {
            let poolRef = self.borrowRoyaltyPool(nftID: nftID)
                ?? panic("Royalty pool does not exist for this NFT")
            
            poolRef.distributePlayBasedRoyalties(
                royalties: royalties,
                minPlayThreshold: minPlayThreshold
            )
        }

        /// Borrow a royalty pool reference
        access(self) fun borrowRoyaltyPool(nftID: UInt64): &RoyaltyPool? {
            return &self.royaltyPools[nftID] as &RoyaltyPool?
        }

        /// Get pool statistics
        pub fun getPoolStats(nftID: UInt64): {String: AnyStruct}? {
            if let poolRef = self.borrowRoyaltyPool(nftID: nftID) {
                return poolRef.getStats()
            }
            return nil
        }

        /// Get revenue history for an NFT
        pub fun getRevenueHistory(nftID: UInt64): [RevenueRecord]? {
            if let poolRef = self.borrowRoyaltyPool(nftID: nftID) {
                return poolRef.getRevenueHistory()
            }
            return nil
        }

        /// Get all managed NFT IDs
        pub fun getManagedNFTs(): [UInt64] {
            return self.royaltyPools.keys
        }

        destroy() {
            destroy self.royaltyPools
        }
    }

    /// Create a new distributor
    pub fun createDistributor(): @Distributor {
        return <- create Distributor()
    }

    /// Contract initialization
    init() {
        self.DistributorStoragePath = /storage/royaltyDistributor
        self.DistributorPublicPath = /public/royaltyDistributor

        emit ContractInitialized()
    }
}