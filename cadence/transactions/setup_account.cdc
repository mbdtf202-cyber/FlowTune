import NonFungibleToken from 0x1d7e57aa55817448
import MusicNFT from "../contracts/MusicNFT.cdc"
import Marketplace from "../contracts/Marketplace.cdc"
import RoyaltyDistributor from "../contracts/RoyaltyDistributor.cdc"

/// Setup Account - Initialize user account for FlowTune
/// 
/// This transaction sets up a user's account with all necessary
/// resources and capabilities for using FlowTune.
///
transaction {
    prepare(signer: AuthAccount) {
        // Setup MusicNFT Collection if it doesn't exist
        if signer.borrow<&MusicNFT.Collection>(from: MusicNFT.CollectionStoragePath) == nil {
            let collection <- MusicNFT.createEmptyCollection()
            signer.save(<-collection, to: MusicNFT.CollectionStoragePath)
            
            signer.link<&MusicNFT.Collection{NonFungibleToken.CollectionPublic, MusicNFT.MusicNFTCollectionPublic}>(
                MusicNFT.CollectionPublicPath,
                target: MusicNFT.CollectionStoragePath
            )
        }

        // Setup Marketplace Storefront if it doesn't exist
        if signer.borrow<&Marketplace.Storefront>(from: Marketplace.StorefrontStoragePath) == nil {
            let storefront <- Marketplace.createStorefront()
            signer.save(<-storefront, to: Marketplace.StorefrontStoragePath)
            
            signer.link<&Marketplace.Storefront{Marketplace.StorefrontPublic}>(
                Marketplace.StorefrontPublicPath,
                target: Marketplace.StorefrontStoragePath
            )
        }

        // Setup RoyaltyDistributor if it doesn't exist
        if signer.borrow<&RoyaltyDistributor.Distributor>(from: RoyaltyDistributor.DistributorStoragePath) == nil {
            let distributor <- RoyaltyDistributor.createDistributor()
            signer.save(<-distributor, to: RoyaltyDistributor.DistributorStoragePath)
            
            signer.link<&RoyaltyDistributor.Distributor{RoyaltyDistributor.DistributorPublic}>(
                RoyaltyDistributor.DistributorPublicPath,
                target: RoyaltyDistributor.DistributorStoragePath
            )
        }
    }

    execute {
        log("Account setup completed successfully")
    }
}