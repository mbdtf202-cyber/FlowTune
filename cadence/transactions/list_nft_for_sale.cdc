import NonFungibleToken from 0x1d7e57aa55817448
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868
import MusicNFT from "../contracts/MusicNFT.cdc"
import Marketplace from "../contracts/Marketplace.cdc"

/// List NFT for Sale - Create a marketplace listing
/// 
/// This transaction lists a MusicNFT for sale on the marketplace
///
transaction(nftID: UInt64, price: UFix64) {
    let storefront: &Marketplace.Storefront
    let nftProvider: &MusicNFT.Collection{NonFungibleToken.Provider}
    let flowReceiver: Capability<&{FungibleToken.Receiver}>

    prepare(signer: AuthAccount) {
        // Get the storefront reference
        self.storefront = signer.borrow<&Marketplace.Storefront>(from: Marketplace.StorefrontStoragePath)
            ?? panic("Could not borrow Storefront from provided address")

        // Get the NFT provider reference
        self.nftProvider = signer.borrow<&MusicNFT.Collection{NonFungibleToken.Provider}>(from: MusicNFT.CollectionStoragePath)
            ?? panic("Could not borrow NFT provider from storage")

        // Get the Flow token receiver capability
        self.flowReceiver = signer.getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
        assert(self.flowReceiver.check(), message: "Missing or mis-typed FlowToken receiver")
    }

    execute {
        // Verify the NFT exists in the collection
        let nft <- self.nftProvider.withdraw(withdrawID: nftID)
        
        // Create the listing
        let listingID = self.storefront.createListing(
            nft: <-nft,
            price: price,
            saleCut: self.flowReceiver
        )

        log("NFT ".concat(nftID.toString()).concat(" listed for sale with listing ID: ").concat(listingID.toString()))
        log("Price: ".concat(price.toString()).concat(" FLOW"))
    }
}