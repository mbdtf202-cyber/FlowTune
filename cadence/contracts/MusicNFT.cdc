import NonFungibleToken from 0xf8d6e0586b0a20c7
import MetadataViews from 0xf8d6e0586b0a20c7
import FungibleToken from 0xee82856bf20e2aa6

/// MusicNFT - AI-Generated Music NFT Contract for FlowTune
/// 
/// This contract implements music NFTs with built-in royalty distribution
/// and metadata management for AI-generated music content.
///
pub contract MusicNFT: NonFungibleToken {

    /// Total supply of MusicNFTs in existence
    pub var totalSupply: UInt64

    /// Events
    pub event ContractInitialized()
    pub event Withdraw(id: UInt64, from: Address?)
    pub event Deposit(id: UInt64, to: Address?)
    pub event Minted(id: UInt64, recipient: Address, metadata: {String: AnyStruct})
    pub event RoyaltyPaid(nftID: UInt64, recipient: Address, amount: UFix64)

    /// Named Paths
    pub let CollectionStoragePath: StoragePath
    pub let CollectionPublicPath: PublicPath
    pub let MinterStoragePath: StoragePath

    /// Royalty structure for revenue sharing
    pub struct Royalty {
        pub let recipient: Address
        pub let percentage: UFix64 // Percentage as decimal (0.1 = 10%)
        pub let description: String

        init(recipient: Address, percentage: UFix64, description: String) {
            pre {
                percentage >= 0.0 && percentage <= 1.0: "Percentage must be between 0 and 1"
            }
            self.recipient = recipient
            self.percentage = percentage
            self.description = description
        }
    }

    /// Music metadata structure
    pub struct MusicMetadata {
        pub let title: String
        pub let artist: String
        pub let description: String
        pub let audioURL: String
        pub let coverImageURL: String
        pub let genre: String
        pub let duration: UInt32 // Duration in seconds
        pub let aiModel: String // AI model used for generation
        pub let prompt: String // Original AI prompt
        pub let generatedAt: UFix64
        pub let royalties: [Royalty]

        init(
            title: String,
            artist: String, 
            description: String,
            audioURL: String,
            coverImageURL: String,
            genre: String,
            duration: UInt32,
            aiModel: String,
            prompt: String,
            royalties: [Royalty]
        ) {
            pre {
                title.length > 0: "Title cannot be empty"
                artist.length > 0: "Artist cannot be empty"
                audioURL.length > 0: "Audio URL cannot be empty"
                coverImageURL.length > 0: "Cover image URL cannot be empty"
                duration > 0: "Duration must be greater than 0"
                aiModel.length > 0: "AI model cannot be empty"
                prompt.length > 0: "Prompt cannot be empty"
            }
            self.title = title
            self.artist = artist
            self.description = description
            self.audioURL = audioURL
            self.coverImageURL = coverImageURL
            self.genre = genre
            self.duration = duration
            self.aiModel = aiModel
            self.prompt = prompt
            self.generatedAt = getCurrentBlock().timestamp
            self.royalties = royalties
        }
    }

    /// The core NFT resource
    pub resource NFT: NonFungibleToken.INFT, MetadataViews.Resolver {
        pub let id: UInt64
        pub let metadata: MusicMetadata
        pub var playCount: UInt64
        pub var totalEarnings: UFix64

        init(
            id: UInt64,
            metadata: MusicMetadata
        ) {
            self.id = id
            self.metadata = metadata
            self.playCount = 0
            self.totalEarnings = 0.0
        }

        /// Increment play count (for royalty calculation)
        pub fun incrementPlayCount() {
            self.playCount = self.playCount + 1
        }

        /// Add earnings to total
        pub fun addEarnings(amount: UFix64) {
            self.totalEarnings = self.totalEarnings + amount
        }

        /// MetadataViews.Resolver implementation
        pub fun getViews(): [Type] {
            return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.Royalties>(),
                Type<MetadataViews.ExternalURL>(),
                Type<MetadataViews.NFTCollectionData>(),
                Type<MetadataViews.NFTCollectionDisplay>()
            ]
        }

        pub fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    return MetadataViews.Display(
                        name: self.metadata.title,
                        description: self.metadata.description,
                        thumbnail: MetadataViews.HTTPFile(
                            url: self.metadata.coverImageURL
                        )
                    )
                case Type<MetadataViews.Royalties>():
                    let royalties: [MetadataViews.Royalty] = []
                    for royalty in self.metadata.royalties {
                        royalties.append(
                            MetadataViews.Royalty(
                                receiver: getAccount(royalty.recipient).getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver),
                                cut: royalty.percentage,
                                description: royalty.description
                            )
                        )
                    }
                    return MetadataViews.Royalties(royalties)
                case Type<MetadataViews.ExternalURL>():
                    return MetadataViews.ExternalURL(self.metadata.audioURL)
                case Type<MetadataViews.NFTCollectionData>():
                    return MetadataViews.NFTCollectionData(
                        storagePath: MusicNFT.CollectionStoragePath,
                        publicPath: MusicNFT.CollectionPublicPath,
                        providerPath: /private/musicNFTCollection,
                        publicCollection: Type<&MusicNFT.Collection{MusicNFT.MusicNFTCollectionPublic}>(),
                        publicLinkedType: Type<&MusicNFT.Collection{MusicNFT.MusicNFTCollectionPublic,NonFungibleToken.CollectionPublic,NonFungibleToken.Receiver,MetadataViews.ResolverCollection}>(),
                        providerLinkedType: Type<&MusicNFT.Collection{MusicNFT.MusicNFTCollectionPublic,NonFungibleToken.CollectionPublic,NonFungibleToken.Provider,MetadataViews.ResolverCollection}>(),
                        createEmptyCollectionFunction: (fun (): @NonFungibleToken.Collection {
                            return <-MusicNFT.createEmptyCollection()
                        })
                    )
                case Type<MetadataViews.NFTCollectionDisplay>():
                    let media = MetadataViews.Media(
                        file: MetadataViews.HTTPFile(
                            url: "https://flowtune.ai/logo.png"
                        ),
                        mediaType: "image/png"
                    )
                    return MetadataViews.NFTCollectionDisplay(
                        name: "FlowTune Music NFTs",
                        description: "AI-Generated Music NFTs on Flow Blockchain",
                        externalURL: MetadataViews.ExternalURL("https://flowtune.ai"),
                        squareImage: media,
                        bannerImage: media,
                        socials: {
                            "twitter": MetadataViews.ExternalURL("https://twitter.com/flowtune")
                        } as {String: MetadataViews.ExternalURL}
                    )
            }
            return nil
        }
    }

    /// Collection interface for public access
    pub resource interface MusicNFTCollectionPublic {
        pub fun deposit(token: @NonFungibleToken.NFT)
        pub fun getIDs(): [UInt64]
        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT
        pub fun borrowMusicNFT(id: UInt64): &MusicNFT.NFT? {
            post {
                (result == nil) || (result?.id == id):
                    "Cannot borrow MusicNFT reference: the ID of the returned reference is incorrect"
            }
        }
    }

    /// Collection resource for storing NFTs
    pub resource Collection: MusicNFTCollectionPublic, NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic, MetadataViews.ResolverCollection {
        pub var ownedNFTs: @{UInt64: NonFungibleToken.NFT}

        init () {
            self.ownedNFTs <- {}
        }

        pub fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("missing NFT")
            emit Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }

        pub fun deposit(token: @NonFungibleToken.NFT) {
            let token <- token as! @MusicNFT.NFT
            let id: UInt64 = token.id
            let oldToken <- self.ownedNFTs[id] <- token
            emit Deposit(id: id, to: self.owner?.address)
            destroy oldToken
        }

        pub fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT {
            return (&self.ownedNFTs[id] as &NonFungibleToken.NFT?)!
        }

        pub fun borrowMusicNFT(id: UInt64): &MusicNFT.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = (&self.ownedNFTs[id] as auth &NonFungibleToken.NFT?)!
                return ref as! &MusicNFT.NFT
            }
            return nil
        }

        pub fun borrowViewResolver(id: UInt64): &AnyResource{MetadataViews.Resolver} {
            let nft = (&self.ownedNFTs[id] as auth &NonFungibleToken.NFT?)!
            let musicNFT = nft as! &MusicNFT.NFT
            return musicNFT as &AnyResource{MetadataViews.Resolver}
        }

        destroy() {
            destroy self.ownedNFTs
        }
    }

    /// Minter resource for creating NFTs
    pub resource NFTMinter {
        pub fun mintNFT(
            recipient: &{NonFungibleToken.CollectionPublic},
            metadata: MusicMetadata
        ): UInt64 {
            let newNFT <- create NFT(
                id: MusicNFT.totalSupply,
                metadata: metadata
            )
            
            let nftID = newNFT.id
            emit Minted(id: nftID, recipient: recipient.owner!.address, metadata: {
                "title": metadata.title,
                "artist": metadata.artist,
                "audioURL": metadata.audioURL
            })
            
            recipient.deposit(token: <-newNFT)
            MusicNFT.totalSupply = MusicNFT.totalSupply + UInt64(1)
            
            return nftID
        }
    }

    /// Create an empty Collection
    pub fun createEmptyCollection(): @NonFungibleToken.Collection {
        return <- create Collection()
    }

    /// Get the total supply of MusicNFTs
    pub fun getTotalSupply(): UInt64 {
        return self.totalSupply
    }

    /// Contract initialization
    init() {
        self.totalSupply = 0

        self.CollectionStoragePath = /storage/musicNFTCollection
        self.CollectionPublicPath = /public/musicNFTCollection
        self.MinterStoragePath = /storage/musicNFTMinter

        // Create a Collection resource and save it to storage
        let collection <- create Collection()
        self.account.save(<-collection, to: self.CollectionStoragePath)

        // Create a public capability for the collection
        self.account.link<&MusicNFT.Collection{NonFungibleToken.CollectionPublic, MusicNFT.MusicNFTCollectionPublic, MetadataViews.ResolverCollection}>(
            self.CollectionPublicPath,
            target: self.CollectionStoragePath
        )

        // Create a Minter resource and save it to storage
        let minter <- create NFTMinter()
        self.account.save(<-minter, to: self.MinterStoragePath)

        emit ContractInitialized()
    }
}