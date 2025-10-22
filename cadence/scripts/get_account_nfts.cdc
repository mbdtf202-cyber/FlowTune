import BasicMusicNFT from 0xf8d6e0586b0a20c7

pub fun main(account: Address): [UInt64] {
    let acct = getAccount(account)
    let collectionRef = acct.getCapability(BasicMusicNFT.CollectionPublicPath)
        .borrow<&{BasicMusicNFT.CollectionPublic}>()
        ?? panic("Could not borrow capability from public collection")
    
    return collectionRef.getIDs()
}