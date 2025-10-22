import NonFungibleToken from 0x1d7e57aa55817448
import MusicNFT from "../contracts/MusicNFT.cdc"

/// Get Collection NFTs - Retrieve all NFTs in a user's collection
/// 
/// This script returns basic information about all NFTs owned by an address
///
pub fun main(address: Address): [{String: AnyStruct}] {
    let account = getAccount(address)
    let nfts: [{String: AnyStruct}] = []
    
    if let collection = account.getCapability<&MusicNFT.Collection{MusicNFT.MusicNFTCollectionPublic}>(MusicNFT.CollectionPublicPath).borrow() {
        let nftIDs = collection.getIDs()
        
        for nftID in nftIDs {
            if let nft = collection.borrowMusicNFT(id: nftID) {
                let metadata = nft.metadata
                nfts.append({
                    "id": nft.id,
                    "title": metadata.title,
                    "artist": metadata.artist,
                    "genre": metadata.genre,
                    "duration": metadata.duration,
                    "coverImageURL": metadata.coverImageURL,
                    "playCount": nft.playCount,
                    "totalEarnings": nft.totalEarnings,
                    "generatedAt": metadata.generatedAt
                })
            }
        }
    }
    
    return nfts
}