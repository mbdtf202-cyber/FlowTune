/// BasicMusicNFT - Standalone Music NFT Contract for Testing
pub contract BasicMusicNFT {

    /// Total supply of MusicNFTs in existence
    pub var totalSupply: UInt64

    /// Events
    pub event ContractInitialized()
    pub event Withdraw(id: UInt64, from: Address?)
    pub event Deposit(id: UInt64, to: Address?)
    pub event Minted(id: UInt64, recipient: Address, title: String)

    /// Named Paths
    pub let CollectionStoragePath: StoragePath
    pub let CollectionPublicPath: PublicPath
    pub let MinterStoragePath: StoragePath

    /// Music Metadata Structure
    pub struct MusicMetadata {
        pub let title: String
        pub let artist: String
        pub let description: String
        pub let audioURL: String
        pub let coverImageURL: String
        pub let duration: UFix64
        pub let genre: String
        pub let createdAt: UFix64

        init(
            title: String,
            artist: String, 
            description: String,
            audioURL: String,
            coverImageURL: String,
            duration: UFix64,
            genre: String
        ) {
            self.title = title
            self.artist = artist
            self.description = description
            self.audioURL = audioURL
            self.coverImageURL = coverImageURL
            self.duration = duration
            self.genre = genre
            self.createdAt = getCurrentBlock().timestamp
        }
    }

    /// NFT Resource Interface
    pub resource interface INFT {
        pub let id: UInt64
    }

    /// Collection Public Interface
    pub resource interface CollectionPublic {
        pub fun deposit(token: @NFT)
        pub fun getIDs(): [UInt64]
        pub fun borrowNFT(id: UInt64): &NFT?
    }

    /// NFT Resource
    pub resource NFT: INFT {
        pub let id: UInt64
        pub let metadata: MusicMetadata

        init(id: UInt64, metadata: MusicMetadata) {
            self.id = id
            self.metadata = metadata
        }
    }

    /// Collection Resource
    pub resource Collection: CollectionPublic {
        pub var ownedNFTs: @{UInt64: NFT}

        init() {
            self.ownedNFTs <- {}
        }

        pub fun withdraw(withdrawID: UInt64): @NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("missing NFT")
            emit Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }

        pub fun deposit(token: @NFT) {
            let id: UInt64 = token.id
            let oldToken <- self.ownedNFTs[id] <- token
            emit Deposit(id: id, to: self.owner?.address)
            destroy oldToken
        }

        pub fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        pub fun borrowNFT(id: UInt64): &NFT? {
            if self.ownedNFTs[id] != nil {
                return (&self.ownedNFTs[id] as &NFT?)!
            } else {
                return nil
            }
        }

        destroy() {
            destroy self.ownedNFTs
        }
    }

    /// Public function to create empty collection
    pub fun createEmptyCollection(): @Collection {
        return <- create Collection()
    }

    /// Minter Resource
    pub resource NFTMinter {
        pub fun mintNFT(recipient: &{CollectionPublic}, metadata: MusicMetadata): UInt64 {
            let newNFT <- create NFT(id: BasicMusicNFT.totalSupply, metadata: metadata)
            let id = newNFT.id
            
            emit Minted(id: id, recipient: recipient.owner!.address, title: metadata.title)
            recipient.deposit(token: <-newNFT)
            
            BasicMusicNFT.totalSupply = BasicMusicNFT.totalSupply + 1
            return id
        }
    }

    /// Public function to get total supply
    pub fun getTotalSupply(): UInt64 {
        return self.totalSupply
    }

    init() {
        self.totalSupply = 0

        self.CollectionStoragePath = /storage/BasicMusicNFTCollection
        self.CollectionPublicPath = /public/BasicMusicNFTCollection
        self.MinterStoragePath = /storage/BasicMusicNFTMinter

        // Create a Collection resource and save it to storage
        let collection <- create Collection()
        self.account.save(<-collection, to: self.CollectionStoragePath)

        // Create a public capability for the collection
        self.account.link<&BasicMusicNFT.Collection{BasicMusicNFT.CollectionPublic}>(
            self.CollectionPublicPath,
            target: self.CollectionStoragePath
        )

        // Create a Minter resource and save it to storage
        let minter <- create NFTMinter()
        self.account.save(<-minter, to: self.MinterStoragePath)

        emit ContractInitialized()
    }
}