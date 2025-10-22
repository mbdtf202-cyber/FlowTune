import NonFungibleToken from 0x1d7e57aa55817448
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868
import MusicNFT from "../contracts/MusicNFT.cdc"
import Marketplace from "../contracts/Marketplace.cdc"

/// Purchase NFT - Buy an NFT from the marketplace
/// 
/// This transaction purchases a listed MusicNFT from the marketplace
///
transaction(sellerAddress: Address, listingID: UInt64, expectedPrice: UFix64) {
    let paymentVault: @FungibleToken.Vault
    let buyerCollection: &{NonFungibleToken.CollectionPublic}
    let storefront: &Marketplace.Storefront{Marketplace.StorefrontPublic}
    let listing: &Marketplace.Listing{Marketplace.StorefrontPublic}
    let buyerAddress: Address

    prepare(signer: AuthAccount) {
        // Get the buyer's address
        self.buyerAddress = signer.address

        // Get the storefront reference
        self.storefront = getAccount(sellerAddress)
            .getCapability<&Marketplace.Storefront{Marketplace.StorefrontPublic}>(Marketplace.StorefrontPublicPath)
            .borrow()
            ?? panic("Could not borrow Storefront from provided address")

        // Get the listing reference
        self.listing = self.storefront.borrowListing(listingID: listingID)
            ?? panic("No Listing with that ID in Storefront")

        // Verify the price
        let price = self.listing.getDetails().price
        assert(price == expectedPrice, message: "Price mismatch")

        // Get the buyer's collection reference
        self.buyerCollection = signer.borrow<&{NonFungibleToken.CollectionPublic}>(from: MusicNFT.CollectionStoragePath)
            ?? panic("Cannot borrow NFT collection receiver from account")

        // Get the payment vault
        let flowVault = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Cannot borrow FlowToken vault from signer storage")
        
        self.paymentVault <- flowVault.withdraw(amount: price)
    }

    execute {
        // Purchase the NFT
        self.storefront.purchase(
            listingID: listingID,
            payment: <-self.paymentVault,
            buyerCollection: self.buyerCollection,
            buyerAddress: self.buyerAddress
        )

        log("NFT purchased successfully!")
        log("Listing ID: ".concat(listingID.toString()))
        log("Buyer: ".concat(self.buyerAddress.toString()))
    }
}