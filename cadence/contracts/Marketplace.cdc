import NonFungibleToken from 0xf8d6e0586b0a20c7
import FungibleToken from 0xee82856bf20e2aa6
import FlowToken from 0x0ae53cb6e3f42a79
import MusicNFT from "./MusicNFT.cdc"

/// Marketplace - NFT Trading Contract for FlowTune
/// 
/// This contract enables users to list, buy, and sell MusicNFTs
/// with automatic royalty distribution to creators and collaborators.
///
pub contract Marketplace {

    /// Events
    pub event ContractInitialized()
    pub event NFTListed(id: UInt64, price: UFix64, seller: Address)
    pub event NFTUnlisted(id: UInt64, seller: Address)
    pub event NFTPurchased(id: UInt64, price: UFix64, seller: Address, buyer: Address)
    pub event RoyaltyDistributed(nftID: UInt64, recipient: Address, amount: UFix64)

    /// Named Paths
    pub let StorefrontStoragePath: StoragePath
    pub let StorefrontPublicPath: PublicPath

    /// Listing structure
    pub struct ListingDetails {
        pub let nftID: UInt64
        pub let nftType: Type
        pub let price: UFix64
        pub let seller: Address
        pub let listedAt: UFix64

        init(
            nftID: UInt64,
            nftType: Type,
            price: UFix64,
            seller: Address
        ) {
            self.nftID = nftID
            self.nftType = nftType
            self.price = price
            self.seller = seller
            self.listedAt = getCurrentBlock().timestamp
        }
    }

    /// Listing resource that holds the NFT for sale
    pub resource Listing {
        pub let details: ListingDetails
        access(self) let nft: @NonFungibleToken.NFT
        access(self) let saleCut: Capability<&{FungibleToken.Receiver}>

        init(
            nft: @NonFungibleToken.NFT,
            price: UFix64,
            saleCut: Capability<&{FungibleToken.Receiver}>
        ) {
            self.details = ListingDetails(
                nftID: nft.id,
                nftType: nft.getType(),
                price: price,
                seller: saleCut.address
            )
            self.nft <- nft
            self.saleCut = saleCut
        }

        /// Purchase the NFT
        pub fun purchase(
            payment: @FungibleToken.Vault,
            buyerCollection: &{NonFungibleToken.CollectionPublic},
            buyerAddress: Address
        ) {
            pre {
                payment.balance == self.details.price: "Payment does not match listing price"
                payment.isInstance(Type<@FlowToken.Vault>()): "Payment must be in Flow tokens"
            }

            // Get the NFT to access royalty information
            let nftRef = &self.nft as &NonFungibleToken.NFT
            let musicNFT = nftRef as! &MusicNFT.NFT

            // Calculate and distribute royalties
            var remainingPayment <- payment
            let totalRoyaltyPercentage = self.calculateTotalRoyalties(musicNFT.metadata.royalties)
            
            // Validate total royalties don't exceed 100%
            assert(totalRoyaltyPercentage <= 1.0, message: "Total royalties cannot exceed 100%")
            
            // Distribute royalties
            for royalty in musicNFT.metadata.royalties {
                let royaltyAmount = self.details.price * royalty.percentage
                let royaltyPayment <- remainingPayment.withdraw(amount: royaltyAmount)
                
                // Get recipient's Flow token receiver
                let recipient = getAccount(royalty.recipient)
                let receiverRef = recipient.getCapability(/public/flowTokenReceiver)
                    .borrow<&{FungibleToken.Receiver}>()
                    ?? panic("Could not borrow receiver reference for royalty recipient")
                
                receiverRef.deposit(from: <-royaltyPayment)
                
                emit RoyaltyDistributed(
                    nftID: self.details.nftID,
                    recipient: royalty.recipient,
                    amount: royaltyAmount
                )
            }

            // Send remaining payment to seller
            self.saleCut.borrow()!.deposit(from: <-remainingPayment)

            // Transfer NFT to buyer
            let nft <- self.nft
            buyerCollection.deposit(token: <-nft)

            // Update NFT earnings
            if let musicNFTRef = buyerCollection.borrowNFT(id: self.details.nftID) as? &MusicNFT.NFT {
                musicNFTRef.addEarnings(amount: self.details.price)
            }

            emit NFTPurchased(
                id: self.details.nftID,
                price: self.details.price,
                seller: self.details.seller,
                buyer: buyerAddress
            )
        }

        /// Calculate total royalty percentage
        access(self) fun calculateTotalRoyalties(_ royalties: [MusicNFT.Royalty]): UFix64 {
            var total: UFix64 = 0.0
            for royalty in royalties {
                total = total + royalty.percentage
            }
            return total
        }

        /// Get listing details
        pub fun getDetails(): ListingDetails {
            return self.details
        }

        destroy() {
            destroy self.nft
        }
    }

    /// Storefront interface for public access
    pub resource interface StorefrontPublic {
        pub fun getListingIDs(): [UInt64]
        pub fun borrowListing(listingID: UInt64): &Listing{StorefrontPublic}?
        pub fun purchase(
            listingID: UInt64,
            payment: @FungibleToken.Vault,
            buyerCollection: &{NonFungibleToken.CollectionPublic},
            buyerAddress: Address
        )
    }

    /// Storefront resource for managing listings
    pub resource Storefront: StorefrontPublic {
        access(self) var listings: @{UInt64: Listing}
        access(self) var nextListingID: UInt64
        access(self) var purchaseLock: Bool

        init() {
            self.listings <- {}
            self.nextListingID = 1
            self.purchaseLock = false
        }

        /// Create a new listing
        pub fun createListing(
            nft: @NonFungibleToken.NFT,
            price: UFix64,
            saleCut: Capability<&{FungibleToken.Receiver}>
        ): UInt64 {
            let listing <- create Listing(
                nft: <-nft,
                price: price,
                saleCut: saleCut
            )

            let listingID = self.nextListingID
            self.nextListingID = self.nextListingID + 1

            emit NFTListed(
                id: listing.getDetails().nftID,
                price: price,
                seller: saleCut.address
            )

            let oldListing <- self.listings[listingID] <- listing
            destroy oldListing

            return listingID
        }

        /// Remove a listing
        pub fun removeListing(listingID: UInt64): @NonFungibleToken.NFT {
            let listing <- self.listings.remove(key: listingID)
                ?? panic("Listing does not exist")

            emit NFTUnlisted(
                id: listing.getDetails().nftID,
                seller: listing.getDetails().seller
            )

            let nft <- listing.nft
            destroy listing
            return <-nft
        }

        /// Get all listing IDs
        pub fun getListingIDs(): [UInt64] {
            return self.listings.keys
        }

        /// Borrow a listing reference
        pub fun borrowListing(listingID: UInt64): &Listing? {
            if self.listings[listingID] != nil {
                return (&self.listings[listingID] as &Listing?)!
            }
            return nil
        }

        /// Purchase an NFT from a listing
        pub fun purchase(
            listingID: UInt64,
            payment: @FungibleToken.Vault,
            buyerCollection: &{NonFungibleToken.CollectionPublic},
            buyerAddress: Address
        ) {
            pre {
                !self.purchaseLock: "Purchase already in progress"
            }
            
            self.purchaseLock = true
            
            let listing <- self.listings.remove(key: listingID)
                ?? panic("Listing does not exist")

            listing.purchase(
                payment: <-payment,
                buyerCollection: buyerCollection,
                buyerAddress: buyerAddress
            )

            destroy listing
            
            self.purchaseLock = false
        }

        destroy() {
            destroy self.listings
        }
    }

    /// Create an empty Storefront
    pub fun createStorefront(): @Storefront {
        return <- create Storefront()
    }

    /// Contract initialization
    init() {
        self.StorefrontStoragePath = /storage/musicNFTStorefront
        self.StorefrontPublicPath = /public/musicNFTStorefront

        emit ContractInitialized()
    }
}