import BasicMusicNFT from 0xf8d6e0586b0a20c7

pub fun main(account: Address, nftID: UInt64): BasicMusicNFT.MusicMetadata? {
    let acct = getAccount(account)
    let collectionRef = acct.getCapability(BasicMusicNFT.CollectionPublicPath)
        .borrow<&{BasicMusicNFT.CollectionPublic}>()
        ?? panic("Could not borrow capability from public collection")
    
    let nft = collectionRef.borrowNFT(id: nftID)
    if nft != nil {
        return nft!.metadata
    }
    return nil
}