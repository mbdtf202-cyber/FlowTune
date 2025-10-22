import BasicMusicNFT from 0xf8d6e0586b0a20c7

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
    let recipientCollectionRef: &{BasicMusicNFT.CollectionPublic}

    prepare(signer: AuthAccount) {
        // Get a reference to the NFTMinter resource in the account's storage
        self.minter = signer.borrow<&BasicMusicNFT.NFTMinter>(from: BasicMusicNFT.MinterStoragePath)
            ?? panic("Could not borrow a reference to the NFT minter")

        // Get the recipient's public account object
        let recipientAccount = getAccount(recipient)

        // Borrow a public reference to the recipients collection
        self.recipientCollectionRef = recipientAccount
            .getCapability(BasicMusicNFT.CollectionPublicPath)
            .borrow<&{BasicMusicNFT.CollectionPublic}>()
            ?? panic("Could not borrow a reference to the recipient's collection")
    }

    execute {
        // Create the metadata
        let metadata = BasicMusicNFT.MusicMetadata(
            title: title,
            artist: artist,
            description: description,
            audioURL: audioURL,
            coverImageURL: coverImageURL,
            duration: duration,
            genre: genre
        )

        // Mint the NFT and deposit it to the recipient's collection
        self.minter.mintNFT(
            recipient: self.recipientCollectionRef,
            metadata: metadata
        )
    }
}